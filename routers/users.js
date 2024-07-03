const Router = require("koa-router");
const redisClient = require("../redis");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAdminAuth = require("../middleware/checkAdminAuth");
require("dotenv").config({ path: ".env.local" });
const Users = require("../models/users");
const { USERS_LOGIN_POST, USER_REST_ID } = require("../types/schema/users");
const { validateBody, validateParams } = require("../types");
const { USER_STATUS } = require("../constants/users");

const router = new Router();

router.post("/login", validateBody(USERS_LOGIN_POST), async (ctx) => {
  const { username, password } = ctx.request.body;

  try {
    const user = await Users.findOne({
      where: { username, status: USER_STATUS.ACTIVE },
    });
    if (!user) {
      ctx.status = 403;
      ctx.body = { message: "Incorrect account or password" };
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      ctx.status = 403;
      ctx.body = { message: "Incorrect account or password" };
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.log(err);
      }
    });

    // 将 token 存储在 Redis 中
    await redisClient.set(`user_login:${user.id}`, token, {
      EX: process.env.USER_LOGIN_TOKEN_EXPIRE_TIME,
    });

    user.update({
      is_login: true,
      login_at: new Date(),
    });

    ctx.body = { token };
  } catch (error) {
    console.error(error);
    ctx.status = 403;
    ctx.body = { message: "Incorrect account or password" };
  }
});

router.post("/register", validateBody(USERS_LOGIN_POST), async (ctx) => {
  const { username, password } = ctx.request.body;

  try {
    const existingUser = await Users.findOne({ where: { username } });
    if (existingUser) {
      ctx.status = 400;
      ctx.body = { message: "Username already taken" };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { id, disk_size, status, created_at, login_at } = await Users.create({
      username,
      password: hashedPassword,
    });
    ctx.status = 201;
    ctx.body = { id, disk_size, status, created_at, username, login_at };
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }
});

router.get("/users/info", async (ctx) => {
  try {
    const user = await Users.findByPk(ctx.state.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (user) {
      ctx.status = 200; // 确保状态码为 200
      ctx.body = user.dataValues;
      return;
    }
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: "User not found" };
      return;
    }
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }
});

router.post("/logout", async (ctx) => {
  const { id } = ctx.state.user;
  if (!ctx.state.token) {
    ctx.status = 200;
    ctx.body = { message: "Invalid Token" };
    return;
  }

  try {
    const user = await Users.findOne({ where: { id } });

    user.update({
      is_login: false,
      logout_at: new Date(),
    });

    // 从 Redis 中删除 token
    await redisClient.del(`user_login:${id}`);

    ctx.status = 200;
    ctx.body = { message: "Logout successful" };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }
});

// 禁用用户
router.patch(
  "/users/:id/disabled",
  validateParams(USER_REST_ID),
  checkAdminAuth,
  async (ctx) => {
    const { id } = ctx.params;
    const user = await Users.findOne({ where: { id } });

    if (!user.id) {
      ctx.status = 404;
      ctx.body = { message: "User not found" };
      return;
    }

    // 强制下线 Token
    await redisClient.del(`user_login:${id}`);

    // 禁用此账号
    user.update({
      status: "BANNED",
      logout_at: new Date(),
    });

    ctx.status = 204;
  }
);

module.exports = router;
