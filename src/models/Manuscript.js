const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Manuscript = sequelize.define('Manuscript', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  author_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  genre: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  file_url: { type: DataTypes.STRING(500), allowNull: true },
  cover_image: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  reviewed_by: { type: DataTypes.UUID, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'manuscripts', timestamps: true });

module.exports = Manuscript;
