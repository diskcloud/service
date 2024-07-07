const cors = require("@koa/cors");

module.exports = () =>
  cors({
    origin: "http://localhost:5173/", // 允许的来源
    allowMethods: ["GET", "POST"], // 允许的方法
  });
