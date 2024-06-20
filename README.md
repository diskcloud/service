# upload-file-service
nodejs 实现文件上传功能

### 支持功能

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


### 环境变量
可以创建一个 `.env.local` 文件，在里面配置对应的环境变量

- TINIFY_KEY=
- INTERNAL_NETWORK_DOMAIN=
- PUBLIC_NETWORK_DOMAIN=
- SERVER_PORT=
- MYSQL_DATABASE=
- MYSQL_HOST=
- MYSQL_USER=
- MYSQL_PASSWORD=

### 创建表的字段说明

| 列名             | 数据类型       | 是否为空 | 默认值               | 注释                                         |
|------------------|----------------|----------|----------------------|----------------------------------------------|
| `id`             | int(11)        | NOT NULL |                      | 文件的唯一标识                                 |
| `filename`       | varchar(255)   | NOT NULL |                      | 文件名                                       |
| `filesize`       | bigint(20)     | NOT NULL |                      | 文件大小（以字节为单位）                      |
| `filelocation`   | varchar(255)   | NOT NULL |                      | 文件存储的位置                               |
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

