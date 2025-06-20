const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 添加 fs 模块导入
const { processExcelMatching } = require('../controllers/excelMatching.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { errorResponse } = require('../utils/response');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('创建上传目录:', uploadDir);
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeFilename = Date.now() + '-' + Math.random().toString(36).substring(2, 15) + ext;
    cb(null, safeFilename);
  }
});

// 增强的文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  const allowedExtensions = ['.xlsx', '.xls'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isValidType = allowedTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(fileExtension);
  
  if (isValidType && isValidExtension) {
    cb(null, true);
  } else {
    cb(new Error('请上传有效的 Excel 文件 (.xlsx 或 .xls)'), false);
  }
};

// 配置 multer 允许额外字段
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB 文件大小限制
    files: 1 // 只允许上传一个文件
  },
  fileFilter: fileFilter,
  preservePath: true // 保留原始文件路径信息
}).any(); // 使用 any() 代替 single() 允许任何字段名

// 处理上传的文件
const handleFileUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer 错误处理
      return res.status(400).json(errorResponse(`文件上传错误: ${err.message}`));
    } else if (err) {
      // 其他错误处理
      return res.status(400).json(errorResponse(`错误: ${err.message}`));
    }
    
    // 确保文件已上传
    if (!req.files || req.files.length === 0) {
      return res.status(400).json(errorResponse('请上传 Excel 文件'));
    }
    
    // 找到第一个 Excel 文件
    const excelFile = req.files.find(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      return ext === '.xlsx' || ext === '.xls';
    });
    
    if (!excelFile) {
      return res.status(400).json(errorResponse('请上传有效的 Excel 文件 (.xlsx 或 .xls)'));
    }
    
    // 记录文件信息
    console.log('上传的文件:', excelFile);
    
    // 将找到的文件赋值给 req.file，保持控制器兼容性
    req.file = excelFile;
    
    next();
  });
};

// 所有路由都需要认证
router.use(authenticateToken);

// 处理 Excel 匹配请求
router.post('/', handleFileUpload, processExcelMatching);

module.exports = router;
