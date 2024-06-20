const pool = require('./db'); // 引入数据库连接池

async function checkAndCreateTable() {
  const connection = await pool.getConnection(); // 从连接池获取连接
  try {
    // 检查表是否存在
    const [rows] = await connection.execute(
      "SHOW TABLES LIKE 'files';"
    );

    if (rows.length === 0) {
      // 创建表
      await connection.execute(
        `CREATE TABLE files (
          id VARCHAR(50) DEFAULT NULL,
          filename VARCHAR(255) NOT NULL,
          filesize BIGINT(20) NOT NULL,
          filelocation VARCHAR(255) NOT NULL,
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
          real_file_thumb_location VARCHAR(255) DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
      );
      console.log('Table "files" created successfully.');
    } else {
      console.log('Table "files" already exists.');
    }
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    connection.release(); // 释放连接
  }
}
module.exports = { checkAndCreateTable }; // 导出函数
