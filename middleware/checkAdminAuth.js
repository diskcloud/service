// 校验用户是否为管理员的中间件
const Users = require("../models/users");

async function checkAdminAuth(ctx, next) {
  try {
    const { id } = ctx.state.user;

    const user = await Users.findOne({
      where: { id },
      attributes: ["is_admin"],
    });

    // 检查用户是否为管理员
    if (!user.is_admin) {
      ctx.status = 403;
      ctx.body = { message: "Access denied. Admins only." };
      return;
    }

    // ctx.state.user = decoded;

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: "Unauthorized" };
  }
}

module.exports = checkAdminAuth;
