// 新能源物流城业务系统 - 数据层
// 使用 localStorage 持久化存储
// 各模块通过 key namespace 隔离数据

const STORAGE_KEYS = {
  carPolicies: 'nle.carPolicies',           // 车险保单
  otherPolicies: 'nle.otherPolicies',       // 非车险保单（华强等）
  extendedPolicies: 'nle.extendedPolicies', // 延保
  agreements: 'nle.agreements',             // 协议
  consultations: 'nle.consultations',       // 咨询费
  commissions: 'nle.commissions',           // 佣金结算
  claims: 'nle.claims',                     // 理赔案件
  users: 'nle.users',                       // 用户
  vehicles: 'nle.vehicles',                 // 车辆基础数据
  insuranceCos: 'nle.insuranceCos',         // 保司基础数据
  plateDB: 'nle.plateDB'                    // 车牌号数据库
};

// ---- 通用 CRUD ----

function getList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('localStorage read error:', e);
    return [];
  }
}

function setList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('localStorage write error:', e);
    return false;
  }
}

function addItem(key, item) {
  const list = getList(key);
  // 用时间戳 + 随机数生成简易 ID
  item.id = item.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  item.createdAt = item.createdAt || new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  list.unshift(item);
  setList(key, list);
  return item;
}

function updateItem(key, id, patch) {
  const list = getList(key);
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    setList(key, list);
    return list[idx];
  }
  return null;
}

function deleteItem(key, id) {
  const list = getList(key);
  const filtered = list.filter(x => x.id !== id);
  setList(key, filtered);
  return true;
}

// ---- 计算工具 ----

// 含税转不含税（默认 6%）
function taxExcluded(amount) {
  return Number((amount / 1.06).toFixed(2));
}

// 含税转不含税（用于佣金）
function taxExcludedRound(amount) {
  return Math.round((amount / 1.06) * 100) / 100;
}

// 满期保费（保单不含税金额）
function maturedPremium(policy) {
  if (policy.终止保日期 && policy.起保日期) {
    const start = new Date(policy.起保日期);
    const end = new Date(policy.终止保日期);
    const now = new Date();
    const total = (end - start) / (1000 * 60 * 60 * 24);
    const passed = Math.max(0, Math.min(total, (now - start) / (1000 * 60 * 60 * 24)));
    if (total <= 0) return 0;
    return Number((taxExcluded(policy.原始保费含税) * passed / total).toFixed(2));
  }
  return taxExcluded(policy.原始保费含税);
}

// ---- 种子数据（首次打开时填充） ----

