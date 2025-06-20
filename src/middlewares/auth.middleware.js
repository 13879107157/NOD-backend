const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const { errorResponse } = require('../utils/response');

// 验证JWT
const authenticateToken = (req, res, next) => {
  // 获取请求头中的Authorization字段
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(errorResponse('未提供认证令牌'));
  }

  jwt.verify(token, jwtConfig.secret, (err, user) => {
    if (err) {
      return res.status(403).json(errorResponse('无效的认证令牌'));
    }
    // 将用户信息附加到请求对象上，供后续中间件或路由使用
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
