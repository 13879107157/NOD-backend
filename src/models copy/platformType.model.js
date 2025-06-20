const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformType = sequelize.define('PlatformType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
});

module.exports = PlatformType;
