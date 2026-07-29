// 新能源物流城业务系统 - 图表库
// 封装 ECharts 通用样式 + 数据计算

const CHART_COLORS = {
  primary: '#00BFA5',
  primaryLight: '#4DB6AC',
  secondary: '#1E88E5',
  secondaryLight: '#42A5F5',
  accent: '#FF6B35',
  accentLight: '#FFA726',
  warning: '#FFA726',
  error: '#E53935',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E5E7EB',
  bg: '#F5F7FA'
};

const CHART_PALETTE = [
  '#00BFA5', '#1E88E5', '#FF6B35', '#FFA726',
  '#42A5F5', '#66BB6A', '#AB47BC', '#EC407A'
];

function commonGrid() {
  return { left: 60, right: 30, top: 40, bottom: 50 };
}

function commonTooltip() {
  return {
    trigger: 'axis',
    backgroundColor: '#FFFFFF',
    borderColor: CHART_COLORS.border,
    borderWidth: 1,
    textStyle: { color: CHART_COLORS.text, fontSize: 12 },
    extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08); border-radius: 8px;'
  };
}

function commonLegend(text) {
  return {
    textStyle: { color: CHART_COLORS.textSecondary, fontSize: 12 },
    bottom: 0
  };
}

// 折线图
function lineChart(domId, option) {
  const dom = document.getElementById(domId);
  if (!dom) return null;
  const chart = echarts.init(dom);
  chart.setOption(Object.assign({
    color: [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent],
    grid: commonGrid(),
    tooltip: commonTooltip(),
    legend: option.legend || commonLegend(),
    xAxis: {
      type: 'category',
      data: option.xData,
      axisLine: { lineStyle: { color: CHART_COLORS.border } },
      axisLabel: { color: CHART_COLORS.textSecondary, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: CHART_COLORS.border, type: 'dashed' } },
      axisLabel: { color: CHART_COLORS.textSecondary, fontSize: 12, formatter: option.yFormatter || '{value}' }
    }
  }, option));
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

// 饼图
function pieChart(domId, option) {
  const dom = document.getElementById(domId);
  if (!dom) return null;
  const chart = echarts.init(dom);
  chart.setOption({
    color: CHART_PALETTE,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#FFFFFF',
      borderColor: CHART_COLORS.border,
      borderWidth: 1,
      textStyle: { color: CHART_COLORS.text, fontSize: 12 },
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: { bottom: 0, textStyle: { color: CHART_COLORS.textSecondary, fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
      labelLine: { show: true },
      data: option.data
    }]
  });
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

// 柱状图
function barChart(domId, option) {
  const dom = document.getElementById(domId);
  if (!dom) return null;
  const chart = echarts.init(dom);
  chart.setOption(Object.assign({
    color: CHART_COLORS.primary,
    grid: commonGrid(),
    tooltip: commonTooltip(),
    xAxis: {
      type: 'category',
      data: option.xData,
      axisLine: { lineStyle: { color: CHART_COLORS.border } },
      axisLabel: { color: CHART_COLORS.textSecondary, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: CHART_COLORS.border, type: 'dashed' } },
      axisLabel: { color: CHART_COLORS.textSecondary, fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: option.yData,
      itemStyle: { color: CHART_COLORS.primary, borderRadius: [4, 4, 0, 0] },
      barWidth: option.barWidth || '50%'
    }]
  }, option));
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

// 数据计算工具

// 按月聚合承保保费
function monthlyPremium() {
  const car = getList(STORAGE_KEYS.carPolicies);
  const other = getList(STORAGE_KEYS.otherPolicies);
  const ext = getList(STORAGE_KEYS.extendedPolicies);
  const all = [...car, ...other, ...ext];

  const months = {};
  all.forEach(p => {
    const date = p.签单日期 || p.出单日期 || p.保险起期;
    if (!date) return;
    const m = date.slice(0, 7);
    const premium = p.原始保费含税 || p.当前总保费含税 || p.保费含税 || 0;
    months[m] = (months[m] || 0) + premium;
  });
  return months;
}

// 按板块聚合应结佣金
function segmentCommission() {
  const comms = getList(STORAGE_KEYS.commissions);
  const segments = {};
  comms.forEach(c => {
    segments[c.板块] = (segments[c.板块] || 0) + (c.应结佣金 || 0);
  });
  return segments;
}

// 按保司聚合承保件数
function carrierCount() {
  const car = getList(STORAGE_KEYS.carPolicies);
  const other = getList(STORAGE_KEYS.otherPolicies);
  const ext = getList(STORAGE_KEYS.extendedPolicies);
  const all = [...car, ...other, ...ext];
  const counts = {};
  all.forEach(p => {
    const c = p.承保保司 || p.主承保公司 || '未知';
    counts[c] = (counts[c] || 0) + 1;
  });
  return counts;
}

window.CHART_COLORS = CHART_COLORS;
window.CHART_PALETTE = CHART_PALETTE;
window.lineChart = lineChart;
window.pieChart = pieChart;
window.barChart = barChart;
window.monthlyPremium = monthlyPremium;
window.segmentCommission = segmentCommission;
window.carrierCount = carrierCount;