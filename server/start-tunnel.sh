#!/bin/bash
# 新能源物流城业务系统 - 一键启动脚本
# 用途：电脑重启 / 后端进程挂了 / tunnel 断了后快速恢复
# 用法：bash start-tunnel.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$PROJECT_DIR/server"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 新能源物流城业务系统 - 一键启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 检查后端是否在跑
echo ""
echo "[1/3] 检查后端服务..."
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "   ✅ 后端已在 3000 端口运行"
else
  echo "   ⚠️  启动后端..."
  cd "$SERVER_DIR"
  nohup npm start > /tmp/nle-server.log 2>&1 &
  sleep 3
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "   ✅ 后端启动成功"
  else
    echo "   ❌ 后端启动失败，查看日志: tail -f /tmp/nle-server.log"
    exit 1
  fi
fi

# 2. 检查 tunnel
echo ""
echo "[2/3] 检查公网隧道..."
if pgrep -f "localtunnel.*3000" > /dev/null; then
  echo "   ✅ tunnel 已在跑"
else
  echo "   ⚠️  启动 tunnel..."
  cd /tmp
  nohup npx --yes localtunnel --port 3000 > /tmp/nle-tunnel.log 2>&1 &
  sleep 5
fi

# 3. 显示 URL
echo ""
echo "[3/3] 公网 URL:"
sleep 2
URL=$(grep -oE 'https://[^ ]+\.loca\.lt' /tmp/nle-tunnel.log | head -1)
if [ -z "$URL" ]; then
  echo "   ⚠️  等待 URL 生成，请查看 /tmp/nle-tunnel.log"
  tail -5 /tmp/nle-tunnel.log
else
  echo "   🌐 $URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 复制上面 URL 发给同事"
echo "📌 同事首次访问需输入 IP: 14.155.49.223"
echo "📌 停止服务: pkill -f 'localtunnel.*3000' ; lsof -ti:3000 | xargs kill"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"