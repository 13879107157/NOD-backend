const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize, testConnection } = require('./config/database');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 导入路由
const userRoutes = require('./routes/user.route');
const platformTypeRoutes = require('./routes/platformType.route');
const platformGroupRoutes = require('./routes/platformGroup.route');
const platformRoutes = require('./routes/platform.route');
const platformStructureRoutes = require('./routes/platformStructure.route');
const excelMatchingRoutes = require('./routes/excelMatching.route');
const testMatchingRuleRoutes = require('./routes/testMatchingRule.route'); // 新增路由

// 使用路由
app.use('/api/users', userRoutes);
app.use('/api/platform-types', platformTypeRoutes);
app.use('/api/platform-groups', platformGroupRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/platform-structure', platformStructureRoutes);
app.use('/api/excelMatching', excelMatchingRoutes);
app.use('/api', testMatchingRuleRoutes); // 使用新路由

// 404错误处理
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: '未找到该接口',
        data: null
    });
});

// 启动服务器
app.listen(port, async () => {
    console.log(`服务器运行在端口 ${port}`);
    await testConnection();

    try {
        // 导入所有模型
        const User = require('./models/user.model');
        const PlatformType = require('./models/platformType.model');
        const PlatformGroup = require('./models/platformGroup.model');
        const Platform = require('./models/platform.model');

        // 创建模型对象映射
        const models = { User, PlatformType, PlatformGroup, Platform };

        // 调用每个模型的associate方法建立关联
        Object.values(models).forEach(model => {
            if (model.associate) {
                model.associate(models);
            }
        });

        // 手动指定同步顺序
        await PlatformType.sync();
        await PlatformGroup.sync();
        await Platform.sync();
        await User.sync();

        console.log('数据库模型同步成功');
    } catch (error) {
        console.error('数据库模型同步失败:', error);
    }
});