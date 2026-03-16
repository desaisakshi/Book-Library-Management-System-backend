const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Otp = sequelize.define('Otp', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  otp_code: { type: DataTypes.STRING(6), allowNull: false },
  purpose: { type: DataTypes.ENUM('registration', 'password_reset', 'login'), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  is_used: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'otps', timestamps: true });

module.exports = Otp;
