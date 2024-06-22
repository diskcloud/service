const fs = require('fs');
const path = require('path');

// 动态导入 file-type 模块
async function getFileTypeModule() {
  return await import('file-type');
}

async function detectFileType(filePath, file) {
    const fileBuffer = fs.readFileSync(filePath);
    const { fileTypeFromBuffer } = await getFileTypeModule();
    const type = await fileTypeFromBuffer(fileBuffer);
    // 默认mime 和 ext
    const defaultType = {
      ext: path.extname(filePath).slice(1).toLowerCase(),
      mime: file?.mimeType ?? 'application/octet-stream'
    };
    return type ?? defaultType;
}

module.exports = {
  detectFileType,
};
