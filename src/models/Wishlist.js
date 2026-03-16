const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  book_id: { type: DataTypes.UUID, allowNull: false }
}, {
  tableName: 'wishlists',
  timestamps: true,
  indexes: [{ unique: true, fields: ['user_id', 'book_id'] }]
});

module.exports = Wishlist;
