const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlatformGroup = sequelize.define('platform_group', {
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
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
    },
});

// 导出模型
module.exports = PlatformGroup;

// 定义关联关系
PlatformGroup.associate = (models) => {
    PlatformGroup.hasMany(models.Platform, {
        foreignKey: 'platform_group_id',
        as: 'platforms'
    });
};
