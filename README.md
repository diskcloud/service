# upload-file-service
nodejs 实现文件上传功能

### 支持功能

| 功能         | Lite(缩减版) | Full（全量版） |
| :----: | :----: | :----: |
| 数据出入库   | 否           | 是             |
| 缩略图       | 是           | 是             |
| 图片压缩     | 是           | 是             |
| 返回md格式   | 是           | 是             |
| 保留原始文件 | 是           | 是             |
| 文件水印     | 否           | 是             |


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

| 字段名称      | 类型           | 描述                   |
|---------------|----------------|------------------------|
| id            | INT            | 自动增量的主键        |
| 文件名        | VARCHAR(255)   | 文件的名称            |
| 文件大小      | BIGINT         | 文件的大小（以字节为单位） |
| 文件地址      | VARCHAR(255)   | 文件的存储地址         |
| 创建人        | VARCHAR(255)   | 创建文件的用户         |
| 创建时间      | TIMESTAMP      | 文件的创建时间         |
| 更新人        | VARCHAR(255)   | 更新文件的用户         |
| 更新时间      | TIMESTAMP      | 文件的更新时间         |
| 是否公开      | BOOLEAN        | 文件是否公开           |
| 公开失效时间  | TIMESTAMP      | 文件公开的失效时间     |
| 公开人        | VARCHAR(255)   | 设置文件公开的用户     |
