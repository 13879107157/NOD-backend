const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformType = sequelize.define('platform_type', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
});

// 导出模型
module.exports = PlatformType;

// 定义关联关系
PlatformType.associate = (models) => {
    PlatformType.hasMany(models.Platform, {
        foreignKey: 'platform_type_id',
        as: 'platforms'
    });
};
