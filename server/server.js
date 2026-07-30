// 新能源物流城业务系统 - Express 服务器（JSON 文件存储）
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.NLE_DATA_DIR || path.join(__dirname, 'data');
const STATIC_DIR = fs.existsSync(path.join(__dirname, '..', 'index.html'))
  ? path.join(__dirname, '..')
  : __dirname;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(STATIC_DIR));
app.use('/pages', express.static(path.join(STATIC_DIR, 'pages')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

const TABLES = ['car_policies', 'other_policies', 'extended_policies', 'agreements', 'consultations', 'commissions', 'claims', 'operation_logs'];

function ensureFile(table) {
  const f = path.join(DATA_DIR, table + '.json');
  if (!fs.existsSync(f)) fs.writeFileSync(f, '[]', 'utf8');
  return f;
}
function readAll(table) { ensureFile(table); return JSON.parse(fs.readFileSync(path.join(DATA_DIR, table + '.json'), 'utf8')); }
function writeAll(table, data) { fs.writeFileSync(path.join(DATA_DIR, table + '.json'), JSON.stringify(data, null, 2), 'utf8'); }
function nextId(items) { return items.length === 0 ? 1 : Math.max(...items.map(i => i.id || 0)) + 1; }

const USERS = [
  { username: 'admin', password: 'admin123', name: 'Vickey', role: 'admin' },
  { username: 'operator', password: 'op123', name: '运营专员', role: 'operator' },
  { username: 'finance', password: 'fin123', name: '财务专员', role: 'finance' }
];

const tokens = new Map();
function generateToken() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function requireAuth(req, res, next) {
  const t = req.headers.authorization?.replace('Bearer ', '');
  if (!t || !tokens.has(t)) return res.status(401).json({ error: '未登录' });
  req.user = tokens.get(t); next();
}
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员' });
  next();
}
function logOperation(user, role, action, module, target, detail) {
  try {
    const logs = readAll('operation_logs');
    logs.unshift({ id: nextId(logs), time: new Date().toISOString(), user, role, action, module, target: String(target || ''), detail: detail || '' });
    if (logs.length > 500) logs.length = 500;
    writeAll('operation_logs', logs);
  } catch (e) { console.error(e); }
}

for (const table of TABLES) {
  if (table === 'operation_logs') {
    app.get(`/api/${table}`, requireAuth, (req, res) => {
      res.json(readAll(table).slice(0, parseInt(req.query.limit) || 100));
    });
    continue;
  }
  app.get(`/api/${table}`, requireAuth, (req, res) => res.json(readAll(table)));
  app.get(`/api/${table}/:id`, requireAuth, (req, res) => {
    const item = readAll(table).find(i => String(i.id) === String(req.params.id));
    if (!item) return res.status(404).json({ error: '不存在' });
    res.json(item);
  });
  app.post(`/api/${table}`, requireAuth, (req, res) => {
    const items = readAll(table);
    const newItem = { id: nextId(items), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body };
    items.unshift(newItem);
    writeAll(table, items);
    logOperation(req.user.username, req.user.role, 'create', table, newItem.id, '');
    res.json(newItem);
  });
  app.put(`/api/${table}/:id`, requireAuth, (req, res) => {
    const items = readAll(table);
    const idx = items.findIndex(i => String(i.id) === String(req.params.id));
    if (idx < 0) return res.status(404).json({ error: '不存在' });
    items[idx] = { ...items[idx], ...req.body, id: items[idx].id, updated_at: new Date().toISOString() };
    writeAll(table, items);
    logOperation(req.user.username, req.user.role, 'update', table, req.params.id, '');
    res.json({ ok: true });
  });
  app.delete(`/api/${table}/:id`, requireAuth, requireAdmin, (req, res) => {
    writeAll(table, readAll(table).filter(i => String(i.id) !== String(req.params.id)));
    logOperation(req.user.username, req.user.role, 'delete', table, req.params.id, '');
    res.json({ ok: true });
  });
}

app.post('/api/import/:table', requireAuth, (req, res) => {
  const table = req.params.table;
  if (!TABLES.includes(table) || table === 'operation_logs') return res.status(400).json({ error: '非法表名' });
  const incoming = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: '需要数组' });
  const existing = readAll(table);
  const items = [...incoming.map(item => ({ id: nextId(existing.concat(item)), ...item, created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() })), ...existing];
  writeAll(table, items);
  logOperation(req.user.username, req.user.role, 'import', table, '', '导入 ' + incoming.length + ' 条');
  res.json({ ok: true, count: incoming.length });
});

app.get('/api/stats/overview', requireAuth, (req, res) => {
  const result = {};
  for (const t of TABLES) {
    if (t === 'operation_logs') continue;
    result[t.replace('_policies', '').replace('ies', 'y').replace('_', '')] = readAll(t).length;
  }
  res.json(result);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: '账号或密码错误' });
  const token = generateToken();
  const session = { token, username: user.username, name: user.name, role: user.role };
  tokens.set(token, session);
  logOperation(user.username, user.role, 'login', 'auth', '', '');
  res.json(session);
});
app.post('/api/logout', requireAuth, (req, res) => { tokens.delete(req.user.token); res.json({ ok: true }); });
app.get('/api/me', requireAuth, (req, res) => res.json(req.user));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), users: USERS.length, tables: TABLES.length }));

app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 新能源物流城业务系统后端服务');
  console.log('📍 端口: ' + PORT);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
