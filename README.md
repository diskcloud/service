# upload-file-service
nodejs 实现文件上传功能

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

[![YouTube](https://img.youtube.com/vi/5w1dCYBrf2k/0.jpg)](https://youtu.be/5w1dCYBrf2k)

### 使用方法

```shell
yarn install

yarn dev
```

> 启动完成之后，会自动创建 resource 作为资源文件夹，而 provisional 会作为临时文件夹。后续会考虑开启定时任务进行清理。

### 目录结构

```shell
├── LICENSE
├── README.md
├── constants
│   └── file.js
├── index.js
├── models # 表模型
│   └── files.js
├── package.json
├── public
│   ├── icons
│   │   ├── doc.png
│   │   ├── document.png
│   │   ├── folders.png
│   │   ├── pdf.png
│   │   ├── psd.png
│   │   ├── shared_folders.png
│   │   ├── unknown_file_types.png
│   │   ├── video.png
│   │   ├── xlsx.png
│   │   └── zip.png
│   └── index.html
├── routers # 路由
│   └── files.js
├── utils
│   ├── createPath.js
│   ├── dbInstance.js
│   ├── detectFileType.js
│   └── responseFormatter.js
└── yarn.lock
```

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
```

### 创建表的字段说明

> 启动项目则会，自动创建创建 `files` 表结构

```sql
CREATE TABLE files (
    id VARCHAR(50) DEFAULT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT(20) NOT NULL,
    file_location VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_public TINYINT(1) DEFAULT '0',
    public_expiration TIMESTAMP NULL DEFAULT NULL,
    public_by VARCHAR(255) DEFAULT NULL,
    is_thumb TINYINT(1) DEFAULT NULL,
    thumb_location VARCHAR(255) DEFAULT NULL,
    is_delete TINYINT(1) NOT NULL DEFAULT '0',
    real_file_location VARCHAR(255) DEFAULT NULL,
    real_file_thumb_location VARCHAR(255) DEFAULT NULL,
    mime VARCHAR(255) DEFAULT NULL,
    ext VARCHAR(50) DEFAULT NULL,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

| 列名             | 数据类型       | 是否为空 | 默认值               | 注释                                         |
|------------------|----------------|----------|----------------------|----------------------------------------------|
| `id`             | int(11)        | NOT NULL |                      | 文件的唯一标识                                 |
| `filename`       | varchar(255)   | NOT NULL |                      | 文件名                                       |
| `file_size`       | bigint(20)     | NOT NULL |                      | 文件大小（以字节为单位）                      |
| `file_location`   | varchar(255)   | NOT NULL |                      | 文件存储的位置                               |
| `created_by`     | varchar(255)   | NOT NULL |                      | 创建该文件的用户                             |
| `created_at`     | timestamp      | NULL     | CURRENT_TIMESTAMP    | 文件的创建时间，默认当前时间                   |
| `updated_by`     | varchar(255)   | NULL     | NULL                 | 最近更新该文件的用户                         |
| `updated_at`     | timestamp      | NULL     | CURRENT_TIMESTAMP    | 最近更新的时间，默认当前时间，更新时自动修改  |
| `is_public`      | tinyint(1)     | NULL     | '0'                  | 是否公开，默认值为0（不公开）                  |
| `public_expiration` | timestamp   | NULL     | NULL                 | 公开访问的截止时间                           |
| `public_by`      | varchar(255)   | NULL     | NULL                 | 设置公开的用户                               |
| `is_thumb`       | tinyint(1)     | NULL     | '0'                  | 是否为缩略图，默认值为0（不是缩略图）          |
| `thumb_location` | varchar(255)   | NULL     | NULL                 | 缩略图存储的位置                             |
| `is_delete`      | tinyint(1)     | NOT NULL | '0'                  | 是否被删除，默认值为0（未删除）                |

