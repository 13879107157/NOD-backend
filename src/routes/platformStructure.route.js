const express = require('express');
const router = express.Router();
const { 
  getPlatformStructure,
  getPlatformGroupStructure
} = require('../controllers/platformStructure.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(authenticateToken);

// 获取所有平台组及其平台
router.get('/', getPlatformStructure);

// 获取指定平台组及其平台
router.get('/:id', getPlatformGroupStructure);

module.exports = router;
