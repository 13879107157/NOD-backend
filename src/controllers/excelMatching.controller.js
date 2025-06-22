const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const PlatformGroup = require('../models/platformGroup.model');
const Platform = require('../models/platform.model');
const PlatformType = require('../models/platformType.model');
const { successResponse, errorResponse } = require('../utils/response');

// Excel 日期转换函数
function excelDateToJSDate (excelDate) {
    if (typeof excelDate !== 'number') return excelDate;

    // Excel 日期是从 1900 年 1 月 1 日开始的天数（实际上有个闰年的 bug，但我们忽略它）
    const date = new Date((excelDate - 25569) * 86400 * 1000);

    // 格式化日期为 YYYY-MM-DD 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// 定义公共的查询配置
const PLATFORM_INCLUDE_CONFIG = {
    model: Platform,
    as: 'platforms',
    attributes: ['id', 'name', 'description', 'match_rule', 'order', 'exclusion_rule'],
    include: [
        {
            model: PlatformType,
            as: 'platformType',
            attributes: ['id', 'name', 'description']
        }
    ]
};

// 转换平台数据格式
const formatPlatform = (platform) => {
    const {
        id,
        name,
        order,
        match_rule,
        exclusion_rule,
        platformType: { name: platformTypeName, id: platformTypeId }
    } = platform;

    return {
        platformId: id,
        platformName: name,
        order,
        matchRule: match_rule,
        exclusionRule: exclusion_rule,
        platformTypeName,
        platformTypeId,
        matchedData: [],
        matchCount: 0
    };
};

// 转换平台组数据格式
const formatPlatformGroup = (group) => ({
    platformGroupName: group.name,
    platformGroupId: group.id,
    order: group.order,
    matchCount: 0, // 新增：用于统计平台组下所有平台的匹配数量
    platformGroupChildren: group.platforms.map(formatPlatform)
});

// 处理 Excel 匹配请求
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

        // 直接查询数据库获取平台结构数据
        try {
            const platformGroups = await PlatformGroup.findAll({
                attributes: ['id', 'name', 'description', 'status', 'order'],
                include: [PLATFORM_INCLUDE_CONFIG]
            });

            // 对平台组按 order 升序排序
            const sortedPlatformGroups = platformGroups.sort((a, b) => a.order - b.order);

            const platformStructure = sortedPlatformGroups.map(formatPlatformGroup);

            // 对每个平台组下的平台按 order 升序排序
            platformStructure.forEach(group => {
                group.platformGroupChildren = group.platformGroupChildren.sort((a, b) => a.order - b.order);
            });

            // 新增：创建“其他”组
            const otherGroup = {
                platformGroupName: '未匹配数据',
                platformGroupId: null,
                order: Infinity,
                matchCount: 0,
                platformGroupChildren: [
                    {
                        platformId: null,
                        platformName: '未匹配数据',
                        order: Infinity,
                        matchRule: [],
                        exclusionRule: [],
                        platformTypeName: '其他',
                        platformTypeId: null,
                        matchedData: [],
                        matchCount: 0
                    }
                ]
            };

            platformStructure.push(otherGroup);

            // 读取 Excel 文件
            try {
                const workbook = xlsx.readFile(req.file.path);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                // 获取工作表范围
                const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                const maxCol = range.e.c; // 获取最大列索引

                // 获取表头行数据（假设表头在第一行）
                const headerRow = 1; // Excel行号从1开始
                const headers = [];

                for (let col = 0; col <= maxCol; col++) {
                    const cellAddress = xlsx.utils.encode_cell({ r: headerRow - 1, c: col }); // 转换为A1表示法
                    const cell = worksheet[cellAddress];

                    // 获取表头值，如果单元格为空则默认为空字符串
                    const headerValue = cell ? cell.v : '';
                    headers.push(headerValue);
                }

                // 转换工作表数据为JSON，保留空列
                const excelData = xlsx.utils.sheet_to_json(worksheet, {
                    header: headers, // 使用提取的表头
                    defval: '-',    // 将空单元格设置为null而不是忽略
                });

                // 从数据中移除表头行（第一行）
                if (excelData.length > 0) {
                    excelData.shift(); // 移除第一行（表头）
                }

                console.log(excelData);

                // 获取所有列名（包括空列）
                const excelColumns = headers;
                console.log(excelColumns);

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
                    for (const group of platformStructure) {
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

                            // 解析排除规则
                            let exclusionRules = [];
                            if (platform.exclusionRule) {
                                try {
                                    exclusionRules = typeof platform.exclusionRule === 'string'
                                        ? JSON.parse(platform.exclusionRule.replace(/'/g, '"'))
                                        : platform.exclusionRule;
                                } catch (e) {
                                    console.error(`解析排除规则错误: ${platform.platformName}`, e);
                                }
                            }

                            // 检查是否被排除规则匹配
                            if (exclusionRules.some(rule => url.includes(rule))) {
                                continue; // 跳过当前平台
                            }

                            // 检查 URL 是否匹配任何规则
                            if (matchRules.some(rule => url.includes(rule))) {
                                // 保存原始行的所有数据
                                platform.matchedData.push({ ...row });
                                platform.matchCount++;
                                group.matchCount++; // 新增：更新平台组的匹配数量
                                matched = true;

                                // 更新当前平台的统计数据
                                columnsToIncludeArray.forEach(col => {
                                    const value = row[col] !== undefined && row[col] !== ''
                                        ? row[col]
                                        : '其他'; // 处理不存在或为空的情况

                                    // 更新平台统计
                                    if (!platform.statistics) {
                                        platform.statistics = {};
                                    }
                                    if (!platform.statistics[col]) {
                                        platform.statistics[col] = {};
                                    }
                                    if (!platform.statistics[col][value]) {
                                        platform.statistics[col][value] = 1;
                                    } else {
                                        platform.statistics[col][value]++;
                                    }

                                    // 更新组统计
                                    if (!group.statistics) {
                                        group.statistics = {};
                                    }
                                    if (!group.statistics[col]) {
                                        group.statistics[col] = {};
                                    }
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

                    // 如果没有匹配到任何平台，将数据放入“其他”组
                    if (!matched) {
                        const otherPlatform = otherGroup.platformGroupChildren[0];
                        otherPlatform.matchedData.push({ ...row });
                        otherPlatform.matchCount++;
                        otherGroup.matchCount++;

                        columnsToIncludeArray.forEach(col => {
                            const value = row[col] !== undefined && row[col] !== ''
                                ? row[col]
                                : '其他';

                            if (!otherPlatform.statistics) {
                                otherPlatform.statistics = {};
                            }
                            if (!otherPlatform.statistics[col]) {
                                otherPlatform.statistics[col] = {};
                            }
                            if (!otherPlatform.statistics[col][value]) {
                                otherPlatform.statistics[col][value] = 1;
                            } else {
                                otherPlatform.statistics[col][value]++;
                            }

                            if (!otherGroup.statistics) {
                                otherGroup.statistics = {};
                            }
                            if (!otherGroup.statistics[col]) {
                                otherGroup.statistics[col] = {};
                            }
                            if (!otherGroup.statistics[col][value]) {
                                otherGroup.statistics[col][value] = 1;
                            } else {
                                otherGroup.statistics[col][value]++;
                            }

                            if (!globalStatistics[col][value]) {
                                globalStatistics[col][value] = 1;
                            } else {
                                globalStatistics[col][value]++;
                            }
                        });
                    }
                });

                // 返回结果，添加全局统计和解析到的 Excel 列名
                return cleanupAndRespond(200, 'Excel 数据匹配成功', {
                    totalRows: excelData.length,
                    platformStructure: platformStructure,
                    globalStatistics,
                    excelColumns
                });
            } catch (readError) {
                console.error('读取 Excel 文件错误:', readError);
                return cleanupAndRespond(500, '无法读取上传的 Excel 文件');
            }
        } catch (dbError) {
            console.error('查询数据库获取平台结构错误:', dbError);
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