const SEED_DATA = {
  carPolicies: [
    { id: 'seed-001', 保单号: 'PC-2025-100002', 批单号: '', 车牌号: '粤BAY0592', 车架号: 'LR83STGT2NB011428',
      投保人: '广州地上铁新能源汽车服务有限公司', 被保险人: '广州地上铁新能源汽车服务有限公司',
      承保保司: '平安产险', 渠道: '经纪', 保单状态: '已承保', 总险种: '机动车辆保险', 具体险种: '商业险',
      签单日期: '2025-12-01', 起保日期: '2025-12-01', 终保日期: '2026-11-30',
      车系: '卡系、面系', 车族: '轻卡、小面', 车型: '轻卡', 车辆品牌: '瑞驰牌-EC35II', 车辆型号: 'EC35II',
      车主: '广州地上铁', 行驶证注册日期: '2024-05-20', 车龄: '1年', 使用性质: '营运',
      里程数: '28000', 运营商: '广州地上铁',
      原始保费含税: 1500, 车船税: 0, 出单系数: 1.0,
      当前总保费含税: 1500, NCD: 0.85, 折扣: 1.0, 座位数: 5,
      车损险保额: 50000, 车损险保费: 800,
      三责保额: 1000000, 三责保费: 1200,
      司机座位险保额: 10000, 司机座位险保费: 50,
      乘客座位险保额: 10000, 乘客座位险保费: 50,
      项目负责人: '林涛', 备注: '',
      createdAt: '2025-12-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' },
    { id: 'seed-002', 保单号: 'TB-2025-200156', 批单号: '', 车牌号: '粤BDX0234', 车架号: 'LGWEF4A53JJ789012',
      投保人: '深圳易维新能源汽车服务有限公司', 被保险人: '深圳易维新能源汽车服务有限公司',
      承保保司: '太保产险', 渠道: '非经纪', 保单状态: '已承保', 总险种: '机动车辆保险', 具体险种: '商业险',
      签单日期: '2026-01-15', 起保日期: '2026-01-15', 终保日期: '2027-01-14',
      车系: '轻卡', 车族: '轻卡', 车型: '4.5T', 车辆品牌: '江淮帅铃', 车辆型号: '帅铃',
      车主: '深圳易维', 行驶证注册日期: '2025-08-10', 车龄: '1年', 使用性质: '营运',
      里程数: '15000', 运营商: '深圳易维',
      原始保费含税: 2300, 车船税: 0, 出单系数: 1.0,
      当前总保费含税: 2300, NCD: 0.85, 折扣: 1.0, 座位数: 2,
      车损险保额: 80000, 车损险保费: 1200,
      三责保额: 2000000, 三责保费: 800,
      项目负责人: '林涛', 备注: '',
      createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
    { id: 'seed-003', 保单号: 'PC-2025-100088', 批单号: 'PC-2025-100088-03', 车牌号: '粤BDH4321', 车架号: 'LSGAA52H5JS12345',
      投保人: '深圳易维', 被保险人: '深圳易维',
      承保保司: '平安产险', 渠道: '经纪', 保单状态: '批减', 总险种: '机动车辆保险', 具体险种: '商业险',
      签单日期: '2025-09-05', 起保日期: '2025-09-05', 终保日期: '2026-09-04',
      车系: '面系', 车族: '小面', 车型: '小面', 车辆品牌: '瑞驰牌-EC35II', 车辆型号: 'EC35II',
      车主: '深圳易维', 行驶证注册日期: '2024-06-01', 车龄: '2年', 使用性质: '营运',
      里程数: '32000', 运营商: '深圳易维',
      原始保费含税: 1800, 车船税: 0, 出单系数: 1.0,
      当前总保费含税: 1650, NCD: 0.85, 折扣: 1.0, 座位数: 5,
      车损险保额: 50000, 车损险保费: 700,
      三责保额: 1000000, 三责保费: 950,
      项目负责人: '林涛', 备注: '批减 150 元',
      createdAt: '2025-09-05T00:00:00Z', updatedAt: '2025-12-10T00:00:00Z' }
  ],

  otherPolicies: [
    { id: 'seed-o01', 业务板块: '华强', 保单号: '10502003902838641881', 批单号: '',
      投保人: '华强方特（沈阳）文化科技有限公司', 被保险人: '华强方特（沈阳）文化科技有限公司',
      保单状态: '已承保', 地区: '方特', 总险种: '意外伤害保险', 具体险种: '团体意外险',
      项目负责人: '何静君', 出单日期: '2025-01-14', 保险起期: '2025-01-26', 保险止期: '2026-01-25',
      保额: '10+1万', 保费含税: 29520, 保费不含税: 27849.06, 保费状态: '已支付',
      是否共保: '否', 主承保公司: '平安产险深圳分公司', 主承比例: 1, 从共方保险公司: '',
      佣金比例: 0.25, 含税佣金: 6962, 不含税佣金: 6567.92, 结算佣金比例: 0.25,
      含税结算佣金: 6962, 不含税结算佣金: 6567.92, 结算日期: '2025-08-15',
      未结含税: 0, 未结不含税: 0, 是否新主体: '否',
      createdAt: '2025-01-14T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' }
  ],

  extendedPolicies: [
    { id: 'seed-e01', 项目: '旧延保', 保单号: 'PUAB20244403Y000115730', 批单号: '',
      车架号: 'LR83STGT2NB011428', 车牌号: '粤AAY0592',
      原厂保修开始日期: '2024-01-01', 原厂保修截止时间: '2025-12-31',
      车辆年份: '2024', 行驶里程: '25000', 车辆用途: '营运',
      新车市场销售价: 120000, 车辆品牌: '瑞驰牌-EC35II', 车辆族群: '面系', 车辆车型: '小面',
      大区: '华南大区', 运营城市: '广州市', 归属运营公司: '广州地上铁',
      承保公司分级: '深圳人保龙华支', 总险种: '责任保险', 具体险种: '延长保修责任保险',
      出单日期: '2024-12-11', 保险起期: '2024-12-01', 保险止期: '2025-11-30',
      保额: 50000, 保费含税: 1500, 保费不含税: 1415.09, 满期保费不含税: 587.03,
      是否联保: '否', 佣金比例: 0.39, 含税佣金: 551.89, 不含税佣金: 520.65,
      结算佣金比例: 0.39, 含税结算佣金: 551.89, 不含税结算佣金: 520.65,
      结算日期: '2026-01-03', 未结含税: 0, 未结不含税: 0,
      createdAt: '2024-12-11T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' }
  ],

  agreements: [
    { id: 'seed-a01', 协议编号: 'PC-JSXY-2026-001', 协议名称: 'PICC 财产保险 2026 年结算协议',
      协议类型: '结算协议', 保司系: '人保系', 保司: 'PICC 财产保险股份有限公司深圳分公司',
      协议甲方: '新能源物流城保险经纪（深圳）有限公司', 协议乙方: 'PICC 财产保险股份有限公司深圳分公司',
      业务板块: '车险+非车险', 渠道: '经纪业务',
      签订日期: '2025-12-20', 生效日期: '2026-01-01', 到期日期: '2026-12-31',
      归档日期: '2026-01-05', 协议状态: '即将到期',
      结算周期: '月结（次月 15 日前）', 佣金比例: '25%',
      开票要求: '增值税专用发票',
      录入人: '李运营', 复核人: '王主管',
      createdAt: '2025-12-20T00:00:00Z', updatedAt: '2026-01-05T00:00:00Z' },
    { id: 'seed-a02', 协议编号: 'PC-JSXY-2025-088', 协议名称: '平安产险 2025 年经纪业务结算协议',
      协议类型: '结算协议', 保司系: '平安系', 保司: '平安产险深圳分公司福田支公司',
      协议甲方: '新能源物流城保险经纪（深圳）有限公司', 协议乙方: '平安产险深圳分公司福田支公司',
      业务板块: '车险', 渠道: '经纪业务',
      签订日期: '2025-03-01', 生效日期: '2025-03-15', 到期日期: '2027-03-15',
      归档日期: '2025-03-20', 协议状态: '生效中',
      结算周期: '月结（次月 20 日前）', 佣金比例: '25%',
      开票要求: '增值税专用发票',
      录入人: '李运营', 复核人: '王主管',
      createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-03-20T00:00:00Z' }
  ],

  consultations: [
    { id: 'seed-c01', 序号: 1, 项目名称: '地上铁保险咨询服务费', 险种类型: '财产保险',
      咨询费含税: 2000000, 咨询费不含税: 1886792.45, 入账时间: '2024-01-31', 渠道: '经纪业务',
      createdAt: '2024-01-31T00:00:00Z', updatedAt: '2024-01-31T00:00:00Z' }
  ],

  commissions: [
    { id: 'seed-cm01', 保单号: '10502003902838641881', 批单号: '', 投保人: '华强方特（沈阳）',
      承保保司: '平安产险', 板块: '其他', 不含税保费: 27849.06, 佣金比例: 0.25,
      应结佣金: 6962.27, 实结佣金: 6962.27, 结算单号: 'JS-2025-0088',
      结算状态: '已入账',
      createdAt: '2025-08-15T00:00:00Z', updatedAt: '2025-08-15T00:00:00Z' },
    { id: 'seed-cm02', 保单号: 'PC-2025-100002', 批单号: '', 投保人: '广州地上铁',
      承保保司: '平安产险', 板块: '车险', 不含税保费: 1415.09, 佣金比例: 0.25,
      应结佣金: 353.77, 实结佣金: 0, 结算单号: '',
      结算状态: '待开票',
      createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' }
  ],

  claims: [
    {
      id: 'seed-cl01',
      赔案号: 'PA2026-0001',
      保单号: 'PC-2025-100002',
      车牌号: '粤BAY0592',
      承保保司: '平安产险',
      报案人: '广州地上铁',
      报案日期: '2026-05-12',
      立案日期: '2026-05-13',
      结案日期: '',
      出险日期: '2026-05-11',
      出险地点: '广州市天河区',
      损失类型: '车损',
      报案金额: 35000,
      已决金额: 0,
      未决金额: 35000,
      是否人伤: '否',
      是否异地: '否',
      是否大案: true,
      案件状态: '复审',
      受理人: '李运营',
      备注: '右后侧剐蹭，与电动车相撞',
      审核记录: [
        { 时间: '2026-05-12 14:30', 操作人: '李运营', 内容: '报案登记' },
        { 时间: '2026-05-13 09:15', 操作人: '王主管', 内容: '立案审核通过' },
        { 时间: '2026-05-15 16:00', 操作人: '李运营', 内容: '初审通过，定损报告上传' }
      ],
      createdAt: '2026-05-12T00:00:00Z',
      updatedAt: '2026-05-15T16:00:00Z'
    },
    {
      id: 'seed-cl02',
      赔案号: 'PA2026-0002',
      保单号: 'TB-2025-200156',
      车牌号: '粤BDX0234',
      承保保司: '太保产险',
      报案人: '深圳易维',
      报案日期: '2026-06-08',
      立案日期: '2026-06-08',
      结案日期: '2026-06-22',
      出险日期: '2026-06-07',
      出险地点: '深圳市南山区',
      损失类型: '三责',
      报案金额: 8500,
      已决金额: 7800,
      未决金额: 0,
      是否人伤: '否',
      是否异地: '否',
      是否大案: false,
      案件状态: '结案',
      受理人: '陈运营',
      备注: '追尾，已结案',
      审核记录: [
        { 时间: '2026-06-08 10:00', 操作人: '陈运营', 内容: '报案登记' },
        { 时间: '2026-06-08 14:30', 操作人: '王主管', 内容: '立案' },
        { 时间: '2026-06-15 09:00', 操作人: '陈运营', 内容: '初审通过' },
        { 时间: '2026-06-18 11:00', 操作人: '王主管', 内容: '复审通过' },
        { 时间: '2026-06-22 16:00', 操作人: '陈运营', 内容: '结案，已决 ¥7,800' }
      ],
      createdAt: '2026-06-08T00:00:00Z',
      updatedAt: '2026-06-22T16:00:00Z'
    },
    {
      id: 'seed-cl03',
      赔案号: 'PA2026-0003',
      保单号: 'PC-2025-100017',
      车牌号: '粤BZ0118',
      承保保司: '平安产险',
      报案人: '广州地上铁',
      报案日期: '2026-07-05',
      立案日期: '2026-07-06',
      结案日期: '',
      出险日期: '2026-07-04',
      出险地点: '东莞市虎门镇',
      损失类型: '人伤',
      报案金额: 52000,
      已决金额: 0,
      未决金额: 52000,
      是否人伤: '是',
      是否异地: '是',
      是否大案: true,
      案件状态: '初审',
      受理人: '李运营',
      备注: '异地出险，行人骨折，待治疗结束',
      审核记录: [
        { 时间: '2026-07-05 08:30', 操作人: '李运营', 内容: '报案登记' },
        { 时间: '2026-07-06 10:00', 操作人: '王主管', 内容: '立案' },
        { 时间: '2026-07-10 14:00', 操作人: '李运营', 内容: '初审中，等待伤残鉴定' }
      ],
      createdAt: '2026-07-05T00:00:00Z',
      updatedAt: '2026-07-10T14:00:00Z'
    },
    {
      id: 'seed-cl04',
      赔案号: 'PA2026-0004',
      保单号: 'DB-2024-300489',
      车牌号: '粤BY4551',
      承保保司: '大家财险',
      报案人: '东莞鸿源物流',
      报案日期: '2026-07-18',
      立案日期: '',
      结案日期: '',
      出险日期: '2026-07-17',
      出险地点: '佛山市顺德区',
      损失类型: '车损',
      报案金额: 12000,
      已决金额: 0,
      未决金额: 12000,
      是否人伤: '否',
      是否异地: '是',
      是否大案: false,
      案件状态: '报案',
      受理人: '陈运营',
      备注: '单方事故，撞击护栏',
      审核记录: [
        { 时间: '2026-07-18 09:15', 操作人: '陈运营', 内容: '报案登记' }
      ],
      createdAt: '2026-07-18T00:00:00Z',
      updatedAt: '2026-07-18T09:15:00Z'
    }
  ],

  vehicles: [],
  insuranceCos: [
    { id: 'ic1', 保司编码: 'PC', 保司全称: '平安产险深圳分公司', 保司系: '平安系', 渠道: '经纪业务' },
    { id: 'ic2', 保司编码: 'TB', 保司全称: '太保产险深圳分公司', 保司系: '太保系', 渠道: '经纪业务' },
    { id: 'ic3', 保司编码: 'DJ', 保司全称: '大家财产保险股份有限公司深圳分公司', 保司系: '大家系', 渠道: '经纪业务' },
    { id: 'ic4', 保司编码: 'RB', 保司全称: '人保财险广州分公司', 保司系: '人保系', 渠道: '经纪业务' },
    { id: 'ic5', 保司编码: 'ZL', 保司全称: '中华联合财险', 保司系: '中华系', 渠道: '经纪业务' }
  ],
  users: [
    { id: 'u1', username: 'admin', password: 'admin123', name: 'Vickey', role: 'admin', 负责范围: { 保司: [], 项目: [], 区域: [] }, 状态: '启用', 最后登录: '2026-07-29 11:00:00', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'u2', username: 'operator', password: 'op123', name: '运营专员', role: 'operator', 负责范围: { 保司: ['平安产险', '太保产险'], 项目: [], 区域: ['华南大区'] }, 状态: '启用', 最后登录: '2026-07-29 10:30:00', createdAt: '2025-03-01T00:00:00Z' },
    { id: 'u3', username: 'finance', password: 'fin123', name: '财务专员', role: 'finance', 负责范围: { 保司: [], 项目: [], 区域: [] }, 状态: '启用', 最后登录: '2026-07-29 09:45:00', createdAt: '2025-03-15T00:00:00Z' },
    { id: 'u4', username: 'hejingjun', password: 'hj123', name: '何静君', role: 'operator', 负责范围: { 保司: ['平安产险'], 项目: ['华强'], 区域: ['方特', '徐州'] }, 状态: '启用', 最后登录: '', createdAt: '2025-06-01T00:00:00Z' },
    { id: 'u5', username: 'lin涛', password: 'lt123', name: '林涛', role: 'operator', 负责范围: { 保司: ['平安产险', '太保产险', '大家财险'], 项目: ['地上铁'], 区域: ['华南大区'] }, 状态: '启用', 最后登录: '', createdAt: '2025-08-01T00:00:00Z' }
  ],
  plateDB: []
};

// ---- 初始化（仅首次打开时填充） ----

function seedIfEmpty() {
  Object.keys(SEED_DATA).forEach(k => {
    const storageKey = STORAGE_KEYS[k];
    if (!localStorage.getItem(storageKey)) {
      setList(storageKey, SEED_DATA[k]);
    }
  });
}

// ---- 格式化工具 ----

function formatMoney(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return n;
  return '¥ ' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatMoneyNoSymbol(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return n;
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n) {
  if (n === null || n === undefined || n === '') return '—';
  return (Number(n) * 100).toFixed(2) + '%';
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch (e) {
    return d;
  }
}

// ---- 鉴权工具 ----

const SESSION_KEY = 'nle.session';

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth() {
  const s = getSession();
  if (!s) {
    // 计算相对路径：pages/ 子目录下用 ../login.html，根目录用 login.html
    const path = window.location.pathname;
    const loginPath = path.includes('/pages/') ? '../login.html' : 'login.html';
    window.location.href = loginPath;
    return null;
  }
  // 自动渲染用户条（如果页面有 #userBar）
  const bar = document.getElementById('userBar');
  if (bar) {
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = s.name;
    if (roleEl) {
      const roleMap = { admin: '管理员', operator: '运营专员', finance: '财务专员' };
      roleEl.textContent = roleMap[s.role] || s.role;
    }
    if (avatarEl) avatarEl.textContent = s.name.slice(0, 1).toUpperCase();
  }
  return s;
}

function logout() {
  clearSession();
  const path = window.location.pathname;
  const loginPath = path.includes('/pages/') ? '../login.html' : 'login.html';
  window.location.href = loginPath;
}

// ---- 权限矩阵 ----

const PERMISSIONS = {
  admin: {
    label: '管理员',
    canViewAll: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canImport: true,
    canExport: true,
    canManageUsers: true,
    canViewFinance: true,
    canEditCommission: true,
    canViewLogs: true,
    modules: '*' // 所有模块
  },
  operator: {
    label: '运营专员',
    canViewAll: false,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canImport: true,
    canExport: true,
    canManageUsers: false,
    canViewFinance: false,
    canEditCommission: false,
    canViewLogs: false,
    modules: ['carPolicies', 'otherPolicies', 'extendedPolicies', 'agreements', 'claims', 'consultations', 'vehicles']
  },
  finance: {
    label: '财务专员',
    canViewAll: true,
    canCreate: true,
    canUpdate: true,
    canDelete: false,
    canImport: true,
    canExport: true,
    canManageUsers: false,
    canViewFinance: true,
    canEditCommission: true,
    canViewLogs: true,
    modules: ['commissions', 'agreements', 'consultations']
  }
};

function getPermissions(role) {
  return PERMISSIONS[role] || PERMISSIONS.operator;
}

function can(action, role) {
  const perms = getPermissions(role);
  return !!perms['can' + action.charAt(0).toUpperCase() + action.slice(1)];
}

function canAccessModule(role, moduleKey) {
  const perms = getPermissions(role);
  if (perms.modules === '*') return true;
  return perms.modules.includes(moduleKey);
}

// 数据范围过滤
function filterByScope(items, session, scopeField) {
  if (!session) return items;
  const perms = getPermissions(session.role);
  if (perms.canViewAll) return items;
  const scope = session.负责范围 || {};
  if (scopeField && scope[scopeField] && scope[scopeField].length > 0) {
    return items.filter(item => {
      const val = item[scopeField];
      return val && scope[scopeField].includes(val);
    });
  }
  return items;
}

// ---- 操作日志 ----

function logOperation(action, module, target, before, after) {
  try {
    const raw = localStorage.getItem('nle.operationLog') || '[]';
    const log = JSON.parse(raw);
    const session = getSession();
    log.unshift({
      id: Date.now().toString(36),
      time: new Date().toISOString(),
      user: session ? session.username : 'anonymous',
      role: session ? session.role : 'unknown',
      action, module, target,
      before: before || null,
      after: after || null
    });
    // 保留最近 500 条
    if (log.length > 500) log.length = 500;
    localStorage.setItem('nle.operationLog', JSON.stringify(log));
  } catch (e) {
    console.error('Log error:', e);
  }
}

// ---- API 模式（后端可用时切换） ----

// API 地址：根据当前访问协议自动切换
// - file:// 模式：用 localhost（开发用）
// - http/https 模式（隧道、部署）：用相对路径，跟随当前域名
const API_BASE = (window.location.protocol === 'file:')
  ? 'http://localhost:3000/api'
  : '/api';
const STORAGE_TO_API = {
  [STORAGE_KEYS.carPolicies]: 'car_policies',
  [STORAGE_KEYS.otherPolicies]: 'other_policies',
  [STORAGE_KEYS.extendedPolicies]: 'extended_policies',
  [STORAGE_KEYS.agreements]: 'agreements',
  [STORAGE_KEYS.consultations]: 'consultations',
  [STORAGE_KEYS.commissions]: 'commissions'
};

let apiMode = false; // 是否启用 API 模式
let apiCheckPromise = null;

async function checkApiMode() {
  if (apiCheckPromise) return apiCheckPromise;
  apiCheckPromise = (async () => {
    try {
      const res = await fetch(API_BASE + '/health', { method: 'GET' });
      if (res.ok) {
        const j = await res.json();
        if (j.status === 'ok') {
          apiMode = true;
          console.log('🌐 后端 API 可用，已切换到 API 模式');
          return true;
        }
      }
    } catch (e) {
      console.log('📦 后端不可用，使用 localStorage 模式');
    }
    apiMode = false;
    return false;
  })();
  return apiCheckPromise;
}

function getApiTable(storageKey) {
  return STORAGE_TO_API[storageKey];
}

async function apiFetch(path, options) {
  const token = getSession()?.token || '';
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || 'HTTP ' + res.status);
  }
  return res.json();
}

// API 版本的 CRUD（异步）
async function apiGetList(storageKey) {
  const table = getApiTable(storageKey);
  if (!table) return getList(storageKey);
  return apiFetch('/' + table);
}

async function apiAddItem(storageKey, item) {
  const table = getApiTable(storageKey);
  if (!table) {
    addItem(storageKey, item);
    return item;
  }
  return apiFetch('/' + table, { method: 'POST', body: JSON.stringify(item) });
}

async function apiUpdateItem(storageKey, id, patch) {
  const table = getApiTable(storageKey);
  if (!table) {
    updateItem(storageKey, id, patch);
    return;
  }
  return apiFetch('/' + table + '/' + id, { method: 'PUT', body: JSON.stringify(patch) });
}

async function apiDeleteItem(storageKey, id) {
  const table = getApiTable(storageKey);
  if (!table) {
    deleteItem(storageKey, id);
    return;
  }
  return apiFetch('/' + table + '/' + id, { method: 'DELETE' });
}

// ---- 适配层：根据模式自动选择 ----

async function getData(storageKey) {
  await checkApiMode();
  if (apiMode) {
    try {
      return await apiGetList(storageKey);
    } catch (e) {
      console.warn('API 调用失败，降级到 localStorage:', e);
      return getList(storageKey);
    }
  }
  return getList(storageKey);
}

async function createData(storageKey, item) {
  await checkApiMode();
  if (apiMode) {
    try {
      return await apiAddItem(storageKey, item);
    } catch (e) {
      console.warn('API POST 失败，降级:', e);
      addItem(storageKey, item);
      return item;
    }
  }
  return addItem(storageKey, item);
}

async function updateData(storageKey, id, patch) {
  await checkApiMode();
  if (apiMode) {
    try {
      return await apiUpdateItem(storageKey, id, patch);
    } catch (e) {
      console.warn('API PUT 失败，降级:', e);
      updateItem(storageKey, id, patch);
    }
  } else {
    updateItem(storageKey, id, patch);
  }
}

async function deleteData(storageKey, id) {
  await checkApiMode();
  if (apiMode) {
    try {
      return await apiDeleteItem(storageKey, id);
    } catch (e) {
      console.warn('API DELETE 失败，降级:', e);
      deleteItem(storageKey, id);
    }
  } else {
    deleteItem(storageKey, id);
  }
}

// 登录（API 版本）
async function apiLogin(username, password) {
  try {
    const res = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    return res;
  } catch (e) {
    return null;
  }
}

// ---- OCR 适配层 ----

const OCR_CONFIG_KEY = 'nle.ocrConfig';

function getOcrConfig() {
  try {
    return JSON.parse(localStorage.getItem(OCR_CONFIG_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function setOcrConfig(config) {
  localStorage.setItem(OCR_CONFIG_KEY, JSON.stringify(config));
}

// OCR 提供商：
// - 'mock'    ：演示模式（返回模拟数据，无需 API key）
// - 'tencent' ：腾讯云 OCR（需要 secretId + secretKey）
// - 'aliyun'  ：阿里云 OCR（需要 accessKeyId + accessKeySecret）
async function ocrRecognize(file, provider) {
  const config = getOcrConfig();
  provider = provider || config.provider || 'mock';

  if (provider === 'mock') {
    return mockOcrResult(file);
  }

  if (provider === 'tencent') {
    return realOcrTencent(file, config);
  }

  if (provider === 'aliyun') {
    return realOcrAliyun(file, config);
  }

  throw new Error('未知 OCR 提供商: ' + provider);
}

function mockOcrResult(file) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isPolicy = file.name.includes('保单') || file.name.includes('policy') || Math.random() > 0.5;
      if (isPolicy) {
        resolve({
          success: true,
          provider: 'mock',
          fields: {
            保单号: 'PC-2026-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
            被保险人: '深圳市易维新能源汽车服务有限公司',
            车牌号: '粤BD' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
            车架号: 'LR83STGT2NB' + String(Math.floor(Math.random() * 999999)).padStart(6, '0'),
            保险起期: '2026-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01',
            保险止期: '2027-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01',
            '保费（含税）': '¥ ' + (Math.random() * 5000 + 1500).toFixed(2),
            险种: '商业险'
          }
        });
      } else {
        resolve({
          success: true,
          provider: 'mock',
          fields: {
            结算单号: 'JS-2026-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
            保单号: 'PC-2025-100002',
            批单号: '',
            结算期间: '2026-06-01 ~ 2026-06-30',
            结算金额: '¥ ' + (Math.random() * 5000 + 1000).toFixed(2),
            佣金比例: '25%',
            结算佣金: '¥ ' + (Math.random() * 1000 + 200).toFixed(2),
            保司: '平安产险'
          }
        });
      }
    }, 1500 + Math.random() * 1000);
  });
}

// 真实 OCR 接入 - 腾讯云
async function realOcrTencent(file, config) {
  if (!config.secretId || !config.secretKey) {
    throw new Error('请先在"基础数据 → OCR 配置"中填写腾讯云 API 凭证');
  }
  // 真实环境：调用后端 API 处理（密钥不能暴露在浏览器）
  // 前端通过 fetch 调用后端的 /api/ocr/tencent 端点
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(API_BASE + '/ocr/tencent', {
    method: 'POST',
    body: fd,
    headers: { 'Authorization': 'Bearer ' + (getSession()?.token || '') }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OCR 调用失败' }));
    throw new Error(err.error);
  }
  return res.json();
}

async function realOcrAliyun(file, config) {
  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error('请先在"基础数据 → OCR 配置"中填写阿里云 API 凭证');
  }
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(API_BASE + '/ocr/aliyun', {
    method: 'POST',
    body: fd,
    headers: { 'Authorization': 'Bearer ' + (getSession()?.token || '') }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'OCR 调用失败' }));
    throw new Error(err.error);
  }
  return res.json();
}

