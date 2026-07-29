# 新能源物流城业务系统 - 后端服务

## 启动

```bash
cd server
npm install
npm start
```

服务启动后：
- 前端访问：http://localhost:3000/
- API 地址：http://localhost:3000/api/

## 演示账号

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 管理员（全权限） |
| operator | op123 | 运营专员 |
| finance | fin123 | 财务专员 |

## API 端点

### 认证
- `POST /api/login` - 登录
- `POST /api/logout` - 登出
- `GET /api/me` - 当前用户

### CRUD（6 张表通用）
- `GET /api/{table}` - 列表
- `GET /api/{table}/:id` - 详情
- `POST /api/{table}` - 新增
- `PUT /api/{table}/:id` - 修改
- `DELETE /api/{table}/:id` - 删除（需要 admin）

支持的 table：
- `car_policies` 车险保单
- `other_policies` 非车险保单
- `extended_policies` 延保
- `agreements` 协议
- `consultations` 咨询费
- `commissions` 佣金结算

### 统计
- `GET /api/stats/overview` - 总览数据

### 日志
- `GET /api/operation_logs?limit=100` - 操作日志

## 数据迁移

如果之前在浏览器 localStorage 里有数据：

1. 打开浏览器开发者工具，在控制台运行：
```javascript
copy(JSON.stringify({
  carPolicies: getList('nle.carPolicies'),
  otherPolicies: getList('nle.otherPolicies'),
  extendedPolicies: getList('nle.extendedPolicies'),
  agreements: getList('nle.agreements'),
  consultations: getList('nle.consultations'),
  commissions: getList('nle.commissions')
}, null, 2))
```

2. 粘贴到 `server/data/seed.json`

3. 运行 `npm run import-local`

## 文件结构

```
server/
├── package.json
├── server.js          # 主入口
├── db.js              # 数据库初始化
├── init-db.js         # 数据迁移脚本
├── README.md
├── data/
│   ├── nle.db         # SQLite 数据库（自动生成）
│   └── seed.json      # 种子数据（可选）
└── routes/            # 预留：可拆分为独立路由模块
```