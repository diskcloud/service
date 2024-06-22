const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const tinify = require('tinify');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { checkAndCreateTable } = require('./utils/checkAndCreateTable');
const pool = require('./utils/db');
const { appendSuffixToFilename } = require('./utils/appendSuffixToFilename');
const { v4: uuidv4 } = require('uuid');
const { detectFileType } = require('./utils/detectFileType');
const { imageMimeTypes, tinifySupportedMimeTypes} = require('./constants/file')
require('dotenv').config({ path: '.env.local' });

const app = new Koa();
const router = new Router();

tinify.key = process.env.TINIFY_KEY;

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
    const isThumb = Number(ctx.query.isThumb === 'true');
    const isPublic = Number(ctx.query.isPublic === 'true');
    const responseType = ctx.query.type;

    for (const file of fileList) {
      const fileId = uuidv4(); // 生成文件唯一ID

      const outputFilePath = path.join(
        __dirname,
        'public',
        'files',
        fileId + path.extname(file.filepath) // 使用UUID作为文件名称
      );

      const { mime, ext } = await detectFileType(file.filepath, file);

      let outputFileThumbPath = null;
      if (isThumb && imageMimeTypes.includes(mime)) {
        const fileThumbName = `${fileId}_thumb${path.extname(file.filepath)}`; // 缩略图文件名称

        outputFileThumbPath = path.join(
          __dirname,
          'public',
          'files',
          fileThumbName
        );

        await sharp(file.filepath)
          .resize(200, 200) // 调整图像大小为200x200像素
          .toFile(outputFileThumbPath);
      } else if(isThumb) {
        const back_thumbs = {
          video: path.join(__dirname, 'public', 'icons', 'video.png'),
          sheet: path.join(__dirname, 'public', 'icons', 'xlsx.png'),
          pdf: path.join(__dirname, 'public', 'icons', 'pdf.png'),
          document: path.join(__dirname, 'public', 'icons', 'doc.png'),
        }

        const unknown = path.join(__dirname, 'public', 'icons', 'unknown_file_types.png');

        const thumb = Object.keys(back_thumbs).find(key => mime.includes(key));

        outputFileThumbPath = back_thumbs[thumb] ?? unknown;
      }

      if (compress && tinifySupportedMimeTypes.includes(mime)) {
        await tinify.fromFile(file.filepath).toFile(outputFilePath);
      } else {
        // 如果不支持压缩或者不要求压缩，保留临时文件则复制文件，否则移动文件
        if (keepTemp) {
          fs.copyFileSync(file.filepath, outputFilePath);
        } else {
          fs.renameSync(file.filepath, outputFilePath);
        }
      }

      const fileUrl = `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${fileId}`;
      const thumb_location = outputFileThumbPath ? `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${fileId}?type=thumb` : null;

      await connection.execute(
        `INSERT INTO files (
            id, 
            filename, 
            filesize, 
            filelocation, 
            real_file_location, 
            created_by, 
            is_public, 
            thumb_location, 
            is_thumb, 
            is_delete, 
            real_file_thumb_location,
            mime,
            ext
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileId, // 使用UUID作为ID
          path.basename(outputFilePath),
          fs.statSync(outputFilePath).size,
          fileUrl,
          outputFilePath, // 存储实际文件路径
          ctx.query.createdBy || 'anonymous',
          isPublic,
          thumb_location,
          isThumb,
          0,
          outputFileThumbPath,
          mime,
          ext
        ]
      );

      if (responseType === 'md' && imageMimeTypes.includes(mime)) {
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
    const type = ctx.query.type ?? ''; // 获取查询参数中的类型

    const types = {
      image: 'image',
      video: 'video',
      all: '',
    }
    
    const excludedTypes = ['image', 'video']; // 要排除的类型
    
    let mimeCondition = ''; // 初始化mime条件
    
    // 构建 mime 条件
    if (type === 'file') {
      mimeCondition = excludedTypes.map(t => `mime NOT LIKE '%${t}%'`).join(' AND ');
    } else if (types[type]) {
      mimeCondition = `mime LIKE '%${types[type]}%'`;
    }
    
    // 构建完整的 SQL 语句
    const sql = `
      SELECT  
        created_by, 
        created_at, 
        public_by, 
        public_expiration, 
        updated_at, 
        updated_by, 
        filesize, 
        filename, 
        filelocation, 
        thumb_location, 
        is_public 
      FROM 
        files 
      WHERE 
        is_delete = 0
        AND is_public = 1
        ${mimeCondition ? `AND ${mimeCondition}` : ''}
      LIMIT ? OFFSET ?`;
    
    // 执行查询
    const [rows] = await connection.execute(
      sql,
      [String(limit), String(offset)]
    );
    

    ctx.body = rows;
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error retrieving files: ' + error.message;
  } finally {
    connection.release();
  }
});

router.get('/files/:id', async (ctx) => {
  const { id } = ctx.params;
  const { type } = ctx.query; // 获取查询参数 'type'，可以是 'thumb' 或 'original'
  const connection = await pool.getConnection();

  try {
    // 查询文件数据，只获取必要字段
    const [rows] = await connection.execute(
      `
      SELECT 
        filename, 
        is_delete, 
        is_public, 
        public_expiration, 
        real_file_location, 
        real_file_thumb_location, 
        is_thumb,
        mime,
        ext
      FROM files 
      WHERE id = ? 
      AND is_delete = 0 
      AND (is_public = 1 AND (public_expiration IS NULL OR public_expiration > NOW()))`, 
      [id]
    );

    if (rows.length === 0) {
      ctx.status = 404;
      ctx.body = { message: 'File not found or not accessible' };
      return;
    }

    const file = rows[0];

    let fileLocation = file.real_file_location;
    // 根据查询参数 'type' 决定返回原图或缩略图
    if(file.is_thumb && type === 'thumb') {
        fileLocation = file.real_file_thumb_location;
    }

    // 检查文件是否存在
    if (!fs.existsSync(fileLocation)) {
      ctx.status = 404;
      ctx.body = { message: 'File not found' };
      return;
    }
    const { mime } = await detectFileType(fileLocation);
    // 设置响应头
    ctx.set('Content-Type', mime);
    ctx.set('Content-Disposition', `inline; filename="${file.filename}"`);

    // 返回文件流
    ctx.body = fs.createReadStream(fileLocation);
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Internal server error', error: error.message };
  } finally {
    connection.release(); // 释放连接
  }
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(process.env.SERVER_PORT, async () => {
  console.log(`Server is running on ${process.env.INTERNAL_NETWORK_DOMAIN}`);
  console.log(`Server is running on ${process.env.PUBLIC_NETWORK_DOMAIN}`);
  await checkAndCreateTable();
});
