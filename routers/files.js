const Router = require("koa-router");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises; // 使用 fs.promises 进行异步操作
const sharp = require("sharp");
const tinify = require("tinify");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const { detectFileType } = require("../utils/detectFileType");
const Files = require("../models/files");
const JSZip = require("jszip");
const {
  imageMimeTypes,
  tinifySupportedMimeTypes,
} = require("../constants/file");

tinify.key = process.env.TINIFY_KEY;

const router = new Router();
const uploadDirectory = path.join(__dirname, "..", "resource"); // 修改后的上传目录
const iconsDirectory = path.join(__dirname, "..", "public", "icons");

// 获取实际文件路径
const getRealFilePath = (fileId, ext) =>
  path.join(uploadDirectory, `${fileId}${ext}`);

// 获取实际缩略图路径
const getRealThumbPath = (fileId) =>
  path.join(uploadDirectory, `${fileId}_thumb.png`);

// 获取默认缩略图路径
const getDefaultThumbPath = (mime) => {
  const backThumbs = {
    video: "video.png",
    sheet: "xlsx.png",
    pdf: "pdf.png",
    zip: "zip.png",
    document: "doc.png",
    default: "unknown_file_types.png",
  };

  const thumb = Object.keys(backThumbs).find((key) => mime.includes(key));
  return path.join(iconsDirectory, backThumbs[thumb] ?? backThumbs.default);
};

// 处理文件上传
router.post("/files", async (ctx) => {
  try {
    const files = ctx.request.files.file;
    const fileList = Array.isArray(files) ? files : [files];
    const responses = [];

    const shouldCompress = ctx.query.compress !== "false";
    const shouldKeepTemp = ctx.query.keepTemp === "true";
    const shouldGenerateThumb = ctx.query.isThumb === "true";
    const isFilePublic = ctx.query.isPublic === "true";
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

      const fileUrl = `${process.env.PUBLIC_NETWORK_DOMAIN}/files/${fileId}/preview`;
      const thumbUrl = shouldGenerateThumb ? `${fileUrl}?type=thumb` : null;

      await Files.create({
        id: fileId,
        filename: path.basename(realFilePath),
        file_size: (await fsp.stat(realFilePath)).size,
        file_location: fileUrl,
        real_file_location: realFilePath,
        created_by: ctx.query.createdBy || "anonymous",
        is_public: isFilePublic,
        thumb_location: thumbUrl,
        is_thumb: shouldGenerateThumb,
        is_delete: false,
        real_file_thumb_location: realThumbPath,
        mime,
        ext: fileExt,
      });

      const response = { filepath: fileUrl };
      if (responseType === "md" && imageMimeTypes.includes(mime)) {
        response.filepath = `![${path.basename(realFilePath)}](${fileUrl})`;
      }
      responses.push(response);

      if (
        !shouldKeepTemp &&
        (await fsp
          .access(file.filepath)
          .then(() => true)
          .catch(() => false))
      ) {
        await fsp.unlink(file.filepath);
      }
    }
    ctx.status(201);
    ctx.body = fileList.length > 1 ? responses : responses[0];
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "Error processing your request",
      error: error.message,
    };
    console.error("Upload error:", error);
  }
});

// 获取文件列表
router.get("/files", async (ctx) => {
  try {
    const limit = parseInt(ctx.query.limit, 10) || 10; // 每页数量，默认为 10
    const offset = parseInt(ctx.query.offset, 10) || 0; // 偏移量，默认为 0
    const type = ctx.query.type ?? ""; // 获取查询参数中的类型

    const types = {
      image: "image",
      video: "video",
      all: "",
    };

    const excludedTypes = ["image", "video"]; // 要排除的类型

    let mimeCondition = {}; // 初始化 mime 条件

    // 构建 mime 条件
    if (type === "file") {
      mimeCondition = {
        [Op.and]: excludedTypes.map((t) => ({
          mime: {
            [Op.notLike]: `%${t}%`,
          },
        })),
      };
    } else if (types[type]) {
      mimeCondition = {
        mime: {
          [Op.like]: `%${types[type]}%`,
        },
      };
    }

    const { rows, count } = await Files.findAndCountAll({
      where: {
        is_delete: false,
        is_public: true,
        ...mimeCondition,
      },
      limit,
      offset,
      attributes: [
        "created_by",
        "created_at",
        "public_by",
        "public_expiration",
        "updated_at",
        "updated_by",
        "file_size",
        "filename",
        "file_location",
        "thumb_location",
        "is_public",
      ],
    });

    ctx.body = {
      items: rows,
      total: count,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Error retrieving files", error: error.message };
    console.error("Retrieve files error:", error);
  }
});

// 获取单个文件信息
router.get("/files/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const file = await Files.findOne({
      where: {
        id,
        is_delete: false,
        is_public: true,
        [Op.or]: [
          { public_expiration: null },
          { public_expiration: { [Op.gt]: new Date() } },
        ],
      },
      attributes: [
        "id",
        "filename",
        "is_public",
        "public_expiration",
        "is_thumb",
        "file_size",
        "file_location",
        "thumb_location",
        "mime",
        "ext",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
      ],
    });

    if (!file) {
      ctx.status = 404;
      ctx.body = { message: "File not found or not accessible" };
      return;
    }

    ctx.body = file;

    // 返回文件流
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Internal server error", error: error.message };
    console.error("Get file error:", error);
  }
});

