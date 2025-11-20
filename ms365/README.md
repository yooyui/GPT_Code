# MS365 管理系统

> Microsoft 365 订阅和用户管理系统

## 技术栈

### 后端
- **运行时**: Node.js 18+
- **语言**: TypeScript
- **框架**: Express
- **FP库**: fp-ts + Ramda

### 前端
- **框架**: Solid.js
- **语言**: TypeScript
- **构建**: Vite
- **样式**: TailwindCSS
- **状态**: Solid Stores (FP风格)

## 核心功能

- ✅ **双模式运行** - 支持本地开发模式和生产模式（Microsoft Graph API）
- ✅ **订阅管理** - 查看 MS365 订阅详情和许可证使用情况
- ✅ **用户管理** - 增删改查用户（管理员保护）
- ✅ **订阅分配** - 为用户分配/回收许可
- ✅ **Azure AD 集成** - 完整的 Microsoft Graph API 集成

## 项目结构

```
ms365_v2/
├── backend/           # 后端服务
├── frontend/          # 前端应用
├── shared/            # 共享类型定义
```

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd frontend
npm install
```

### 2. 配置环境

系统支持两种运行模式：

#### 开发模式（默认）- 使用本地 SQLite 数据库
无需额外配置，后端已包含默认的 `.env` 文件：
- ✅ 快速启动，适合开发和测试
- ✅ 数据持久化到本地 SQLite 文件
- ✅ 无需 Azure AD 配置

#### 生产模式 - 连接真实的 Microsoft 365
如需连接真实的 MS365 租户，请参考：

📖 **[Azure 应用程序配置指南](./docs/AZURE_SETUP.md)**

配置步骤：
1. 在 Azure Portal 注册应用程序
2. 配置 Microsoft Graph API 权限
3. 创建客户端密钥
4. 更新 `backend/.env` 文件：
```env
APP_MODE=production
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### 3. 启动服务

```bash
# 启动后端 (端口 3000)
cd backend
npm run dev

# 启动前端 (端口 5173) - 新终端窗口
cd frontend
npm run dev
```

### 4. 访问应用

打开浏览器访问: http://localhost:5173

### 生产构建

```bash
# 后端
cd backend
npm run build
npm start

# 前端
cd frontend
npm run build
npm run preview
```

## 🔧 故障排查

### 问题：后端无法启动
**解决方案**:
1. 检查 Node.js 版本 >= 18
2. 删除 `node_modules` 并重新安装: `rm -rf node_modules && npm install`
3. 检查端口 3000 是否被占用

### 问题：前端显示 CORS 错误
**解决方案**:
1. 确保后端正在运行
2. 检查后端配置中的 CORS 设置
3. 确认前端运行在 `http://localhost:5173`

### 问题：生产模式下无法连接到 Graph API
**解决方案**:
1. 检查 `.env` 中的 Azure 配置是否正确
2. 确认已在 Azure Portal 中授予管理员同意
3. 检查网络连接和防火墙设置
4. 查看后端日志中的详细错误信息

### 问题：路由错误 "Routes not found"
**解决方案**:
- 确保使用了最新版本的 `@solidjs/router` (>= 0.15)
- 检查路由配置是否正确

## License

MIT
