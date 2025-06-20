const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUserInfo,
  getAllUsers,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// 公开路由
router.post('/register', register);
router.post('/login', login);

// 受保护的路由
router.get('/me', authenticateToken, getUserInfo);
router.get('/', authenticateToken, getAllUsers);
router.put('/:id', authenticateToken, updateUser);
router.delete('/:id', authenticateToken, deleteUser);

module.exports = router;
