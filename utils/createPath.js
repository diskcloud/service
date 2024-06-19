const fs = require('fs');
const path = require('path');

// 检查路径是否为文件
function isFile(filePath) {
  return path.extname(filePath) !== '';
}

// 递归创建目录
function mkdirsSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    return;
  }
  const parentDir = path.dirname(dirPath);
  mkdirsSync(parentDir);
  fs.mkdirSync(dirPath);
}

// 创建文件，如果父目录不存在则递归创建
function createFile(filePath) {
  const dirPath = path.dirname(filePath);
  mkdirsSync(dirPath);
  fs.writeFileSync(filePath, '');
}

// 创建目录或文件
function createPath(filePath) {
  if (isFile(filePath)) {
    createFile(filePath);
  } else {
    mkdirsSync(filePath);
  }
}

module.exports = {
  createPath,
  createPath
};
