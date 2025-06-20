const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 导入关联模型
const PlatformGroup = require('./platformGroup.model');
const PlatformType = require('./platformType.model');

const Platform = sequelize.define('platform', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  platform_group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  platform_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  match_rule: {
    type: DataTypes.TEXT,
  },
});

// 定义关联关系
Platform.belongsTo(PlatformGroup, {
  foreignKey: 'platform_group_id',
  targetKey: 'id',
  as: 'group'
});

Platform.belongsTo(PlatformType, {
  foreignKey: 'platform_type_id',
  targetKey: 'id',
  as: 'type'
});

module.exports = Platform;
