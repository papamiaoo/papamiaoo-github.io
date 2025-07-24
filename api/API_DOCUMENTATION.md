# 三角洲报单系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 响应格式

所有API响应都遵循以下格式：

```json
{
  "success": true|false,
  "data": {},
  "message": "操作结果描述",
  "pagination": {} // 仅在分页接口中存在
}
```

## 1. 账号管理接口

### 1.1 获取账号列表

**GET** `/accounts`

**查询参数**:
- `status` (string, 可选): 账号状态 (`inventory`, `rented`, `completed`, `all`)
- `search` (string, 可选): 搜索关键词
- `page` (number, 可选): 页码，默认1
- `limit` (number, 可选): 每页数量，默认50

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "20241224_143022_abc123def",
      "orderNumber": "NO.000001",
      "pureCoins": 100,
      "staminaLevel": 5,
      "insuranceSlots": 6,
      "accountLevel": 45,
      "awmAmmo": 10,
      "ammo76251": 20,
      "ammo76254": 15,
      "ammo68": 30,
      "fullDurabilityHelmet": 2,
      "fullDurabilityArmor": 1,
      "acceptAccountInfo": "是",
      "hasPaidKnifeSkin": "有",
      "untouchableItems": "特殊装备",
      "ownerNotes": "备注信息",
      "wechatId": "user123",
      "bossWechatId": "boss456",
      "status": "inventory",
      "baseCost": 100,
      "basePrice": 150,
      "extraCost": 50,
      "extraPrice": 80,
      "createdAt": "2024-12-24T14:30:22.000Z",
      "updatedAt": "2024-12-24T14:30:22.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### 1.2 获取单个账号

**GET** `/accounts/:id`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "20241224_143022_abc123def",
    "orderNumber": "NO.000001",
    // ... 其他字段
  }
}
```

### 1.3 创建账号（报单）

**POST** `/accounts`

**请求体**:
```json
{
  "pureCoins": 100,
  "staminaLevel": 5,
  "insuranceSlots": 6,
  "accountLevel": 45,
  "awmAmmo": 10,
  "ammo76251": 20,
  "ammo76254": 15,
  "ammo68": 30,
  "fullDurabilityHelmet": 2,
  "fullDurabilityArmor": 1,
  "acceptAccountInfo": "是",
  "hasPaidKnifeSkin": "有",
  "untouchableItems": "特殊装备",
  "ownerNotes": "备注信息",
  "wechatId": "user123"
}
```

**验证规则**:
- `pureCoins`: 必填，正整数
- `staminaLevel`: 必填，1-7之间的整数
- `insuranceSlots`: 必填，只能是2、4、6、9
- `accountLevel`: 必填，1-60之间的整数
- `acceptAccountInfo`: 必填，只能是"是"或"否"
- `hasPaidKnifeSkin`: 必填，只能是"有"或"无"
- `wechatId`: 必填，非空字符串

### 1.4 更新账号

**PUT** `/accounts/:id`

**请求体**: 与创建账号相同，但所有字段都是可选的

### 1.5 删除账号

**DELETE** `/accounts/:id`

### 1.6 出租账号

**POST** `/accounts/:id/rent`

**请求体**:
```json
{
  "bossWechatId": "boss456",
  "baseCost": 100,
  "basePrice": 150
}
```

**验证规则**:
- `bossWechatId`: 必填，非空字符串
- `baseCost`: 可选，非负数
- `basePrice`: 可选，非负数

### 1.7 结单

**POST** `/accounts/:id/complete`

**请求体**:
```json
{
  "extraCost": 50,
  "extraPrice": 80
}
```

## 2. 批量操作接口

### 2.1 批量更新状态

**PUT** `/accounts/batch/status`

**请求体**:
```json
{
  "ids": ["id1", "id2", "id3"],
  "status": "inventory"
}
```

### 2.2 批量删除

**DELETE** `/accounts/batch`

**请求体**:
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

## 3. 统计和报表接口

### 3.1 获取统计数据

**GET** `/statistics`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "inventory": 30,
    "rented": 20,
    "completed": 50
  }
}
```

### 3.2 获取利润报表

**POST** `/reports/profit`

**请求体**:
```json
{
  "password": "papamiao1"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProfit": 5000,
      "totalOrders": 50,
      "averageProfit": 100
    },
    "details": [
      {
        "id": "account_id",
        "orderNumber": "NO.000001",
        "wechatId": "user123",
        "bossWechatId": "boss456",
        "baseCost": 100,
        "basePrice": 150,
        "extraCost": 50,
        "extraPrice": 80,
        "profit": 80,
        "completedAt": "2024-12-24T14:30:22.000Z",
        "createdAt": "2024-12-24T14:30:22.000Z"
      }
    ]
  }
}
```

## 4. 配置管理接口

### 4.1 更新报表密码

**PUT** `/config/password`

**请求体**:
```json
{
  "oldPassword": "papamiao1",
  "newPassword": "newpassword123"
}
```

## 5. 数据导入导出接口

### 5.1 导出数据

**GET** `/export`

**查询参数**:
- `format` (string, 可选): 导出格式 (`json`, `csv`)，默认`json`
- `status` (string, 可选): 账号状态筛选，默认`all`

**响应**: 文件下载

## 错误码说明

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 认证失败（密码错误）
- `404`: 资源不存在
- `500`: 服务器内部错误

## 数据模型

### Account（账号）

```typescript
interface Account {
  id: string;                    // 账号ID
  orderNumber: string;           // 订单号
  pureCoins: number;            // 纯币数量
  staminaLevel: number;         // 体力等级 (1-7)
  insuranceSlots: number;       // 保险格子 (2,4,6,9)
  accountLevel: number;         // 账号等级 (1-60)
  awmAmmo: number;              // AWM子弹
  ammo76251: number;            // 7.62*51子弹
  ammo76254: number;            // 7.62*54子弹
  ammo68: number;               // 6.8子弹
  fullDurabilityHelmet: number; // 满耐久6头
  fullDurabilityArmor: number;  // 满耐久6甲
  acceptAccountInfo: string;    // 接受账密 ("是"|"否")
  hasPaidKnifeSkin: string;     // 付费刀皮 ("有"|"无")
  untouchableItems: string;     // 仓库限制
  ownerNotes: string;           // 号主备注
  wechatId: string;             // 微信号
  bossWechatId?: string;        // 老板微信号
  status: string;               // 状态 ("inventory"|"rented"|"completed")
  baseCost: number;             // 基础成本
  basePrice: number;            // 基础售价
  extraCost: number;            // 增值成本
  extraPrice: number;           // 增值售价
  dateStr: string;              // 日期字符串
  dayNumber: string;            // 当日序号
  timeStr: string;              // 时间字符串
  createdAt: string;            // 创建时间
  updatedAt?: string;           // 更新时间
  lastRentedDate?: string;      // 最后出租时间
  completedAt?: string;         // 完成时间
}
```
