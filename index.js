const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const tinify = require('tinify');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const sharp = require('sharp');
const { checkAndCreateTable } = require('./utils/checkAndCreateTable');
const pool = require('./utils/db');
const { appendSuffixToFilename } = require('./utils/appendSuffixToFilename');
require('dotenv').config({ path: '.env.local' });

const app = new Koa();
const router = new Router();

tinify.key = process.env.TINIFY_KEY;

const tinifySupportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const imageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/svg+xml'
];

app.use(require('koa-static')(path.join(__dirname, 'public')));

const createDirectories = () => {
  const dirs = [
    path.join(__dirname, 'provisional'),
    path.join(__dirname, 'public', 'files')
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, 'provisional'), // 临时上传目录
      keepExtensions: true // 保留文件扩展名
    }
  })
);

router.post('/upload', async (ctx) => {
  const connection = await pool.getConnection();
  try {
    const files = ctx.request.files.file;
    const fileList = Array.isArray(files) ? files : [files];
    const responses = [];

    const compress = ctx.query.compress !== 'false'; // 默认压缩
    const keepTemp = ctx.query.keepTemp === 'true'; // 默认不保留临时文件
    const isThumb = ctx.query.isThumb === 'true';
    const responseType = ctx.query.type;

    for (const file of fileList) {
      const mimeType = mime.lookup(file.filepath);

      const outputFilePath = path.join(
        __dirname,
        'public',
        'files',
        path.basename(file.filepath)
      );
      let outputFileThumbPath = null;
      if (isThumb && imageMimeTypes.includes(mimeType)) {
        const fileThumbName = appendSuffixToFilename(file.newFilename, 'thumb');

        outputFileThumbPath = path.join(
          __dirname,
          'public',
          'files',
          fileThumbName
        );

        await sharp(file.filepath)
          .resize(200, 200) // 调整图像大小为200x200像素
          .toFile(outputFileThumbPath);
      }

      if (compress && tinifySupportedMimeTypes.includes(mimeType)) {
        await tinify.fromFile(file.filepath).toFile(outputFilePath);
      } else {
        // 如果不支持压缩或者不要求压缩，保留临时文件则复制文件，否则移动文件
        if (keepTemp) {
          fs.copyFileSync(file.filepath, outputFilePath);
        } else {
          fs.renameSync(file.filepath, outputFilePath);
        }
      }

      const fileUrl = `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${path.basename(
        outputFilePath
      )}`;
      const thumb_location = outputFileThumbPath ? `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${path.basename(outputFileThumbPath)}` : null;

      await connection.execute(
        `INSERT INTO files (
          filename, filesize, filelocation, created_by, is_public, thumb_location, is_delete
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          path.basename(outputFilePath),
          fs.statSync(outputFilePath).size,
          fileUrl,
          ctx.query.createdBy || 'anonymous',
          ctx.query.isPublic === 'true',
          thumb_location,
          0 // 假设默认的 `is_delete` 状态为 0（未删除）
        ]
      );

      if (responseType === 'md' && imageMimeTypes.includes(mimeType)) {
        responses.push({
          filepath: `![${path.basename(outputFilePath)}](${fileUrl})`
        });
      } else {
        responses.push({ filepath: fileUrl });
      }

      if (!keepTemp && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
    }

    ctx.body = fileList.length > 1 ? responses : responses[0];
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error processing your request: ' + error.message;
  } finally {
    connection.release();
  }
});

router.get('/files', async (ctx) => {
  const connection = await pool.getConnection();
  try {
    const limit = parseInt(ctx.query.limit, 10) || 10; // 每页数量，默认为 10
    const offset = parseInt(ctx.query.offset, 10) || 0; // 偏移量，默认为 0

    const [rows] = await connection.execute(
      `SELECT * FROM files LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    ctx.body = rows;
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error retrieving files: ' + error.message;
  } finally {
    connection.release();
  }
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(process.env.SERVER_PORT, async () => {
  console.log(`Server is running on ${process.env.INTERNAL_NETWORK_DOMAIN}`);
  console.log(`Server is running on ${process.env.PUBLIC_NETWORK_DOMAIN}`);
  await checkAndCreateTable();
});
