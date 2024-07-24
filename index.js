// app.js
const Koa = require("koa");
const sequelize = require("./utils/dbInstance");
const filesRouter = require("./routers/files");
const usersRouter = require("./routers/users");
const redisClient = require("./redis");
const authenticateToken = require("./middleware/authenticateToken");
const koaBody = require("./middleware/koaBody");
const cors = require("./middleware/cors");
const createInitDir = require("./utils/createInitDir");

require("./models");
require("./schedules/fileRecover");
require("dotenv").config({ path: ".env.local" });

const app = new Koa();

app.use(cors());

// app.use(authenticateToken);

app.use(koaBody());

// 挂载文件路由
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(filesRouter.routes()).use(filesRouter.allowedMethods());

app.listen(process.env.SERVER_PORT, async () => {
  createInitDir();
  await redisClient.connect();
  await sequelize.sync();
  console.log(`Server is running on ${process.env.INTERNAL_NETWORK_DOMAIN}`);
});
