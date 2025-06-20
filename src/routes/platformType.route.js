const express = require('express');
const router = express.Router();
const {
  createPlatformType,
  getAllPlatformTypes,
  getPlatformTypeById,
  updatePlatformType,
  deletePlatformType,
} = require('../controllers/platformType.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(authenticateToken);

router.post('/', createPlatformType);
router.get('/', getAllPlatformTypes);
router.get('/:id', getPlatformTypeById);
router.put('/:id', updatePlatformType);
router.delete('/:id', deletePlatformType);

module.exports = router;
