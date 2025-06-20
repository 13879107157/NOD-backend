const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../utils/response');

// 用户注册
const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json(errorResponse('用户名已存在'));
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role,
            status: true,
        });

        res.status(201).json(successResponse('注册成功', {
            id: newUser.id,
            username: newUser.username,
        }));
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json(errorResponse('注册失败，请稍后再试'));
    }
};

// 用户登录
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json(errorResponse('用户名或密码错误'));
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(errorResponse('用户名或密码错误'));
        }

        // 生成JWT令牌
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        res.status(200).json(successResponse('登录成功', {
            token,
            user: {
                id: user.id,
                username: user.username,
            },
        }));
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json(errorResponse('登录失败，请稍后再试'));
    }
};

// 获取用户信息
const getUserInfo = async (req, res) => {
    try {
        // 从URL参数中获取id
        const userId = req.query.id;
        // console.log(req);
        // 验证id是否有效
        if (!userId) {
            return res.status(400).json(errorResponse('缺少用户ID参数'));
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'status'],
        });

        if (!user) {
            return res.status(404).json(errorResponse('用户不存在'));
        }

        res.status(200).json(successResponse('获取用户信息成功', user[0]));
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json(errorResponse('获取用户信息失败，请稍后再试'));
    }
};

// 获取所有用户
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'status'],
        });

        res.status(200).json(successResponse('获取用户列表成功', users));
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json(errorResponse('获取用户列表失败，请稍后再试'));
    }
};

// 更新用户信息
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, status } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json(errorResponse('用户不存在'));
        }

        // 如果提供了新密码，需要加密
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        }

        await user.update({ username, status, password: req.body.password });

        res.status(200).json(successResponse('更新用户信息成功', {
            id: user.id,
            username: user.username,
            status: user.status,
        }));
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json(errorResponse('更新用户信息失败，请稍后再试'));
    }
};

// 删除用户
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json(errorResponse('用户不存在'));
        }

        await user.destroy();

        res.status(200).json(successResponse('删除用户成功'));
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json(errorResponse('删除用户失败，请稍后再试'));
    }
};

module.exports = {
    register,
    login,
    getUserInfo,
    getAllUsers,
    updateUser,
    deleteUser,
};
