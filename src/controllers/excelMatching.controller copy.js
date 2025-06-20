const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
const { successResponse, errorResponse } = require('../utils/response');

// 创建 axios 实例，用于 API 请求
const apiClient = axios.create({
    baseURL: `${process.env.API_BASE_URL || 'http://localhost:8181'}`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 处理 Excel 匹配请求
const processExcelMatching = async (req, res) => {
    try {
        // 记录文件信息
        console.log('控制器接收的文件:', req.file);

        // 检查是否有文件上传
        if (!req.file) {
            return res.status(400).json(errorResponse('请上传 Excel 文件'));
        }

        // 检查文件是否存在
        const filePath = req.file.path;
        console.log('尝试访问的文件路径:', filePath);

        if (!fs.existsSync(filePath)) {
            // 尝试查找文件
            const uploadDir = path.join(__dirname, '../../uploads');
            const filePattern = path.basename(filePath);

            try {
                const files = fs.readdirSync(uploadDir);
                const matchingFile = files.find(f => f.includes(filePattern));

                if (matchingFile) {
                    const foundPath = path.join(uploadDir, matchingFile);
                    console.log('找到匹配文件:', foundPath);
                    req.file.path = foundPath;
                } else {
                    console.log('上传目录中的文件:', files);
                    return res.status(400).json(errorResponse('上传的文件不存在或已被删除'));
                }
            } catch (dirErr) {
                console.error('读取上传目录错误:', dirErr);
                return res.status(400).json(errorResponse('无法访问上传目录'));
            }
        }

        // 获取请求中的列名参数
        const { urlColumn = '关键字URL', columnsToInclude = [] } = req.body;

        // 获取平台结构数据 - 带认证
        try {
            // 从请求头获取认证令牌
            const authToken = req.headers.authorization;

            // 设置认证头
            if (authToken) {
                apiClient.defaults.headers.common['Authorization'] = authToken;
            } else {
                console.warn('未找到认证令牌');
                return res.status(401).json(errorResponse('认证失败，请重新登录'));
            }

            // 调用 API 获取平台结构
            const platformStructureResponse = await apiClient.get('/api/platform-structure');

            if (!platformStructureResponse.data.success) {
                return cleanupAndRespond(500, '无法获取平台结构数据');
            }

            const platformStructure = platformStructureResponse.data.data;

            // 读取 Excel 文件
            try {
                const workbook = xlsx.readFile(req.file.path);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const excelData = xlsx.utils.sheet_to_json(worksheet);

                // 检查 URL 列是否存在
                if (!excelData[0] || !excelData[0][urlColumn]) {
                    return cleanupAndRespond(400, `Excel 文件中未找到 "${urlColumn}" 列`);
                }

                // 初始化结果结构
                const result = JSON.parse(JSON.stringify(platformStructure));
                result.forEach(group => {
                    group.platformGroupChildren.forEach(platform => {
                        platform.matchedData = [];
                        platform.matchCount = 0;
                    });
                });

                // 遍历 Excel 数据并匹配
                excelData.forEach(row => {
                    const url = row[urlColumn];
                    if (!url) return;

                    let matched = false;

                    // 遍历平台组和平台
                    for (const group of result) {
                        for (const platform of group.platformGroupChildren) {
                            // 解析匹配规则
                            let matchRules = [];
                            try {
                                matchRules = typeof platform.matchRule === 'string'
                                    ? JSON.parse(platform.matchRule.replace(/'/g, '"'))
                                    : platform.matchRule;
                            } catch (e) {
                                console.error(`解析匹配规则错误: ${platform.platformName}`, e);
                                continue;
                            }

                            // 检查 URL 是否匹配任何规则
                            if (matchRules.some(rule => url.includes(rule))) {
                                // 构建包含指定列的匹配数据
                                const matchedRow = {
                                    sourceUrl: url
                                };

                                // 添加用户指定的其他列
                                if (columnsToInclude.length > 0) {
                                    columnsToInclude.forEach(col => {
                                        if (row[col] !== undefined) {
                                            matchedRow[col] = row[col];
                                        }
                                    });
                                } else {
                                    // 默认包含所有列
                                    Object.keys(row).forEach(key => {
                                        if (key !== urlColumn) {
                                            matchedRow[key] = row[key];
                                        }
                                    });
                                }

                                platform.matchedData.push(matchedRow);
                                platform.matchCount++;
                                matched = true;
                                break;
                            }
                        }

                        if (matched) break;
                    }
                });

                // 返回结果
                return cleanupAndRespond(200, 'Excel 数据匹配成功', {
                    totalRows: excelData.length,
                    matchedRows: result.reduce((sum, group) =>
                        sum + group.platformGroupChildren.reduce((platformSum, platform) =>
                            platformSum + platform.matchCount, 0), 0),
                    platformStructure: result
                });
            } catch (readError) {
                console.error('读取 Excel 文件错误:', readError);
                return cleanupAndRespond(500, '无法读取上传的 Excel 文件');
            }
        } catch (apiError) {
            console.error('获取平台结构 API 错误:', apiError);

            // 处理认证错误
            if (apiError.response && apiError.response.status === 401) {
                return cleanupAndRespond(401, '认证失败，请重新登录');
            }

            return cleanupAndRespond(500, '获取平台结构数据失败');
        }
    } catch (error) {
        console.error('处理 Excel 匹配错误:', error);
        return cleanupAndRespond(500, '处理 Excel 匹配失败，请稍后再试');
    }

    // 清理临时文件并响应
    function cleanupAndRespond (statusCode, message, data = null) {
        // 确保删除临时文件
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('已删除临时文件:', req.file.path);
            } catch (unlinkError) {
                console.error('删除临时文件错误:', unlinkError);
            }
        }

        return res.status(statusCode).json(
            statusCode === 200
                ? successResponse(message, data)
                : errorResponse(message)
        );
    }
};

module.exports = {
    processExcelMatching
};
