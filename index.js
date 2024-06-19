const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const tinify = require('tinify');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const mime = require('mime-types'); // 需要安装 mime-types 包
const { appendSuffixToFilename } = require('./utils/appendSuffixToFilename');
require('dotenv').config({ path: '.env.local' });

const app = new Koa();
const router = new Router();

// TinyPNG API 密钥
tinify.key = process.env.TINIFY_KEY;

// Tinify 支持的文件格式
const tinifySupportedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

// 所有图片格式
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

// 设置静态文件服务目录
app.use(require('koa-static')(path.join(__dirname, 'public')));

// 创建必要的目录
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

// 配置 koaBody 中间件处理文件上传
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(__dirname, 'provisional'), // 临时上传目录
      keepExtensions: true // 保留文件扩展名
    }
  })
);

// 文件上传和压缩的路由
router.post('/upload', async (ctx) => {
  try {
    // 获取上传的文件
    const files = ctx.request.files.file;
    const fileList = Array.isArray(files) ? files : [files];
    const responses = [];

    // 检查是否需要压缩
    const compress = ctx.query.compress !== 'false'; // 默认压缩
    // 检查是否保留临时文件
    const keepTemp = ctx.query.keepTemp === 'true'; // 默认不保留临时文件

    const isThumb = ctx.query.isThumb === 'true';

    // 获取请求的返回类型
    const responseType = ctx.query.type;

    for (const file of fileList) {
      // 获取文件的 MIME 类型
      const mimeType = mime.lookup(file.filepath);

      // 生成输出文件路径
      const outputFilePath = path.join(
        __dirname,
        'public',
        'files',
        path.basename(file.filepath)
      );

      if (isThumb & imageMimeTypes.includes(mimeType)) {
        const fileThumbName = appendSuffixToFilename(file.newFilename, 'thumb');
        const outputFileThumbPath = path.join(
          __dirname,
          'public',
          'files',
          fileThumbName
        );
        await sharp(file.filepath)
          .resize(200, 200) // 调整图像大小为200x200像素
          .toFile(outputFileThumbPath, (err, info) => {
            // 返回错误信息和一些信息到控制台
            console.log(err, info);
          });
      }

      if (compress && tinifySupportedMimeTypes.includes(mimeType)) {
        // 如果文件类型受 Tinify 支持且要求压缩，使用 TinyPNG API 压缩文件
        await tinify.fromFile(file.filepath).toFile(outputFilePath);
      } else {
        // 如果不支持压缩或者不要求压缩，保留临时文件则复制文件，否则移动文件
        if (keepTemp) {
          fs.copyFileSync(file.filepath, outputFilePath);
        } else {
          fs.renameSync(file.filepath, outputFilePath);
        }
      }

      // 构建文件 URL
      const fileUrl = `${process.env.FILE_DOMAIN}/files/${path.basename(
        outputFilePath
      )}`;

      if (responseType === 'md' && imageMimeTypes.includes(mimeType)) {
        // 如果文件是图片格式且请求类型是 'md'，返回 Markdown 格式
        responses.push({
          filepath: `![${path.basename(outputFilePath)}](${fileUrl})`
        });
      } else {
        // 否则返回普通 URL
        responses.push({ filepath: fileUrl });
      }

      if (!keepTemp && fs.existsSync(file.filepath)) {
        // 删除临时上传文件
        fs.unlinkSync(file.filepath);
      }
    }

    // 返回响应
    ctx.body = fileList.length > 1 ? responses : responses[0];
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error processing your request: ' + error.message;
  }
});

// 获取目录下的所有文件的路由
router.get('/files', async (ctx) => {
  try {
    // 目标目录
    const directoryPath = path.join(__dirname, 'public', 'files');
    const files = fs.readdirSync(directoryPath);
    const fileList = [];

    // 获取参数
    const fileType = ctx.query.type || 'all'; // 默认是 'all'

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      const mimeType = mime.lookup(filePath);
      const stats = fs.statSync(filePath);

      // 根据类型筛选文件
      if (
        (fileType === 'images' && imageMimeTypes.includes(mimeType)) ||
        (fileType === 'files' && !imageMimeTypes.includes(mimeType)) ||
        fileType === 'all'
      ) {
        fileList.push({
          filename: file,
          url: `${process.env.DOMAIN}/files/${file}`,
          size: stats.size, // 文件大小（字节）
          createdAt: stats.birthtime, // 文件创建时间
          modifiedAt: stats.mtime // 文件修改时间
        });
      }
    });

    ctx.body = fileList;
  } catch (error) {
    ctx.status = 500;
    ctx.body = 'Error retrieving files: ' + error.message;
  }
});

// 启动服务器
app.use(router.routes()).use(router.allowedMethods());

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is running on ${process.env.SERVER_DOMAIN}`);
});