// 自动绑定到 window
window.STORAGE_KEYS = STORAGE_KEYS;
window.getList = getList;
window.setList = setList;
window.addItem = addItem;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.taxExcluded = taxExcluded;
window.taxExcludedRound = taxExcludedRound;
window.maturedPremium = maturedPremium;
window.seedIfEmpty = seedIfEmpty;
window.formatMoney = formatMoney;
window.formatMoneyNoSymbol = formatMoneyNoSymbol;
window.formatPercent = formatPercent;
window.formatDate = formatDate;
window.SESSION_KEY = SESSION_KEY;
window.getSession = getSession;
window.setSession = setSession;
window.clearSession = clearSession;
window.requireAuth = requireAuth;
window.logout = logout;
window.logOperation = logOperation;
window.ocrRecognize = ocrRecognize;
window.getOcrConfig = getOcrConfig;
window.setOcrConfig = setOcrConfig;
window.PERMISSIONS = PERMISSIONS;
window.getPermissions = getPermissions;
window.can = can;
window.canAccessModule = canAccessModule;
window.filterByScope = filterByScope;
window.apiMode = () => apiMode;
window.checkApiMode = checkApiMode;
window.getData = getData;
window.createData = createData;
window.updateData = updateData;
window.deleteData = deleteData;
window.apiLogin = apiLogin;
window.API_BASE = API_BASE;