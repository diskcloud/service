const Sequelize = require('sequelize');
require('dotenv').config({ path: '.env.local' });

const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    dialect: process.env.DIALECT,
    pool: {
      max: 5,
      min: 0,
      idle: 10000
  }
 });

sequelize.authenticate(); 
module.exports = sequelize
