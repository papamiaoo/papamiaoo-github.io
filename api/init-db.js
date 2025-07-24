const fs = require('fs').promises;
const path = require('path');

// 初始化数据库文件
async function initDatabase() {
    const dataDir = path.join(__dirname, 'data');
    const accountsFile = path.join(dataDir, 'accounts.json');
    const configFile = path.join(dataDir, 'config.json');

    try {
        // 创建数据目录
        await fs.mkdir(dataDir, { recursive: true });
        console.log('数据目录创建成功');

        // 检查accounts.json是否存在
        try {
            await fs.access(accountsFile);
            console.log('accounts.json 已存在');
        } catch {
            // 创建空的账号数据文件
            await fs.writeFile(accountsFile, JSON.stringify([], null, 2));
            console.log('accounts.json 创建成功');
        }

        // 检查config.json是否存在
        try {
            await fs.access(configFile);
            console.log('config.json 已存在');
        } catch {
            // 创建默认配置文件
            const defaultConfig = {
                lastOrderNumber: 0,
                reportPassword: 'papamiao1',
                systemSettings: {
                    maxAccountsPerPage: 50,
                    autoBackup: true,
                    backupInterval: 24 // 小时
                },
                createdAt: new Date().toISOString()
            };
            await fs.writeFile(configFile, JSON.stringify(defaultConfig, null, 2));
            console.log('config.json 创建成功');
        }

        console.log('数据库初始化完成！');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };
