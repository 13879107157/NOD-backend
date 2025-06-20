const PlatformGroup = require('../models/platformGroup.model');
const Platform = require('../models/platform.model');
const PlatformType = require('../models/platformType.model');
const { successResponse, errorResponse } = require('../utils/response');

// 定义公共的查询配置
const PLATFORM_INCLUDE_CONFIG = {
    model: Platform,
    as: 'platforms',
    attributes: ['id', 'name', 'description', 'match_rule', 'order', 'exclusion_rule'],
    include: [
        {
            model: PlatformType,
            as: 'platformType',
            attributes: ['id', 'name', 'description']
        }
    ]
};

// 转换平台数据格式
const formatPlatform = (platform) => {
    const {
        id,
        name,
        order,
        match_rule,
        exclusion_rule,
        platformType: { name: platformTypeName, id: platformTypeId }
    } = platform;

    return {
        platformId: id,
        platformName: name,
        order,
        matchRule: match_rule,
        exclusionRule: exclusion_rule,
        platformTypeName,
        platformTypeId
    };
};

// 转换平台组数据格式
const formatPlatformGroup = (group) => ({
    platformGroupName: group.name,
    platformGroupId: group.id,
    order: group.order,
    platformGroupChildren: group.platforms.map(formatPlatform)
});

// 获取平台组及其平台的层级结构
const getPlatformStructure = async (req, res) => {
    try {
        const platformGroups = await PlatformGroup.findAll({
            attributes: ['id', 'name', 'description', 'status','order'],
            include: [PLATFORM_INCLUDE_CONFIG]
        });

        const result = platformGroups.map(formatPlatformGroup);
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

        const platformGroup = await PlatformGroup.findByPk(groupId, {
            attributes: ['id', 'name', 'description', 'status'],
            include: [PLATFORM_INCLUDE_CONFIG]
        });

        if (!platformGroup) {
            return res.status(404).json(errorResponse('平台组不存在'));
        }

        const result = formatPlatformGroup(platformGroup);
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
