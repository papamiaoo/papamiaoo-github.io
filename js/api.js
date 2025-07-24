// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// API工具类
class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    // PUT请求
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// 创建API客户端实例
const api = new ApiClient();

// 账号管理API
const AccountAPI = {
    // 获取账号列表
    async getAccounts(params = {}) {
        return api.get('/accounts', params);
    },

    // 获取单个账号
    async getAccount(id) {
        return api.get(`/accounts/${id}`);
    },

    // 创建账号（报单）
    async createAccount(accountData) {
        return api.post('/accounts', accountData);
    },

    // 更新账号
    async updateAccount(id, accountData) {
        return api.put(`/accounts/${id}`, accountData);
    },

    // 删除账号
    async deleteAccount(id) {
        return api.delete(`/accounts/${id}`);
    },

    // 出租账号
    async rentAccount(id, rentData) {
        return api.post(`/accounts/${id}/rent`, rentData);
    },

    // 结单
    async completeAccount(id, completeData) {
        return api.post(`/accounts/${id}/complete`, completeData);
    },

    // 批量更新状态
    async batchUpdateStatus(ids, status) {
        return api.put('/accounts/batch/status', { ids, status });
    },

    // 批量删除
    async batchDelete(ids) {
        return api.delete('/accounts/batch', { body: { ids } });
    }
};

// 统计和报表API
const ReportAPI = {
    // 获取统计数据
    async getStatistics() {
        return api.get('/statistics');
    },

    // 获取利润报表
    async getProfitReport(password) {
        return api.post('/reports/profit', { password });
    }
};

// 配置管理API
const ConfigAPI = {
    // 更新密码
    async updatePassword(oldPassword, newPassword) {
        return api.put('/config/password', { oldPassword, newPassword });
    }
};

// 数据导入导出API
const ExportAPI = {
    // 导出数据
    async exportData(format = 'json', status = 'all') {
        const params = { format, status };
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}/export?${queryString}`;
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = `accounts_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// 错误处理工具
const ErrorHandler = {
    // 显示错误消息
    showError(error) {
        const message = error.message || '操作失败，请重试';
        alert(message);
        console.error('操作错误:', error);
    },

    // 显示成功消息
    showSuccess(message) {
        alert(message);
    },

    // 处理API响应
    handleResponse(response, successMessage = '操作成功') {
        if (response.success) {
            if (successMessage) {
                this.showSuccess(successMessage);
            }
            return response.data;
        } else {
            throw new Error(response.message || '操作失败');
        }
    }
};

// 加载状态管理
const LoadingManager = {
    // 显示加载状态
    show(element) {
        if (element) {
            element.disabled = true;
            element.textContent = '加载中...';
        }
    },

    // 隐藏加载状态
    hide(element, originalText) {
        if (element) {
            element.disabled = false;
            element.textContent = originalText;
        }
    }
};

// 数据缓存管理
const CacheManager = {
    cache: new Map(),
    
    // 设置缓存
    set(key, data, ttl = 5 * 60 * 1000) { // 默认5分钟过期
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    },
    
    // 获取缓存
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    },
    
    // 清除缓存
    clear(key) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
};

// 导出API模块
window.AccountAPI = AccountAPI;
window.ReportAPI = ReportAPI;
window.ConfigAPI = ConfigAPI;
window.ExportAPI = ExportAPI;
window.ErrorHandler = ErrorHandler;
window.LoadingManager = LoadingManager;
window.CacheManager = CacheManager;