// 编辑文件信息接口
router.put('/files/:id', async (ctx) => {
  const { id } = ctx.params;
  const {
    filename,
    is_public,
    updated_by,
    public_expiration,
    public_by,
  } = ctx.request.body;

  try {
    // 查找文件
    const file = await Files.findOne({
      where: {
        id,
        is_delete: false,
      }
    });

    if (!file) {
      ctx.status = 404;
      ctx.body = { message: 'File not found' };
      return;
    }

    // 更新文件信息
    await file.update({
      filename,
      is_public,
      updated_by,
      updated_at: new Date(),
      public_expiration,
      public_by,
    });

    const updatedFile = {
      id: file.id,
      filename: file.filename,
      is_public: file.is_public,
      public_expiration: file.public_expiration,
      is_thumb: file.is_thumb,
      file_size: file.file_size,
      file_location: file.file_location,
      thumb_location: file.thumb_location,
      mime: file.mime,
      ext: file.ext,
      created_at: file.created_at,
      created_by: file.created_by,
      updated_at: file.updated_at,
      updated_by: file.updated_by,
    };

    // 返回更新后的文件信息
    ctx.body = updatedFile;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Error updating file information', error: error.message };
    console.error('Update file error:', error);
  }
});


// 文件预览
router.get("/files/:id/preview", async (ctx) => {
  const { id } = ctx.params;
  const { type } = ctx.query; // 获取查询参数 'type'，可以是 'thumb' 或 'original'

  try {
    const file = await Files.findOne({
      where: {
        id,
        is_delete: false,
        is_public: true,
        [Op.or]: [
          { public_expiration: null },
          { public_expiration: { [Op.gt]: new Date() } },
        ],
      },
      attributes: [
        "filename",
        "is_public",
        "public_expiration",
        "real_file_location",
        "real_file_thumb_location",
        "is_thumb",
        "mime",
        "ext",
      ],
    });

    if (!file) {
      ctx.status = 404;
      ctx.body = { message: "File not found or not accessible" };
      return;
    }

    let fileLocation = file.real_file_location;
    // 根据查询参数 'type' 决定返回原图或缩略图
    if (file.is_thumb && type === "thumb") {
      fileLocation = file.real_file_thumb_location;
    }

    // 检查文件是否存在
    try {
      await fsp.access(fileLocation);
    } catch (err) {
      ctx.status = 404;
      ctx.body = { message: "File not found" };
      return;
    }

    const { mime } = await detectFileType(fileLocation);
    // 设置响应头
    ctx.set("Content-Type", mime);
    ctx.set("Content-Disposition", `inline; filename="${file.filename}"`);

    // 返回文件流
    ctx.body = fs.createReadStream(fileLocation);
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Internal server error", error: error.message };
    console.error("Get file error:", error);
  }
});

// 单文件下载
router.get("/files/:id/export", async (ctx) => {
  const { id } = ctx.params;

  try {
    const file = await Files.findOne({
      where: {
        id: id,
        is_delete: false,
        [Op.or]: [
          { public_expiration: null },
          { public_expiration: { [Op.gt]: new Date() } },
        ],
      },
      attributes: ["filename", "real_file_location", "ext"],
    });

    if (!file) {
      ctx.status = 404;
      ctx.body = { message: "No valid files found for the provided id" };
      return;
    }
    // 单文件下载
    const filePath = file.real_file_location;
    const fileName = file.filename;

    // 检查文件是否存在
    try {
      await fsp.access(filePath);
    } catch (err) {
      ctx.status = 404;
      ctx.body = { message: "File not found" };
      return;
    }
    const { mime } = await detectFileType(filePath);

    // 设置响应头
    ctx.set("Content-Type", mime);
    ctx.set("Content-Disposition", `attachment; filename="${fileName}"`);

    // 返回文件流
    ctx.body = fs.createReadStream(filePath);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "Error processing your download request",
      error: error.message,
    };
    console.error("Download error:", error);
  }
});

// 批量下载
router.get("/files/export", async (ctx) => {
  const fileIds = ctx.query.ids ? ctx.query.ids.split(",") : [];

  if (fileIds.length === 0) {
    ctx.status = 400;
    ctx.body = { message: "No file ids provided for download" };
    return;
  }

  try {
    const files = await Files.findAll({
      where: {
        id: { [Op.in]: fileIds },
        is_delete: false,
        [Op.or]: [
          { public_expiration: null },
          { public_expiration: { [Op.gt]: new Date() } },
        ],
      },
      attributes: ["filename", "real_file_location", "ext"],
    });

    if (files.length === 0) {
      ctx.status = 404;
      ctx.body = { message: "No valid files found for the provided ids" };
      return;
    }

    if (files.length === 1) {
      // 单文件下载
      const file = files[0];
      const filePath = file.real_file_location;
      const fileName = file.filename;

      // 检查文件是否存在
      try {
        await fsp.access(filePath);
      } catch (err) {
        ctx.status = 404;
        ctx.body = { message: "File not found" };
        return;
      }
      const { mime } = await detectFileType(filePath);

      // 设置响应头
      ctx.set("Content-Type", mime);
      ctx.set("Content-Disposition", `attachment; filename="${fileName}"`);

      // 返回文件流
      ctx.body = fs.createReadStream(filePath);
    } else {
      // 多文件下载，打包成 ZIP
      const zip = new JSZip();

      for (const file of files) {
        const filePath = file.real_file_location;
        const fileName = file.filename;

        // 确保文件存在
        try {
          await fsp.access(filePath);
          const fileData = await fsp.readFile(filePath);
          zip.file(fileName, fileData);
        } catch (err) {
          console.error(`File not found: ${filePath}`, err);
        }
      }

      const zipContent = await zip.generateAsync({ type: "nodebuffer" });

      // 设置响应头
      ctx.set("Content-Type", "application/zip");
      ctx.set("Content-Disposition", 'attachment; filename="files.zip"');

      // 返回 ZIP 内容
      ctx.body = zipContent;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "Error processing your download request",
      error: error.message,
    };
    console.error("Download error:", error);
  }
});

module.exports = router;
