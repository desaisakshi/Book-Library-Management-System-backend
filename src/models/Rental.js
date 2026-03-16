const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rental = sequelize.define('Rental', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  book_id: { type: DataTypes.UUID, allowNull: false },
  // FIX: 'cancelled' added to ENUM
  status: {
    type: DataTypes.ENUM('requested', 'dispatched', 'return_initiated', 'completed', 'overdue', 'cancelled'),
    defaultValue: 'requested'
  },
  rental_date: { type: DataTypes.DATE, allowNull: true },
  due_date: { type: DataTypes.DATE, allowNull: true },
  return_date: { type: DataTypes.DATE, allowNull: true },
  dispatched_by: { type: DataTypes.UUID, allowNull: true },
  dispatched_at: { type: DataTypes.DATE, allowNull: true },
  received_by: { type: DataTypes.UUID, allowNull: true }
}, { tableName: 'rentals', timestamps: true });

module.exports = Rental;
