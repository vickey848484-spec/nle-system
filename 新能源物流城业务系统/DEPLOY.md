# Render 部署指南

> 给非程序员的版本 —— 按步骤操作就行，不需要写代码。

---

## 准备清单

- [ ] 一个邮箱（用来注册 GitHub 和 Render）
- [ ] 大约 20 分钟
- [ ] 桌面上的 `新能源物流城业务系统_部署包.zip`

---

## 第 1 步：注册 GitHub（5 分钟）

1. 打开 https://github.com
2. 右上角 **Sign up** → 用邮箱注册
3. 验证邮箱
4. 注册成功后，左上角点 **+** → **New repository**

填写：
- **Repository name**：`nle-system`（随便起名都行）
- **Public**（一定要选 Public，免费层 Render 只能连 Public 仓库）
- **不要勾** Add README / .gitignore
- 点 **Create repository**

---

## 第 2 步：上传代码（5 分钟）

回到刚创建的 GitHub 仓库页面，会看到 **uploading an existing file** 链接。

**最简单的方式 —— 不用 Git 命令：**

1. 在桌面**解压** `新能源物流城业务系统_部署包.zip`
2. GitHub 仓库页 → 点 **Add file** → **Upload files**
3. **把整个解压后的文件夹拖到网页上**（包括所有子目录）

> ⚠️ 如果浏览器不允许拖整个文件夹，先在 Finder 里**全选文件 + 拖到 GitHub 上**。一次拖不下的分批拖。

4. 等待上传（~25 个文件，可能要 1-2 分钟）
5. 底部 **Commit changes** → 直接点按钮

上传成功后，刷新页面应该能看到所有文件。

---

## 第 3 步：注册 Render（3 分钟）

1. 打开 https://render.com
2. 右上角 **Get Started for Free**
3. **用 GitHub 登录**（直接点 GitHub 图标）—— 这样会自动授权 Render 访问你的仓库

> ⚠️ Render 会要你**绑卡**验证身份（Visa/MasterCard），**不会扣费**，可以随时取消。

---

## 第 4 步：创建 Web Service（5 分钟）

1. Render 控制台 → 顶部 **New +** → **Web Service**
2. 选 **Build and deploy from a Git repository**
3. 在仓库列表里找到刚才创建的 `nle-system`，点 **Connect**
4. 填写配置：

| 字段 | 值 |
|---|---|
| Name | `nle-system` |
| Region | Singapore（亚洲节点，离中国近） |
| Branch | `main` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `cd ../ && npm install --omit=dev` |
| Start Command | `node server.js` |
| Plan | **Free** |

5. 滑到底 → 点 **Deploy Web Service**

---

## 第 5 步：等部署（5-10 分钟）

部署开始后：
1. 屏幕会显示实时日志（npm install 等）
2. 出现 `Your service is live 🎉` 表示成功
3. 顶部会有 URL，类似 `https://nle-system-xxx.onrender.com`

> ⚠️ **首次访问会等 30 秒**（冷启动）。第二次访问秒开。

---

## 第 6 步：验证

1. 点击 Render 给的 URL
2. 应该看到登录页
3. 输入 `admin` / `admin123`
4. 进系统

---

## 部署后管理

### 重启服务
Render 控制台 → 选服务 → 顶部 **Manual Deploy** → **Deploy latest commit**

### 查看数据
- 数据存 Render 的 `/data` 磁盘
- 想下载数据：在 Render 控制台 → Shell → `ls /data`
- 想备份：在 Shell 里 `cat /data/*.json`

### 看日志
Render 控制台 → 选服务 → **Logs** 标签

### 删除服务
Render 控制台 → 选服务 → **Settings** → 底部 **Delete Web Service**

---

## 常见问题

**Q：绑卡会不会扣费？**
A：不会。免费层就是 0 元，绑卡只验证身份。

**Q：Render 免费层有什么限制？**
A：512MB RAM + 0.1 CPU + 1GB 磁盘，够 10 个同事同时用。

**Q：数据存在哪里安全吗？**
A：存 Render 的 SSD 磁盘，自动备份。比我电脑硬盘安全多了。

**Q：能让 URL 短一点吗？**
A：可以。Render 控制台 → Settings → Custom Domain，加自己的域名（需买）。

---

## 出问题怎么办

截图报错信息发我，我帮你诊断。