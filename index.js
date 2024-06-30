// app.js
const Koa = require("koa");
const { koaBody } = require("koa-body");
const path = require("path");
const fs = require("fs");
const sequelize = require("./utils/dbInstance");
const filesRouter = require("./routers/files");
const usersRouter = require("./routers/users");
const redisClient = require("./redis");
const authenticateToken = require("./middleware/authenticateToken");

require("dotenv").config({ path: ".env.local" });

const app = new Koa();

app.use(require("koa-static")(path.join(__dirname, "public")));

const createDirectories = () => {
  const dirs = [
    path.join(__dirname, "provisional"),
    path.join(__dirname, "resource"),
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

app.use(authenticateToken);

app.use(
  koaBody({
    multipart: true,
    // 解决 DELETE 没法获取ids的问题
    parsedMethods: ["POST", "PUT", "PATCH", "DELETE"],
    formidable: {
      uploadDir: path.join(__dirname, "provisional"), // 临时上传目录
      keepExtensions: true, // 保留文件扩展名
    },
  })
);

// 挂载文件路由
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(filesRouter.routes()).use(filesRouter.allowedMethods());

app.listen(process.env.SERVER_PORT, async () => {
  await redisClient.connect();
  await sequelize.sync();
  console.log(`Server is running on ${process.env.INTERNAL_NETWORK_DOMAIN}`);
  console.log(`Server is running on ${process.env.PUBLIC_NETWORK_DOMAIN}`);
});
