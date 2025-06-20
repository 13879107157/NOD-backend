const PlatformType = require('../models/platformType.model');
const { successResponse, errorResponse } = require('../utils/response');

// 创建平台类型
const createPlatformType = async (req, res) => {
  try {
    const { name, description } = req.body;

    const platformType = await PlatformType.create({ name, description });

    res.status(201).json(successResponse('创建平台类型成功', platformType));
  } catch (error) {
    console.error('创建平台类型错误:', error);
    res.status(500).json(errorResponse('创建平台类型失败，请稍后再试'));
  }
};

// 获取所有平台类型
const getAllPlatformTypes = async (req, res) => {
  try {
    const platformTypes = await PlatformType.findAll();

    res.status(200).json(successResponse('获取平台类型列表成功', platformTypes));
  } catch (error) {
    console.error('获取平台类型列表错误:', error);
    res.status(500).json(errorResponse('获取平台类型列表失败，请稍后再试'));
  }
};

// 获取单个平台类型
const getPlatformTypeById = async (req, res) => {
  try {
    const id = req.params.id;

    const platformType = await PlatformType.findByPk(id);

    if (!platformType) {
      return res.status(404).json(errorResponse('平台类型不存在'));
    }

    res.status(200).json(successResponse('获取平台类型成功', platformType));
  } catch (error) {
    console.error('获取平台类型错误:', error);
    res.status(500).json(errorResponse('获取平台类型失败，请稍后再试'));
  }
};

// 更新平台类型
const updatePlatformType = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body;

    const platformType = await PlatformType.findByPk(id);

    if (!platformType) {
      return res.status(404).json(errorResponse('平台类型不存在'));
    }

    await platformType.update({ name, description });

    res.status(200).json(successResponse('更新平台类型成功', platformType));
  } catch (error) {
    console.error('更新平台类型错误:', error);
    res.status(500).json(errorResponse('更新平台类型失败，请稍后再试'));
  }
};

// 删除平台类型
const deletePlatformType = async (req, res) => {
  try {
    const id = req.params.id;

    const platformType = await PlatformType.findByPk(id);

    if (!platformType) {
      return res.status(404).json(errorResponse('平台类型不存在'));
    }

    await platformType.destroy();

    res.status(200).json(successResponse('删除平台类型成功'));
  } catch (error) {
    console.error('删除平台类型错误:', error);
    res.status(500).json(errorResponse('删除平台类型失败，请稍后再试'));
  }
};

module.exports = {
  createPlatformType,
  getAllPlatformTypes,
  getPlatformTypeById,
  updatePlatformType,
  deletePlatformType,
};
