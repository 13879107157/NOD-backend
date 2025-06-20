const express = require('express');
const router = express.Router();
const {
  createPlatform,
  getAllPlatforms,
  getPlatformById,
  updatePlatform,
  deletePlatform,
} = require('../controllers/platform.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(authenticateToken);

router.post('/', createPlatform);
router.get('/', getAllPlatforms);
router.get('/:id', getPlatformById);
router.put('/:id', updatePlatform);
router.delete('/:id', deletePlatform);

module.exports = router;
