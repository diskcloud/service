require("dotenv").config({ path: ".env.local" });
const redisClient = require("../redis");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { match } = require("path-to-regexp");

// 白名单配置 URL: Method
const whiteList = {
  "/login": "POST", // 登录
  "/register": "POST", // 注册
  "/files/:id/preview": "GET", // 文件预览
};

// 路径匹配函数
const isWhitelisted = (url, method) => {
  for (const path in whiteList) {
    const matcher = match(path, { decode: decodeURIComponent });
    if (matcher(url) && whiteList[path] === method) {
      return true;
    }
  }
  return false;
};

const authenticateToken = async (ctx, next) => {
  // token 不存在并且在白名单类，免除校验
  const token = ctx.headers["authorization"]?.replace("Bearer ", "");
  if (isWhitelisted(ctx.path, ctx.method) && !token) {
    await next();
    return;
  }

  try {
    if (!token) {
      ctx.status = 403;
      ctx.body = { message: "Not Logged In" };
      return;
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      ctx.status = 403;
      ctx.body = { message: "No token provided" };
      return;
    }

    // Redis 查看是否存在
    const redisToken = await redisClient.get(`user_login:${decoded.id}`);
    if (!redisToken) {
      ctx.status = 403;
      ctx.body = { message: "Invalid token" };
      return;
    }

    ctx.state.user = decoded;
    ctx.state.token = token;
    await next();
  } catch (error) {
    console.error(error);
    ctx.status = 401;
    ctx.body = { message: "Invalid token" };
  }
};

module.exports = authenticateToken;
