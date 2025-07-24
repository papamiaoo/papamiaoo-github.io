// 前端集成示例 - 如何将现有的localStorage代码改为API调用

// 原有的localStorage操作替换示例

// 1. 替换账号数据加载
// 原代码：
// const savedAccounts = localStorage.getItem('deltaAccounts');
// if (savedAccounts) {
//     accounts = JSON.parse(savedAccounts);
// }

// 新代码：
async function loadAccounts() {
    try {
        const response = await AccountAPI.getAccounts();
        accounts = response.data;
        return accounts;
    } catch (error) {
        ErrorHandler.showError(error);
        return [];
    }
}

// 2. 替换账号保存
// 原代码：
// localStorage.setItem('deltaAccounts', JSON.stringify(accounts));

// 新代码：
async function saveAccount(accountData) {
    try {
        const response = await AccountAPI.createAccount(accountData);
        return ErrorHandler.handleResponse(response, '账号创建成功');
    } catch (error) {
        ErrorHandler.showError(error);
        throw error;
    }
}

// 3. 替换表单提交处理
// 修改原有的表单提交事件处理器
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 表单验证代码保持不变...
    let isValid = true;
    
    // 验证逻辑...
    const pureCoins = document.getElementById('pureCoins');
    if (!pureCoins.value || isNaN(pureCoins.value) || Number(pureCoins.value) < 0) {
        document.getElementById('pureCoinsError').style.display = 'block';
        isValid = false;
    }
    
    // ... 其他验证逻辑
    
    if (isValid) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            LoadingManager.show(submitBtn);
            
            const accountData = {
                pureCoins: parseInt(document.getElementById('pureCoins').value),
                staminaLevel: parseInt(document.getElementById('staminaLevel').value),
                insuranceSlots: parseInt(document.getElementById('insuranceSlots').value),
                accountLevel: parseInt(document.getElementById('accountLevel').value),
                awmAmmo: parseInt(document.getElementById('awmAmmo').value) || 0,
                ammo76251: parseInt(document.getElementById('ammo76251').value) || 0,
                ammo76254: parseInt(document.getElementById('ammo76254').value) || 0,
                ammo68: parseInt(document.getElementById('ammo68').value) || 0,
                fullDurabilityHelmet: parseInt(document.getElementById('fullDurabilityHelmet').value) || 0,
                fullDurabilityArmor: parseInt(document.getElementById('fullDurabilityArmor').value) || 0,
                acceptAccountInfo: document.getElementById('acceptAccountInfo').value,
                hasPaidKnifeSkin: document.getElementById('hasPaidKnifeSkin').value,
                untouchableItems: document.getElementById('untouchableItems').value,
                ownerNotes: document.getElementById('ownerNotes').value,
                wechatId: document.getElementById('wechatId').value
            };
            
            await saveAccount(accountData);
            
            // 清空表单
            document.getElementById('reportForm').reset();
            
            // 跳转到库存页面
            document.querySelectorAll('.container').forEach(page => {
                page.style.display = 'none';
            });
            document.getElementById('inventoryPage').style.display = 'block';
            
            // 重新加载账号列表
            await renderAccountCards();
            
        } catch (error) {
            // 错误已在saveAccount中处理
        } finally {
            LoadingManager.hide(submitBtn, originalText);
        }
    }
});

// 4. 替换渲染函数
async function renderAccountCards() {
    const cardsContainer = document.getElementById('accountCards');
    cardsContainer.innerHTML = '';
    
    try {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const params = {
            status: 'inventory',
            search: searchTerm || undefined
        };
        
        const response = await AccountAPI.getAccounts(params);
        const accounts = response.data;
        
        accounts.forEach(account => {
            const card = createAccountCard(account);
            cardsContainer.appendChild(card);
        });
        
        if (accounts.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; color: #666;">暂无库存账号</p>';
        }
        
    } catch (error) {
        ErrorHandler.showError(error);
        cardsContainer.innerHTML = '<p style="text-align: center; color: #f00;">加载失败，请重试</p>';
    }
}

// 5. 替换编辑功能
async function updateAccount(id, accountData) {
    try {
        const response = await AccountAPI.updateAccount(id, accountData);
        return ErrorHandler.handleResponse(response, '账号更新成功');
    } catch (error) {
        ErrorHandler.showError(error);
        throw error;
    }
}

