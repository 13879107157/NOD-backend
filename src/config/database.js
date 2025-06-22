const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+08:00', // 设置为中国时区
    logging: false, // 关闭日志输出，生产环境可设置为true以便调试
    define: {
      timestamps: true, // 自动添加createdAt和updatedAt字段
      underscored: true, // 使用下划线命名法
    },
  }
);

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

module.exports = { sequelize, testConnection };
