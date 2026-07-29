// 新能源物流城业务系统 - Express 服务器（JSON 文件存储）
// 不用 SQLite，避免 native module 编译问题
// 数据存在 data/*.json 文件中

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// 数据目录：Render 部署时用 /data（持久化磁盘），本地用 ./data
const DATA_DIR = process.env.NLE_DATA_DIR || path.join(__dirname, 'data');

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件 - 服务前端
app.use(express.static(path.join(__dirname, '..')));

// ---- 文件存储 ----

const TABLES = ['car_policies', 'other_policies', 'extended_policies', 'agreements', 'consultations', 'commissions', 'claims', 'operation_logs'];

function ensureFile(table) {
  const f = path.join(DATA_DIR, table + '.json');
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, '[]', 'utf8');
  }
  return f;
}

function readAll(table) {
  ensureFile(table);
  const f = path.join(DATA_DIR, table + '.json');
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function writeAll(table, data) {
  const f = path.join(DATA_DIR, table + '.json');
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
}

// ---- 用户（演示账号，存内存） ----

const USERS = [
  { username: 'admin', password: 'admin123', name: 'Vickey', role: 'admin' },
  { username: 'operator', password: 'op123', name: '运营专员', role: 'operator' },
  { username: 'finance', password: 'fin123', name: '财务专员', role: 'finance' }
];

const tokens = new Map();

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !tokens.has(token)) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  req.user = tokens.get(token);
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function logOperation(user, role, action, module, target, detail) {
  try {
    const logs = readAll('operation_logs');
    logs.unshift({
      id: nextId(logs),
      time: new Date().toISOString(),
      user, role, action, module, target: String(target || ''),
      detail: detail || ''
    });
    // 保留最近 500 条
    if (logs.length > 500) logs.length = 500;
    writeAll('operation_logs', logs);
  } catch (e) {
    console.error('Log error:', e);
  }
}

// ---- 路由 ----

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), users: USERS.length, tables: TABLES.length });
});

// 登录
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: '账号或密码错误' });
  }
  const token = generateToken();
  const session = { token, username: user.username, name: user.name, role: user.role };
  tokens.set(token, session);
  logOperation(user.username, user.role, 'login', 'auth', '', '');
  res.json(session);
});

app.post('/api/logout', requireAuth, (req, res) => {
  tokens.delete(req.user.token);
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// CRUD 通用端点
for (const table of TABLES) {
  if (table === 'operation_logs') {
    app.get(`/api/${table}`, requireAuth, (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const logs = readAll(table).slice(0, limit);
      res.json(logs);
    });
    continue;
  }

  app.get(`/api/${table}`, requireAuth, (req, res) => {
    const items = readAll(table);
    items.sort((a, b) => (b.id || 0) - (a.id || 0));
    res.json(items);
  });

  app.get(`/api/${table}/:id`, requireAuth, (req, res) => {
    const items = readAll(table);
    const item = items.find(i => String(i.id) === String(req.params.id));
    if (!item) return res.status(404).json({ error: '不存在' });
    res.json(item);
  });

  app.post(`/api/${table}`, requireAuth, (req, res) => {
    const items = readAll(table);
    const newItem = { id: nextId(items), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body };
    items.unshift(newItem);
    writeAll(table, items);
    logOperation(req.user.username, req.user.role, 'create', table, newItem.id, JSON.stringify(req.body).slice(0, 200));
    res.json(newItem);
  });

  app.put(`/api/${table}/:id`, requireAuth, (req, res) => {
    const items = readAll(table);
    const idx = items.findIndex(i => String(i.id) === String(req.params.id));
    if (idx < 0) return res.status(404).json({ error: '不存在' });
    items[idx] = { ...items[idx], ...req.body, id: items[idx].id, updated_at: new Date().toISOString() };
    writeAll(table, items);
    logOperation(req.user.username, req.user.role, 'update', table, req.params.id, JSON.stringify(req.body).slice(0, 200));
    res.json({ ok: true });
  });

  app.delete(`/api/${table}/:id`, requireAuth, requireAdmin, (req, res) => {
    const items = readAll(table);
    const filtered = items.filter(i => String(i.id) !== String(req.params.id));
    writeAll(table, filtered);
    logOperation(req.user.username, req.user.role, 'delete', table, req.params.id, '');
    res.json({ ok: true });
  });
}

// 批量导入（用于从 localStorage 迁移）
app.post('/api/import/:table', requireAuth, (req, res) => {
  const table = req.params.table;
  if (!TABLES.includes(table) || table === 'operation_logs') {
    return res.status(400).json({ error: '非法表名' });
  }
  const incoming = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: '需要数组' });
  const existing = readAll(table);
  const items = [...incoming.map(item => ({
    id: nextId(existing.concat(item)),
    ...item,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))];
  items.push(...existing);
  writeAll(table, items);
  logOperation(req.user.username, req.user.role, 'import', table, '', `导入 ${incoming.length} 条`);
  res.json({ ok: true, count: incoming.length });
});

// 统计端点
app.get('/api/stats/overview', requireAuth, (req, res) => {
  const result = {};
  for (const t of TABLES) {
    if (t === 'operation_logs') continue;
    result[t.replace('_policies', '').replace('ies', 'y').replace('_', '')] = readAll(t).length;
  }
  res.json(result);
});

// SPA fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 启动
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 新能源物流城业务系统后端服务');
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 前端: http://localhost:${PORT}/`);
  console.log(`🔌 API: http://localhost:${PORT}/api/`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});