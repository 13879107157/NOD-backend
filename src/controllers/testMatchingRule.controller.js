const Platform = require('../models/platform.model');
const { successResponse, errorResponse } = require('../utils/response');

// 测试 URL 匹配到的所有平台
const testMatchingRule = async (req, res) => {
    try {
        const { url } = req.body;

        // 检查参数
        if (!url) {
            return res.status(400).json(errorResponse('请提供 URL'));
        }

        // 获取所有平台的匹配规则
        const platforms = await Platform.findAll();
        if (!platforms || platforms.length === 0) {
            return res.status(404).json(errorResponse('未找到任何平台'));
        }

        const matchedPlatforms = [];

        // 遍历所有平台，检查匹配规则
        for (const platform of platforms) {
            // 解析匹配规则
            let matchRules = [];
            try {
                matchRules = typeof platform.match_rule === 'string'
                   ? JSON.parse(platform.match_rule.replace(/'/g, '"'))
                    : platform.match_rule;
            } catch (e) {
                console.error(`解析匹配规则错误: ${platform.name}`, e);
                continue;
            }

            // 解析排除规则
            let exclusionRules = [];
            if (platform.exclusion_rule) {
                try {
                    exclusionRules = typeof platform.exclusion_rule === 'string'
                       ? JSON.parse(platform.exclusion_rule.replace(/'/g, '"'))
                        : platform.exclusion_rule;
                } catch (e) {
                    console.error(`解析排除规则错误: ${platform.name}`, e);
                }
            }

            // 检查排除规则
            const isExcluded = exclusionRules.some(rule => 
                rule && typeof rule === 'string' && decodeURIComponent(url).includes(rule)
            );

            if (isExcluded) continue;

            // 检查匹配规则
            const matchedRules = matchRules.filter(rule => 
                rule && typeof rule === 'string' && decodeURIComponent(url).includes(rule)
            );

            // 如果匹配到规则，记录该平台
            if (matchedRules.length > 0) {
                matchedPlatforms.push({
                    platformId: platform.id,
                    platformName: platform.name,
                    matchedRules,
                    exclusionRules
                });
            }
        }

        const result = {
            url,
            matchedPlatforms: matchedPlatforms.length > 0 ? matchedPlatforms : null
        };

        res.status(200).json(successResponse('匹配测试完成', result));
    } catch (error) {
        console.error('匹配测试错误:', error);
        res.status(500).json(errorResponse('匹配测试失败，请稍后再试'));
    }
};

module.exports = {
    testMatchingRule
};