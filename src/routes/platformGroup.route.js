const express = require('express');
const router = express.Router();
const {
  createPlatformGroup,
  getAllPlatformGroups,
  getPlatformGroupById,
  updatePlatformGroup,
  deletePlatformGroup,
} = require('../controllers/platformGroup.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// 所有路由都需要认证
router.use(authenticateToken);

router.post('/', createPlatformGroup);
router.get('/', getAllPlatformGroups);
router.get('/:id', getPlatformGroupById);
router.put('/:id', updatePlatformGroup);
router.delete('/:id', deletePlatformGroup);

module.exports = router;
