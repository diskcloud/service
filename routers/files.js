const Router = require('koa-router');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises; // 使用 fs.promises 进行异步操作
const sharp = require('sharp');
const tinify = require('tinify');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { detectFileType } = require('../utils/detectFileType');
const File = require('../models/files');
const { imageMimeTypes, tinifySupportedMimeTypes } = require('../constants/file');

tinify.key = process.env.TINIFY_KEY;

const router = new Router();
const uploadDirectory = path.join(__dirname, '..', 'resource'); // 修改后的上传目录
const iconsDirectory = path.join(__dirname, '..', 'public', 'icons');

// 获取实际文件路径
const getRealFilePath = (fileId, ext) => path.join(uploadDirectory, `${fileId}${ext}`);

// 获取实际缩略图路径
const getRealThumbPath = (fileId) => path.join(uploadDirectory, `${fileId}_thumb.png`);

// 获取默认缩略图路径
const getDefaultThumbPath = (mime) => {
  const backThumbs = {
    video: 'video.png',
    sheet: 'xlsx.png',
    pdf: 'pdf.png',
    zip: 'zip.png',
    document: 'doc.png',
    default: 'unknown_file_types.png',
  };

  const thumb = Object.keys(backThumbs).find(key => mime.includes(key));
  return path.join(iconsDirectory, backThumbs[thumb] ?? backThumbs.default);
};

// 处理文件上传
router.post('/upload', async (ctx) => {
  try {
    const files = ctx.request.files.file;
    const fileList = Array.isArray(files) ? files : [files];
    const responses = [];

    const shouldCompress = ctx.query.compress !== 'false';
    const shouldKeepTemp = ctx.query.keepTemp === 'true';
    const shouldGenerateThumb = ctx.query.isThumb === 'true';
    const isFilePublic = ctx.query.isPublic === 'true';
    const responseType = ctx.query.type;

    for (const file of fileList) {
      const fileId = uuidv4();
      const ext = path.extname(file.filepath);
      const realFilePath = getRealFilePath(fileId, ext);

      const { mime, ext: fileExt } = await detectFileType(file.filepath, file);
      let realThumbPath = null;

      if (shouldGenerateThumb && imageMimeTypes.includes(mime)) {
        realThumbPath = getRealThumbPath(fileId);
        await sharp(file.filepath)
          .resize(200, 200)
          .toFile(realThumbPath);
      } else if (shouldGenerateThumb) {
        realThumbPath = getDefaultThumbPath(mime);
      }

      if (shouldCompress && tinifySupportedMimeTypes.includes(mime)) {
        await tinify.fromFile(file.filepath).toFile(realFilePath);
      } else {
        if (shouldKeepTemp) {
          await fsp.copyFile(file.filepath, realFilePath);
        } else {
          await fsp.rename(file.filepath, realFilePath);
        }
      }

      const fileUrl = `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${fileId}`;
      const thumbUrl = shouldGenerateThumb ? `${fileUrl}?type=thumb` : null;

      await File.create({
        id: fileId,
        filename: path.basename(realFilePath),
        filesize: (await fsp.stat(realFilePath)).size,
        filelocation: fileUrl,
        real_file_location: realFilePath,
        created_by: ctx.query.createdBy || 'anonymous',
        is_public: isFilePublic,
        thumb_location: thumbUrl,
        is_thumb: shouldGenerateThumb,
        is_delete: false,
        real_file_thumb_location: realThumbPath,
        mime,
        ext: fileExt
      });

      const response = { filepath: fileUrl };
      if (responseType === 'md' && imageMimeTypes.includes(mime)) {
        response.filepath = `![${path.basename(realFilePath)}](${fileUrl})`;
      }
      responses.push(response);

      if (!shouldKeepTemp && await fsp.access(file.filepath).then(() => true).catch(() => false)) {
        await fsp.unlink(file.filepath);
      }
    }

    ctx.body = fileList.length > 1 ? responses : responses[0];
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Error processing your request', error: error.message };
    console.error('Upload error:', error);
  }
});

// 获取文件列表
router.get('/files', async (ctx) => {
  try {
    const limit = parseInt(ctx.query.limit, 10) || 10; // 每页数量，默认为 10
    const offset = parseInt(ctx.query.offset, 10) || 0; // 偏移量，默认为 0
    const type = ctx.query.type ?? ''; // 获取查询参数中的类型

    const types = {
      image: 'image',
      video: 'video',
      all: '',
    };
    
    const excludedTypes = ['image', 'video']; // 要排除的类型

    let mimeCondition = {}; // 初始化 mime 条件

    // 构建 mime 条件
    if (type === 'file') {
      mimeCondition = {
        [Op.and]: excludedTypes.map(t => ({
          mime: {
            [Op.notLike]: `%${t}%`
          }
        }))
      };
    } else if (types[type]) {
      mimeCondition = {
        mime: {
          [Op.like]: `%${types[type]}%`
        }
      };
    }

    const files = await File.findAll({
      where: {
        is_delete: false,
        is_public: true,
        ...mimeCondition
      },
      limit,
      offset,
      attributes: [
        'created_by', 
        'created_at', 
        'public_by', 
        'public_expiration', 
        'updated_at', 
        'updated_by', 
        'filesize', 
        'filename', 
        'filelocation', 
        'thumb_location', 
        'is_public'
      ]
    });

    ctx.body = files;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Error retrieving files', error: error.message };
    console.error('Retrieve files error:', error);
  }
});

// 获取单个文件信息
router.get('/files/:id', async (ctx) => {
  const { id } = ctx.params;
  const { type } = ctx.query; // 获取查询参数 'type'，可以是 'thumb' 或 'original'

  try {
    const file = await File.findOne({
      where: {
        id,
        is_delete: false,
        is_public: true,
        [Op.or]: [
          { public_expiration: null },
          { public_expiration: { [Op.gt]: new Date() } }
        ]
      },
      attributes: [
        'filename', 
        'is_delete', 
        'is_public', 
        'public_expiration', 
        'real_file_location', 
        'real_file_thumb_location', 
        'is_thumb',
        'mime',
        'ext'
      ]
    });

    if (!file) {
      ctx.status = 404;
      ctx.body = { message: 'File not found or not accessible' };
      return;
    }

    let fileLocation = file.real_file_location;
    // 根据查询参数 'type' 决定返回原图或缩略图
    if (file.is_thumb && type === 'thumb') {
      fileLocation = file.real_file_thumb_location;
    }

    // 检查文件是否存在
    try {
      await fsp.access(fileLocation);
    } catch (err) {
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
    console.error('Get file error:', error);
  }
});

module.exports = router;
