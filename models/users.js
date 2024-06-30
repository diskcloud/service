const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../utils/dbInstance"); // 修改为实际的sequelize实例路径
const UserStatus = {
  ACTIVE: "ACTIVE", // 用户账号已激活
  INACTIVE: "INACTIVE", // 用户账号未激活
  BANNED: "BANNED", // 用户账号被封禁
  PENDING: "PENDING", // 用户账号待审核
};

// 定义 User 模型
const Users = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      collate: "utf8mb4_unicode_ci",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      collate: "utf8mb4_unicode_ci",
    },
    mail: {
      type: DataTypes.STRING,
      allowNull: true,
      collate: "utf8mb4_unicode_ci",
    },
    verify_email: {
      type: DataTypes.TINYINT.UNSIGNED.ZEROFILL,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM,
      values: Object.values(UserStatus),
      allowNull: false,
      defaultValue: UserStatus.ACTIVE,
      collate: "utf8mb4_unicode_ci",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
      collate: "utf8mb4_unicode_ci",
    },
    is_login: {
      allowNull: true,
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    logout_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disk_size: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "users",
    timestamps: false,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  }
);
module.exports = Users;
