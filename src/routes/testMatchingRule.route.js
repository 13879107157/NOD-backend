const express = require('express');
const router = express.Router();
const { testMatchingRule } = require('../controllers/testMatchingRule.controller');

// 定义测试匹配规则的接口
router.post('/test-matching-rule', testMatchingRule);

module.exports = router;