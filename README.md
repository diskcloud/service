<p align="center">
  <a href="https://github.com/diskcloud/service">
    <img width="150" src="./public/logo.png">
  </a>
</p>

<p align="center">
<img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/diskcloud/service">
<img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues-pr/diskcloud/service">
<img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/diskcloud/service">
</p>

## Example

[![YouTube](https://img.youtube.com/vi/5w1dCYBrf2k/0.jpg)](https://youtu.be/5w1dCYBrf2k)

### 支持功能
> 目前均为免费版本，Plus 版本还在规划中，Lite 和 Full 版本永久免费。

| 功能         | Lite（缩减版） | Full（全量版） | Plus（增强版）      |
|--------------|----------------|----------------|--------------|
| 数据出入库   | 否             | 是             | 是           |
| 缩略图       | 否             | 是             | 是           |
| 图片压缩     | 是             | 是             | 是           |
| 返回 md 格式 | 是             | 是             | 是           |
| 保留原始文件 | 是             | 是             | 是           |
| 文件水印     | 否             | 是             | 是           |
| 自动定时备份     | 否             | 否             | 是           |
| 公开失效时间 | 否             | 否             | 是           |
| 高级搜索功能 | 否             | 否             | 是           |

### 使用方法

```shell
yarn install

yarn dev
```

> 启动完成之后，会自动创建 resource 作为资源文件夹，而 provisional 会作为临时文件夹。后续会考虑开启定时任务进行清理。


### 环境变量

创建一个 `.env.local` 文件，在里面配置对应的环境变量

```env
TINIFY_KEY= #Tinify 压缩图片的key。如果不需要图片压缩则可以不写
INTERNAL_NETWORK_DOMAIN=http://localhost:3000
PUBLIC_NETWORK_DOMAIN=http://localhost:3000
SERVER_PORT=3000
DIALECT=mysql
MYSQL_DATABASE=
MYSQL_HOST=
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_PORT=3306
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
USER_LOGIN_TOKEN_EXPIRE_TIME=3600
JWT_EXPIRES_IN=1h
JWT_SECRET=
```

## Contributors 💪

<a href="https://github.com/diskcloud/service/graphs/contributors"><img src="https://opencollective.com/diskcloud/contributors.svg?width=890" /></a>
