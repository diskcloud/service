const { koaBody } = require("koa-body");
const path = require("path");

module.exports = () =>
  koaBody({
    multipart: true,
    // 解决 DELETE 没法获取ids的问题
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
    formidable: {
      uploadDir: path.join(__dirname, "..", "provisional"), // 临时上传目录
      keepExtensions: true, // 保留文件扩展名
    },
  });
