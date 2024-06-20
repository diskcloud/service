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
          id VARCHAR(50) DEFAULT NULL
          filename VARCHAR(255) NOT NULL,
          filesize BIGINT NOT NULL,
          filelocation VARCHAR(255) NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_by VARCHAR(255) DEFAULT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          is_public BOOLEAN DEFAULT FALSE,
          public_expiration TIMESTAMP DEFAULT NULL,
          public_by VARCHAR(255) DEFAULT NULL,
          is_thumb BOOLEAN DEFAULT FALSE,
          thumb_location VARCHAR(255) DEFAULT NULL,
          is_delete BOOLEAN NOT NULL DEFAULT FALSE
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
