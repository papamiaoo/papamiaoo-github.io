const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'accounts.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保数据目录存在
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// 读取账号数据
async function readAccounts() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// 保存账号数据
async function saveAccounts(accounts) {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(accounts, null, 2));
}

// 读取配置
async function readConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { lastOrderNumber: 0, reportPassword: 'papamiao1' };
    }
}

// 保存配置
async function saveConfig(config) {
    await ensureDataDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// 生成订单号
async function generateOrderNumber() {
    const config = await readConfig();
    config.lastOrderNumber = (config.lastOrderNumber || 0) + 1;
    await saveConfig(config);
    return 'NO.' + config.lastOrderNumber.toString().padStart(6, '0');
}

// 生成账号ID
function generateAccountId() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '/');
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    return `${dateStr.replace(/\//g, '')}_${timeStr.replace(/:/g, '')}_${Math.random().toString(36).substr(2, 9)}`;
}

// API路由

// 1. 账号管理接口

// 获取所有账号
app.get('/api/accounts', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;
        let accounts = await readAccounts();
        
        // 状态筛选
        if (status && status !== 'all') {
            accounts = accounts.filter(account => account.status === status);
        }
        
        // 搜索筛选
        if (search) {
            const searchTerm = search.toLowerCase();
            accounts = accounts.filter(account => 
                (account.pureCoins && account.pureCoins.toString().includes(searchTerm)) ||
                (account.wechatId && account.wechatId.toLowerCase().includes(searchTerm)) ||
                (account.bossWechatId && account.bossWechatId.toLowerCase().includes(searchTerm)) ||
                (account.orderNumber && account.orderNumber.toLowerCase().includes(searchTerm))
            );
        }
        
        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedAccounts = accounts.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: paginatedAccounts,
            pagination: {
                total: accounts.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(accounts.length / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 获取单个账号
app.get('/api/accounts/:id', async (req, res) => {
    try {
        const accounts = await readAccounts();
        const account = accounts.find(acc => acc.id === req.params.id);
        
        if (!account) {
            return res.status(404).json({ success: false, message: '账号不存在' });
        }
        
        res.json({ success: true, data: account });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 创建新账号（报单）
app.post('/api/accounts', async (req, res) => {
    try {
        const {
            pureCoins, staminaLevel, insuranceSlots, accountLevel,
            awmAmmo, ammo76251, ammo76254, ammo68,
            fullDurabilityHelmet, fullDurabilityArmor,
            acceptAccountInfo, hasPaidKnifeSkin,
            untouchableItems, ownerNotes, wechatId
        } = req.body;
        
        // 验证必填字段
        if (!pureCoins || !staminaLevel || !insuranceSlots || !accountLevel || !wechatId) {
            return res.status(400).json({ 
                success: false, 
                message: '请填写所有必填字段' 
            });
        }
        
        // 验证数据范围
        if (staminaLevel < 1 || staminaLevel > 7) {
            return res.status(400).json({ 
                success: false, 
                message: '体力等级必须在1-7之间' 
            });
        }
        
        if (accountLevel < 1 || accountLevel > 60) {
            return res.status(400).json({ 
                success: false, 
                message: '账号等级必须在1-60之间' 
            });
        }
        
        if (![2, 4, 6, 9].includes(parseInt(insuranceSlots))) {
            return res.status(400).json({ 
                success: false, 
                message: '保险格子只能是2、4、6或9' 
            });
        }
        
        const accounts = await readAccounts();
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '/');
        const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
        
        // 计算当日序号
        const todayAccounts = accounts.filter(acc => 
            acc.createdAt && acc.createdAt.startsWith(dateStr)
        );
        const dayNumber = (todayAccounts.length + 1).toString().padStart(2, '0');
        
        const newAccount = {
            id: generateAccountId(),
            orderNumber: await generateOrderNumber(),
            pureCoins: parseInt(pureCoins),
            staminaLevel: parseInt(staminaLevel),
            insuranceSlots: parseInt(insuranceSlots),
            accountLevel: parseInt(accountLevel),
            awmAmmo: parseInt(awmAmmo) || 0,
            ammo76251: parseInt(ammo76251) || 0,
            ammo76254: parseInt(ammo76254) || 0,
            ammo68: parseInt(ammo68) || 0,
            fullDurabilityHelmet: parseInt(fullDurabilityHelmet) || 0,
            fullDurabilityArmor: parseInt(fullDurabilityArmor) || 0,
            acceptAccountInfo,
            hasPaidKnifeSkin,
            untouchableItems: untouchableItems || '',
            ownerNotes: ownerNotes || '',
            wechatId,
            dateStr,
            dayNumber,
            timeStr,
            createdAt: now.toISOString(),
            status: 'inventory',
            baseCost: 0,
            basePrice: 0,
            extraCost: 0,
            extraPrice: 0
        };
        
        accounts.push(newAccount);
        await saveAccounts(accounts);
        
        res.status(201).json({ 
            success: true, 
            data: newAccount,
            message: '账号创建成功' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 更新账号
app.put('/api/accounts/:id', async (req, res) => {
    try {
        const accounts = await readAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
        
        if (accountIndex === -1) {
            return res.status(404).json({ success: false, message: '账号不存在' });
        }
        
        // 更新账号数据
        accounts[accountIndex] = {
            ...accounts[accountIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await saveAccounts(accounts);
        
        res.json({ 
            success: true, 
            data: accounts[accountIndex],
            message: '账号更新成功' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 删除账号
app.delete('/api/accounts/:id', async (req, res) => {
    try {
        let accounts = await readAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
        
        if (accountIndex === -1) {
            return res.status(404).json({ success: false, message: '账号不存在' });
        }
        
        accounts = accounts.filter(acc => acc.id !== req.params.id);
        await saveAccounts(accounts);
        
        res.json({ success: true, message: '账号删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. 租赁管理接口

// 出租账号
app.post('/api/accounts/:id/rent', async (req, res) => {
    try {
        const { bossWechatId, baseCost, basePrice } = req.body;
        
        if (!bossWechatId) {
            return res.status(400).json({ 
                success: false, 
                message: '请输入老板微信号' 
            });
        }
        
        const accounts = await readAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
        
        if (accountIndex === -1) {
            return res.status(404).json({ success: false, message: '账号不存在' });
        }
        
        if (accounts[accountIndex].status !== 'inventory') {
            return res.status(400).json({ 
                success: false, 
                message: '只能出租库存状态的账号' 
            });
        }
        
        accounts[accountIndex].status = 'rented';
        accounts[accountIndex].bossWechatId = bossWechatId;
        accounts[accountIndex].baseCost = parseFloat(baseCost) || 0;
        accounts[accountIndex].basePrice = parseFloat(basePrice) || 0;
        accounts[accountIndex].lastRentedDate = new Date().toISOString();
        accounts[accountIndex].updatedAt = new Date().toISOString();
        
        await saveAccounts(accounts);
        
        res.json({ 
            success: true, 
            data: accounts[accountIndex],
            message: '账号出租成功' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 结单
app.post('/api/accounts/:id/complete', async (req, res) => {
    try {
        const { extraCost, extraPrice } = req.body;
        
        const accounts = await readAccounts();
        const accountIndex = accounts.findIndex(acc => acc.id === req.params.id);
        
        if (accountIndex === -1) {
            return res.status(404).json({ success: false, message: '账号不存在' });
        }
        
        if (accounts[accountIndex].status !== 'rented') {
            return res.status(400).json({ 
                success: false, 
                message: '只能结算出租中的账号' 
            });
        }
        
        accounts[accountIndex].status = 'completed';
        accounts[accountIndex].extraCost = parseFloat(extraCost) || 0;
        accounts[accountIndex].extraPrice = parseFloat(extraPrice) || 0;
        accounts[accountIndex].completedAt = new Date().toISOString();
        accounts[accountIndex].updatedAt = new Date().toISOString();
        
        await saveAccounts(accounts);
        
        res.json({ 
            success: true, 
            data: accounts[accountIndex],
            message: '订单结算成功' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. 统计和报表接口

// 获取统计数据
app.get('/api/statistics', async (req, res) => {
    try {
        const accounts = await readAccounts();

        const inventoryCount = accounts.filter(acc => acc.status === 'inventory').length;
        const rentedCount = accounts.filter(acc => acc.status === 'rented').length;
        const completedCount = accounts.filter(acc => acc.status === 'completed').length;

        res.json({
            success: true,
            data: {
                total: accounts.length,
                inventory: inventoryCount,
                rented: rentedCount,
                completed: completedCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 获取利润报表（需要密码验证）
app.post('/api/reports/profit', async (req, res) => {
    try {
        const { password } = req.body;
        const config = await readConfig();

        if (password !== config.reportPassword) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }

        const accounts = await readAccounts();
        const completedAccounts = accounts.filter(acc => acc.status === 'completed');

        let totalProfit = 0;
        const profitDetails = completedAccounts.map(account => {
            const profit = (account.basePrice + account.extraPrice) - (account.baseCost + account.extraCost);
            totalProfit += profit;

            return {
                id: account.id,
                orderNumber: account.orderNumber,
                wechatId: account.wechatId,
                bossWechatId: account.bossWechatId,
                baseCost: account.baseCost || 0,
                basePrice: account.basePrice || 0,
                extraCost: account.extraCost || 0,
                extraPrice: account.extraPrice || 0,
                profit,
                completedAt: account.completedAt,
                createdAt: account.createdAt
            };
        });

        const averageProfit = completedAccounts.length > 0 ? totalProfit / completedAccounts.length : 0;

        res.json({
            success: true,
            data: {
                summary: {
                    totalProfit,
                    totalOrders: completedAccounts.length,
                    averageProfit: Math.round(averageProfit * 100) / 100
                },
                details: profitDetails
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. 配置管理接口

// 更新报表密码
app.put('/api/config/password', async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const config = await readConfig();

        if (oldPassword !== config.reportPassword) {
            return res.status(401).json({
                success: false,
                message: '原密码错误'
            });
        }

        config.reportPassword = newPassword;
        await saveConfig(config);

        res.json({
            success: true,
            message: '密码更新成功'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. 批量操作接口

// 批量更新账号状态
app.put('/api/accounts/batch/status', async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的账号ID列表'
            });
        }

        if (!['inventory', 'rented', 'completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的状态值'
            });
        }

        const accounts = await readAccounts();
        let updatedCount = 0;

        accounts.forEach(account => {
            if (ids.includes(account.id)) {
                account.status = status;
                account.updatedAt = new Date().toISOString();
                updatedCount++;
            }
        });

        await saveAccounts(accounts);

        res.json({
            success: true,
            message: `成功更新 ${updatedCount} 个账号的状态`,
            updatedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 批量删除账号
app.delete('/api/accounts/batch', async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的账号ID列表'
            });
        }

        let accounts = await readAccounts();
        const originalCount = accounts.length;

        accounts = accounts.filter(account => !ids.includes(account.id));
        const deletedCount = originalCount - accounts.length;

        await saveAccounts(accounts);

        res.json({
            success: true,
            message: `成功删除 ${deletedCount} 个账号`,
            deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. 数据导入导出接口

// 导出数据
app.get('/api/export', async (req, res) => {
    try {
        const { format = 'json', status } = req.query;
        let accounts = await readAccounts();

        if (status && status !== 'all') {
            accounts = accounts.filter(account => account.status === status);
        }

        if (format === 'csv') {
            // 生成CSV格式
            const csvHeader = [
                '订单号', '纯币数量', '体力等级', '保险格子', '账号等级',
                'AWM子弹', '7.62*51子弹', '7.62*54子弹', '6.8子弹',
                '满耐久6头', '满耐久6甲', '接受账密', '付费刀皮',
                '仓库限制', '号主备注', '微信号', '老板微信', '状态',
                '基础成本', '基础售价', '增值成本', '增值售价', '创建时间'
            ].join(',');

            const csvRows = accounts.map(account => [
                account.orderNumber || '',
                account.pureCoins || 0,
                account.staminaLevel || 0,
                account.insuranceSlots || 0,
                account.accountLevel || 0,
                account.awmAmmo || 0,
                account.ammo76251 || 0,
                account.ammo76254 || 0,
                account.ammo68 || 0,
                account.fullDurabilityHelmet || 0,
                account.fullDurabilityArmor || 0,
                account.acceptAccountInfo || '',
                account.hasPaidKnifeSkin || '',
                account.untouchableItems || '',
                account.ownerNotes || '',
                account.wechatId || '',
                account.bossWechatId || '',
                account.status || '',
                account.baseCost || 0,
                account.basePrice || 0,
                account.extraCost || 0,
                account.extraPrice || 0,
                account.createdAt || ''
            ].join(','));

            const csvContent = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=accounts_${new Date().toISOString().split('T')[0]}.csv`);
            res.send('\ufeff' + csvContent); // 添加BOM以支持中文
        } else {
            // JSON格式
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=accounts_${new Date().toISOString().split('T')[0]}.json`);
            res.json({
                exportDate: new Date().toISOString(),
                totalCount: accounts.length,
                data: accounts
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
