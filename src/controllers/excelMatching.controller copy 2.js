const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios');
const { successResponse, errorResponse } = require('../utils/response');

// Excel 日期转换函数
function excelDateToJSDate(excelDate) {
    if (typeof excelDate !== 'number') return excelDate;
    
    // Excel 日期是从 1900 年 1 月 1 日开始的天数（实际上有个闰年的 bug，但我们忽略它）
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    
    // 格式化日期为 YYYY-MM-DD 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

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
    console.log("aaaaaaaaaaaaaaaaaaaaaaa",req.body);
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
        const { urlColumn = '关键字URL', columnsToInclude = '' } = req.body;

        // 将 columnsToInclude 字符串解析为数组
        let columnsToIncludeArray = [];
        if (columnsToInclude) {
            // 如果 columnsToInclude 是字符串，按逗号分隔并去除空白
            columnsToIncludeArray = typeof columnsToInclude === 'string'
                ? columnsToInclude.split(',').map(col => col.trim())
                : columnsToInclude; // 如果已经是数组，则直接使用
        }

        console.log('解析后的 columnsToInclude:', columnsToIncludeArray);

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

                // 初始化全局统计对象
                const globalStatistics = {};
                columnsToIncludeArray.forEach(column => {
                    globalStatistics[column] = {
                        '其他': 0
                    };
                });

                // 初始化结果结构，同时为每个平台和组添加 statistics 对象
                const result = JSON.parse(JSON.stringify(platformStructure));
                
                // 初始化组级统计
                result.forEach(group => {
                    group.statistics = {}; // 组级统计
                    columnsToIncludeArray.forEach(column => {
                        group.statistics[column] = {
                            '其他': 0
                        };
                    });
                    
                    group.platformGroupChildren.forEach(platform => {
                        platform.matchedData = [];
                        platform.matchCount = 0;
                        platform.statistics = {}; // 平台级统计
                        
                        // 初始化平台统计对象的列
                        columnsToIncludeArray.forEach(column => {
                            platform.statistics[column] = {
                                '其他': 0
                            };
                        });
                    });
                });

                // 遍历 Excel 数据并匹配
                excelData.forEach(row => {
                    const url = row[urlColumn];
                    if (!url) return;

                    // 处理可能的日期列
                    Object.keys(row).forEach(key => {
                        // 尝试识别可能的日期列（这里假设列名包含"日期"或"时间"）
                        if ((key.includes('日期') || key.includes('时间')) && typeof row[key] === 'number') {
                            row[key] = excelDateToJSDate(row[key]);
                        }
                    });

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
                                // 保存原始行的所有数据
                                platform.matchedData.push({...row});
                                platform.matchCount++;
                                matched = true;
                                
                                // 更新当前平台的统计数据
                                columnsToIncludeArray.forEach(col => {
                                    const value = row[col] !== undefined && row[col] !== '' 
                                        ? row[col] 
                                        : '其他'; // 处理不存在或为空的情况
                                    
                                    // 更新平台统计
                                    if (!platform.statistics[col][value]) {
                                        platform.statistics[col][value] = 1;
                                    } else {
                                        platform.statistics[col][value]++;
                                    }
                                    
                                    // 更新组统计
                                    if (!group.statistics[col][value]) {
                                        group.statistics[col][value] = 1;
                                    } else {
                                        group.statistics[col][value]++;
                                    }
                                    
                                    // 更新全局统计
                                    if (!globalStatistics[col][value]) {
                                        globalStatistics[col][value] = 1;
                                    } else {
                                        globalStatistics[col][value]++;
                                    }
                                });
                                
                                break;
                            }
                        }

                        if (matched) break;
                    }
                });

                // 返回结果，添加全局统计
                return cleanupAndRespond(200, 'Excel 数据匹配成功', {
                    totalRows: excelData.length,
                    matchedRows: result.reduce((sum, group) =>
                        sum + group.platformGroupChildren.reduce((platformSum, platform) =>
                            platformSum + platform.matchCount, 0), 0),
                    platformStructure: result,
                    statistics: globalStatistics // 新增全局统计
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
    function cleanupAndRespond(statusCode, message, data = null) {
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