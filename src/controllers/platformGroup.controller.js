const PlatformGroup = require('../models/platformGroup.model');
const { successResponse, errorResponse } = require('../utils/response');

// 创建平台组
const createPlatformGroup = async (req, res) => {
    try {
        const { name, description, status, order } = req.body;

        const platformGroup = await PlatformGroup.create({ name, description, status, order });

        res.status(201).json(successResponse('创建平台组成功', platformGroup));
    } catch (error) {
        console.error('创建平台组错误:', error);
        res.status(500).json(errorResponse('创建平台组失败，请稍后再试'));
    }
};

// 获取所有平台组
const getAllPlatformGroups = async (req, res) => {
    try {
        const platformGroups = await PlatformGroup.findAll({
            order: [['order', 'ASC']]
        });

        res.status(200).json(successResponse('获取平台组列表成功', platformGroups));
    } catch (error) {
        console.error('获取平台组列表错误:', error);
        res.status(500).json(errorResponse('获取平台组列表失败，请稍后再试'));
    }
};

// 获取单个平台组
const getPlatformGroupById = async (req, res) => {
    try {
        const id = req.params.id;

        const platformGroup = await PlatformGroup.findByPk(id);

        if (!platformGroup) {
            return res.status(404).json(errorResponse('平台组不存在'));
        }

        res.status(200).json(successResponse('获取平台组成功', platformGroup));
    } catch (error) {
        console.error('获取平台组错误:', error);
        res.status(500).json(errorResponse('获取平台组失败，请稍后再试'));
    }
};

// 更新平台组
const updatePlatformGroup = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, status, order } = req.body;

        const platformGroup = await PlatformGroup.findByPk(id);

        if (!platformGroup) {
            return res.status(404).json(errorResponse('平台组不存在'));
        }

        await platformGroup.update({ name, description, status, order });

        res.status(200).json(successResponse('更新平台组成功', platformGroup));
    } catch (error) {
        console.error('更新平台组错误:', error);
        res.status(500).json(errorResponse('更新平台组失败，请稍后再试'));
    }
};

// 删除平台组
const deletePlatformGroup = async (req, res) => {
    try {
        const id = req.params.id;

        const platformGroup = await PlatformGroup.findByPk(id);

        if (!platformGroup) {
            return res.status(404).json(errorResponse('平台组不存在'));
        }

        await platformGroup.destroy();

        res.status(200).json(successResponse('删除平台组成功'));
    } catch (error) {
        console.error('删除平台组错误:', error);
        res.status(500).json(errorResponse('删除平台组失败，请稍后再试'));
    }
};

module.exports = {
    createPlatformGroup,
    getAllPlatformGroups,
    getPlatformGroupById,
    updatePlatformGroup,
    deletePlatformGroup,
};
