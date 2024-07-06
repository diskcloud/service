const { DataTypes } = require("sequelize");
const sequelize = require("../utils/dbInstance"); // 修改为实际的sequelize实例路径

const Files = sequelize.define(
  "Files",
  {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false, // 必须为 NOT NULL
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    file_location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    public_expiration: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    public_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    is_thumb: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },
    thumb_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    real_file_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    real_file_thumb_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    mime: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    ext: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "files",
    timestamps: false,
    underscored: true,
    paranoid: true,
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  }
);

module.exports = Files;
