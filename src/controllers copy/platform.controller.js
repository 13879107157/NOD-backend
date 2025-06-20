const Platform = require('../models/platform.model');
const { successResponse, errorResponse } = require('../utils/response');

// 创建平台
const createPlatform = async (req, res) => {
    try {
        const { platformGroupId, platformTypeId, name, description, matchRule } = req.body;
        console.log({ platformGroupId, platformTypeId, name, description, matchRule });
        const platform = await Platform.create({
            platform_group_id: platformGroupId,  // 转换为模型字段名
            platform_type_id: platformTypeId,    // 转换为模型字段名
            name,
            description,
            match_rule: matchRule                // 转换为模型字段名
        });
        console.log("platform_mysql", platform);

        res.status(201).json(successResponse('创建平台成功', platform));
    } catch (error) {
        console.error('创建平台错误:', error);
        res.status(500).json(errorResponse('创建平台失败，请稍后再试'));
    }
};

// 获取所有平台
const getAllPlatforms = async (req, res) => {
    try {
        const platforms = await Platform.findAll();

        res.status(200).json(successResponse('获取平台列表成功', platforms));
    } catch (error) {
        console.error('获取平台列表错误:', error);
        res.status(500).json(errorResponse('获取平台列表失败，请稍后再试'));
    }
};

// 获取单个平台
const getPlatformById = async (req, res) => {
    try {
        const id = req.params.id;

        const platform = await Platform.findByPk(id);

        if (!platform) {
            return res.status(404).json(errorResponse('平台不存在'));
        }

        res.status(200).json(successResponse('获取平台成功', platform));
    } catch (error) {
        console.error('获取平台错误:', error);
        res.status(500).json(errorResponse('获取平台失败，请稍后再试'));
    }
};

// 更新平台
const updatePlatform = async (req, res) => {
    try {
        const id = req.params.id;
        const { platformGroupId, platformTypeId, name, description, matchRule } = req.body;

        const platform = await Platform.findByPk(id);

        if (!platform) {
            return res.status(404).json(errorResponse('平台不存在'));
        }

        await platform.update({
            platformGroupId,
            platformTypeId,
            name,
            description,
            matchRule,
        });

        res.status(200).json(successResponse('更新平台成功', platform));
    } catch (error) {
        console.error('更新平台错误:', error);
        res.status(500).json(errorResponse('更新平台失败，请稍后再试'));
    }
};

// 删除平台
const deletePlatform = async (req, res) => {
    try {
        const id = req.params.id;

        const platform = await Platform.findByPk(id);

        if (!platform) {
            return res.status(404).json(errorResponse('平台不存在'));
        }

        await platform.destroy();

        res.status(200).json(successResponse('删除平台成功'));
    } catch (error) {
        console.error('删除平台错误:', error);
        res.status(500).json(errorResponse('删除平台失败，请稍后再试'));
    }
};

module.exports = {
    createPlatform,
    getAllPlatforms,
    getPlatformById,
    updatePlatform,
    deletePlatform,
};
