const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Author = sequelize.define('Author', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
  biography: { type: DataTypes.TEXT, allowNull: true },
  qualifications: { type: DataTypes.TEXT, allowNull: true },
  experience: { type: DataTypes.STRING(500), allowNull: true },
  photo: { type: DataTypes.STRING(500), allowNull: true },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  approved_by: { type: DataTypes.UUID, allowNull: true },
  approved_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'authors', timestamps: true });

module.exports = Author;
