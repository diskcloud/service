require("dotenv").config({ path: ".env.local" });
const redisClient = require("../redis");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

// 白名单配置 URL: Method
const whiteList = {
  "/login": "POST", // 登录
  "/register": "POST", // 注册
};

const authenticateToken = async (ctx, next) => {
  const isWhite = whiteList[ctx.url];
  if (isWhite === ctx.method) {
    await next();
    return;
  }

  try {
    const token = ctx.headers["authorization"]?.replace("Bearer ", "");
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
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }
};

module.exports = authenticateToken;
