# 三角洲报单系统部署指南

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Nginx)   │────│   后端 (Node.js) │────│   数据 (JSON)    │
│   Port: 80      │    │   Port: 3000    │    │   文件存储       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 功能模块总结

### 1. 账号管理模块
- ✅ 报单系统（新增账号）
- ✅ 库存管理（查看、编辑、删除）
- ✅ 搜索和筛选功能
- ✅ 批量操作（状态更新、删除）

### 2. 租赁管理模块
- ✅ 出租系统（库存→出租中）
- ✅ 结单系统（出租中→已完成）
- ✅ 状态流转管理
- ✅ 排序功能（按未租天数）

### 3. 财务管理模块
- ✅ 利润计算（基础+增值）
- ✅ 利润报表（总计、平均）
- ✅ 密码保护访问
- ✅ 财务数据导出

### 4. 数据管理模块
- ✅ 数据导入导出（JSON/CSV）
- ✅ 批量操作支持
- ✅ 数据备份机制

## 接口化改造内容

### 已实现的API接口

#### 账号管理接口
- `GET /api/accounts` - 获取账号列表（支持分页、搜索、筛选）
- `GET /api/accounts/:id` - 获取单个账号详情
- `POST /api/accounts` - 创建新账号（报单）
- `PUT /api/accounts/:id` - 更新账号信息
- `DELETE /api/accounts/:id` - 删除账号

#### 租赁管理接口
- `POST /api/accounts/:id/rent` - 出租账号
- `POST /api/accounts/:id/complete` - 结单操作

#### 批量操作接口
- `PUT /api/accounts/batch/status` - 批量更新状态
- `DELETE /api/accounts/batch` - 批量删除

#### 统计报表接口
- `GET /api/statistics` - 获取统计数据
- `POST /api/reports/profit` - 获取利润报表（需密码）

#### 配置管理接口
- `PUT /api/config/password` - 更新报表密码

#### 数据导出接口
- `GET /api/export` - 数据导出（JSON/CSV格式）

### 前端集成模块
- ✅ API客户端封装（`js/api.js`）
- ✅ 错误处理机制
- ✅ 加载状态管理
- ✅ 数据缓存优化
- ✅ 集成示例代码

## 部署方式

### 方式一：Docker部署（推荐）

1. **安装Docker和Docker Compose**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose
```

2. **启动服务**
```bash
# 克隆项目
git clone <repository-url>
cd delta-order-system

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

3. **访问系统**
- 前端：http://localhost
- API文档：http://localhost/api

### 方式二：手动部署

#### 后端部署

1. **安装Node.js**
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **部署后端**
```bash
cd api
npm install
npm run init-db
npm start
```

#### 前端部署

1. **安装Nginx**
```bash
sudo apt install nginx
```

2. **配置Nginx**
```bash
# 复制项目文件到web目录
sudo cp -r . /var/www/html/delta-system/

# 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/delta-system
sudo ln -s /etc/nginx/sites-available/delta-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 环境配置

### 环境变量

创建 `api/.env` 文件：
```env
NODE_ENV=production
PORT=3000
DATA_DIR=./data
REPORT_PASSWORD=papamiao1
MAX_ACCOUNTS_PER_PAGE=50
```

### 数据目录权限

```bash
# 确保数据目录有正确权限
sudo chown -R www-data:www-data /path/to/api/data
sudo chmod -R 755 /path/to/api/data
```

## 数据迁移

### 从localStorage迁移到API

1. **导出现有数据**
```javascript
// 在浏览器控制台执行
const accounts = JSON.parse(localStorage.getItem('deltaAccounts') || '[]');
console.log(JSON.stringify(accounts, null, 2));
```

2. **批量导入数据**
```bash
# 使用API批量创建账号
curl -X POST http://localhost:3000/api/accounts/batch \
  -H "Content-Type: application/json" \
  -d @accounts.json
```

## 监控和维护

### 日志管理

```bash
# 查看API日志
docker-compose logs api

# 查看Nginx日志
docker-compose logs web

# 查看实时日志
docker-compose logs -f --tail=100
```

### 数据备份

```bash
# 备份数据文件
cp -r api/data api/data.backup.$(date +%Y%m%d)

# 自动备份脚本
#!/bin/bash
BACKUP_DIR="/backup/delta-system"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp -r api/data $BACKUP_DIR/data_$DATE
find $BACKUP_DIR -name "data_*" -mtime +7 -delete
```

### 性能优化

1. **启用Gzip压缩**（已在nginx.conf中配置）
2. **静态文件缓存**（已配置）
3. **API响应缓存**（前端已实现）

## 安全配置

### 1. 更改默认密码
```bash
curl -X PUT http://localhost:3000/api/config/password \
  -H "Content-Type: application/json" \
  -d '{"oldPassword":"papamiao1","newPassword":"your-new-password"}'
```

### 2. 配置HTTPS（生产环境）
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... 其他配置
}
```

### 3. 防火墙配置
```bash
# 只开放必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 故障排除

### 常见问题

1. **API连接失败**
   - 检查后端服务是否启动：`docker-compose ps`
   - 检查端口是否被占用：`netstat -tlnp | grep 3000`

2. **数据不显示**
   - 检查API响应：`curl http://localhost:3000/api/accounts`
   - 查看浏览器控制台错误

3. **权限错误**
   - 检查数据目录权限：`ls -la api/data`
   - 确保进程有读写权限

### 日志分析

```bash
# 查看错误日志
grep -i error /var/log/nginx/error.log
docker-compose logs api | grep -i error

# 查看访问统计
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr
```

## 升级指南

### 版本更新

```bash
# 停止服务
docker-compose down

# 备份数据
cp -r api/data api/data.backup

# 更新代码
git pull origin main

# 重新构建并启动
docker-compose up -d --build
```

### 数据库迁移

如果数据结构有变化，需要运行迁移脚本：
```bash
cd api
node migrate.js
```

## 支持和维护

- 📧 技术支持：papamiaoo@example.com
- 📖 API文档：`api/API_DOCUMENTATION.md`
- 🐛 问题反馈：GitHub Issues
- 📝 更新日志：CHANGELOG.md
