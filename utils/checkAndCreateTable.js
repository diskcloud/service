const pool = require('./db');

async function checkAndCreateTable() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      "SHOW TABLES LIKE 'files';"
    );

    if (rows.length === 0) {
      await connection.execute(
        `CREATE TABLE files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          filesize BIGINT NOT NULL,
          filelocation VARCHAR(255) NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by VARCHAR(255),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_public BOOLEAN DEFAULT FALSE,
          public_expiration TIMESTAMP,
          public_by VARCHAR(255)
        );`
      );
      console.log('Table created successfully.');
    } else {
      console.log('Table already exists.');
    }
  } finally {
    connection.release();
  }
}

module.exports = { checkAndCreateTable };
