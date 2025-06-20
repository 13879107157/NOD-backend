const PlatformGroup = require('../models/platformGroup.model');
const Platform = require('../models/platform.model');
const PlatformType = require('../models/platformType.model');
const { successResponse, errorResponse } = require('../utils/response');

// 获取平台组及其平台的层级结构
const getPlatformStructure = async (req, res) => {
    try {
        // 查询所有平台组，包括其关联的平台
        const platformGroups = await PlatformGroup.findAll({
            attributes: ['id', 'name', 'description', 'status'],
            include: [
                {
                    model: Platform,
                    as: 'platforms',
                    attributes: ['id', 'name', 'description', 'match_rule'],
                    include: [
                        {
                            model: PlatformType,
                            as: 'type',
                            attributes: ['id', 'name', 'description']
                        }
                    ]
                }
            ]
        });

        // 转换数据格式
        const result = platformGroups.map(group => ({
            platformGroupName: group.name,
            platformGroupId: group.id,
            platformGroupChildren: group.platforms.map(platform => ({
                platformId: platform.id,
                platformName: platform.name,
                matchRule: platform.match_rule,
                platformTypeName: platform.type.name,
                platformTypeId: platform.type.id
            }))
        }));

        res.status(200).json(successResponse('获取平台结构成功', result));
    } catch (error) {
        console.error('获取平台结构错误:', error);
        res.status(500).json(errorResponse('获取平台结构失败，请稍后再试'));
    }
};

// 获取单个平台组及其平台
const getPlatformGroupStructure = async (req, res) => {
    try {
        const groupId = req.params.id;

        // 查询指定平台组及其关联的平台
        const platformGroup = await PlatformGroup.findByPk(groupId, {
            attributes: ['id', 'name', 'description', 'status'],
            include: [
                {
                    model: Platform,
                    as: 'platforms',
                    attributes: ['id', 'name', 'description', 'match_rule'],
                    include: [
                        {
                            model: PlatformType,
                            as: 'type',
                            attributes: ['id', 'name', 'description']
                        }
                    ]
                }
            ]
        });

        if (!platformGroup) {
            return res.status(404).json(errorResponse('平台组不存在'));
        }

        // 转换数据格式
        const result = {
            platformGroupName: platformGroup.name,
            platformGroupId: platformGroup.id,
            platformGroupChildren: platformGroup.platforms.map(platform => ({
                platformId: platform.id,
                platformName: platform.name,
                matchRule: platform.match_rule,
                platformTypeName: platform.type.name,
                platformTypeId: platform.type.id
            }))
        };

        res.status(200).json(successResponse('获取平台组结构成功', result));
    } catch (error) {
        console.error('获取平台组结构错误:', error);
        res.status(500).json(errorResponse('获取平台组结构失败，请稍后再试'));
    }
};

module.exports = {
    getPlatformStructure,
    getPlatformGroupStructure
};
