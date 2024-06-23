const { DataTypes } = require('sequelize');
const sequelize = require('../utils/dbInstance'); // 修改为实际的sequelize实例路径
const File = sequelize.define('File', {
  id: {
    type: DataTypes.STRING(50),
    allowNull: false, // 必须为 NOT NULL
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  filesize: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  filelocation: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updated_by: {
    type: DataTypes.STRING(255),
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
    type: DataTypes.STRING(255),
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
  is_delete: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
}, {
  tableName: 'files',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
});

module.exports = File;