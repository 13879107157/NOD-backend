const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    match_rule: {
        type: DataTypes.JSON, // 修改为 JSON 类型
        allowNull: true,
        defaultValue: null,
        // 可选：添加验证
        validate: {
            isValidJson (value) {
                if (value !== null) {
                    try {
                        JSON.parse(value);
                    } catch (e) {
                        throw new Error('match_rule 必须是有效的 JSON 字符串');
                    }
                }
            }
        },
        // 可选：添加 get/set 方法
        get () {
            const value = this.getDataValue('match_rule');
            return value ? JSON.parse(value) : null;
        },
        set (value) {
            this.setDataValue('match_rule', value ? JSON.stringify(value) : null);
        }
    },
    exclusion_rule: {
        type: DataTypes.JSON, // 修改为 JSON 类型
        allowNull: true,
        defaultValue: null,
        // 可选：添加验证
        validate: {
            isValidJson (value) {
                if (value !== null) {
                    try {
                        JSON.parse(value);
                    } catch (e) {
                        throw new Error('match_rule 必须是有效的 JSON 字符串');
                    }
                }
            }
        },
        // 可选：添加 get/set 方法
        get () {
            const value = this.getDataValue('exclusion_rule');
            return value ? JSON.parse(value) : null;
        },
        set (value) {
            this.setDataValue('exclusion_rule', value ? JSON.stringify(value) : null);
        }
    },
});

// 导出模型
module.exports = Platform;

// 定义关联关系
Platform.associate = (models) => {
    Platform.belongsTo(models.PlatformGroup, {
        foreignKey: 'platform_group_id',
        as: 'platformGroup'
    });

    Platform.belongsTo(models.PlatformType, {
        foreignKey: 'platform_type_id',
        as: 'platformType'
    });
};