// 修改编辑表单提交
document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        LoadingManager.show(submitBtn);
        
        const accountData = {
            pureCoins: parseInt(document.getElementById('editPureCoins').value),
            staminaLevel: parseInt(document.getElementById('editStaminaLevel').value),
            // ... 其他字段
            baseCost: parseFloat(document.getElementById('editBaseCost').value) || 0,
            basePrice: parseFloat(document.getElementById('editBasePrice').value) || 0,
            extraCost: parseFloat(document.getElementById('editExtraCost').value) || 0,
            extraPrice: parseFloat(document.getElementById('editExtraPrice').value) || 0
        };
        
        await updateAccount(currentEditId, accountData);
        
        // 关闭模态框
        document.getElementById('editModal').classList.remove('active');
        
        // 重新渲染相关页面
        await renderAccountCards();
        await renderRentalCards();
        await renderHistoryCards();
        
    } catch (error) {
        // 错误已处理
    } finally {
        LoadingManager.hide(submitBtn, originalText);
    }
});

// 6. 替换删除功能
async function deleteAccount(id) {
    try {
        const response = await AccountAPI.deleteAccount(id);
        return ErrorHandler.handleResponse(response, '账号删除成功');
    } catch (error) {
        ErrorHandler.showError(error);
        throw error;
    }
}

// 修改删除确认
document.getElementById('confirmYes').addEventListener('click', async function() {
    if (accountToDelete) {
        try {
            await deleteAccount(accountToDelete);
            
            // 重新渲染页面
            await renderAccountCards();
            await renderRentalCards();
            
            accountToDelete = null;
        } catch (error) {
            // 错误已处理
        }
    }
    document.getElementById('confirmDialog').classList.remove('active');
});

// 7. 替换出租功能
async function rentAccount(id, rentData) {
    try {
        const response = await AccountAPI.rentAccount(id, rentData);
        return ErrorHandler.handleResponse(response, '账号出租成功');
    } catch (error) {
        ErrorHandler.showError(error);
        throw error;
    }
}

// 8. 替换结单功能
async function completeAccount(id, completeData) {
    try {
        const response = await AccountAPI.completeAccount(id, completeData);
        return ErrorHandler.handleResponse(response, '订单结算成功');
    } catch (error) {
        ErrorHandler.showError(error);
        throw error;
    }
}

// 9. 替换利润报表
async function renderProfitReport() {
    const cardsContainer = document.getElementById('profitCards');
    const totalProfitSum = document.getElementById('totalProfitSum');
    const totalOrders = document.getElementById('totalOrders');
    const averageProfit = document.getElementById('averageProfit');
    
    try {
        const password = document.getElementById('reportPassword').value;
        const response = await ReportAPI.getProfitReport(password);
        const data = response.data;
        
        // 更新汇总信息
        totalProfitSum.textContent = data.summary.totalProfit;
        totalOrders.textContent = data.summary.totalOrders;
        averageProfit.textContent = data.summary.averageProfit;
        
        // 渲染详细列表
        cardsContainer.innerHTML = '';
        data.details.forEach(detail => {
            const card = createProfitCard(detail);
            cardsContainer.appendChild(card);
        });
        
        if (data.details.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; color: #666;">暂无利润数据</p>';
        }
        
    } catch (error) {
        ErrorHandler.showError(error);
        cardsContainer.innerHTML = '<p style="text-align: center; color: #f00;">加载失败，请重试</p>';
    }
}

// 10. 页面初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 原有的初始化代码...
    
    try {
        // 加载账号数据
        await loadAccounts();
        
        // 渲染各个页面
        await renderAccountCards();
        await renderRentalCards();
        await renderHistoryCards();
        
    } catch (error) {
        console.error('页面初始化失败:', error);
    }
    
    // 其他事件监听器保持不变...
});

// 11. 数据导出功能
function exportData(format = 'json') {
    try {
        ExportAPI.exportData(format);
        ErrorHandler.showSuccess('数据导出成功');
    } catch (error) {
        ErrorHandler.showError(error);
    }
}

// 12. 缓存优化示例
async function getCachedAccounts(params = {}) {
    const cacheKey = `accounts_${JSON.stringify(params)}`;
    let accounts = CacheManager.get(cacheKey);
    
    if (!accounts) {
        const response = await AccountAPI.getAccounts(params);
        accounts = response.data;
        CacheManager.set(cacheKey, accounts);
    }
    
    return accounts;
}

// 使用示例：
// const accounts = await getCachedAccounts({ status: 'inventory' });
