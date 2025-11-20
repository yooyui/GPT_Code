# Azure 应用程序配置指南

本指南将帮助你在 Azure Active Directory 中注册应用程序，以便 MS365 管理系统能够访问 Microsoft Graph API。

## 目录

1. [前置要求](#前置要求)
2. [Azure 应用程序注册](#azure-应用程序注册)
3. [配置应用程序权限](#配置应用程序权限)
4. [创建客户端密钥](#创建客户端密钥)
5. [配置应用程序](#配置应用程序)
6. [验证配置](#验证配置)

---

## 前置要求

- Microsoft 365 租户管理员账号
- Azure Active Directory 访问权限
- Node.js 18+ 已安装

---

## Azure 应用程序注册

### 步骤 1: 登录 Azure Portal

1. 访问 [Azure Portal](https://portal.azure.com)
2. 使用你的 Microsoft 365 管理员账号登录

### 步骤 2: 注册新应用程序

1. 在 Azure Portal 搜索栏中输入 **"Azure Active Directory"**
2. 在左侧菜单中选择 **"应用注册"**
3. 点击 **"+ 新注册"**

### 步骤 3: 填写应用程序详细信息

```
名称: MS365 Admin System
支持的账户类型: 仅此组织目录中的账户（单租户）
重定向 URI:
  - 类型: Web
  - URI: http://localhost:3000/auth/callback
```

4. 点击 **"注册"**

### 步骤 4: 记录关键信息

注册完成后，记录以下信息（稍后需要配置到环境变量）：

- **应用程序（客户端）ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **目录（租户）ID**: `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`

---

## 配置应用程序权限

### 步骤 1: 配置 API 权限

1. 在应用程序页面，选择左侧菜单的 **"API 权限"**
2. 点击 **"+ 添加权限"**
3. 选择 **"Microsoft Graph"**
4. 选择 **"应用程序权限"**（用于后台服务访问）

### 步骤 2: 添加所需权限

添加以下权限（根据实际需求选择）：

#### 用户管理权限
- `User.Read.All` - 读取所有用户的完整配置文件
- `User.ReadWrite.All` - 读取和写入所有用户的完整配置文件

#### 许可证管理权限
- `Organization.Read.All` - 读取组织和相关资源
- `Directory.Read.All` - 读取目录数据

### 步骤 3: 授予管理员同意

**重要**: 应用程序权限需要租户管理员授予同意

1. 在 "API 权限" 页面
2. 点击 **"为 [你的租户名] 授予管理员同意"**
3. 确认授权

授权成功后，所有权限的 "状态" 列应显示绿色的勾选标记。

---

## 创建客户端密钥

### 步骤 1: 创建新密钥

1. 在应用程序页面，选择左侧菜单的 **"证书和密码"**
2. 点击 **"+ 新客户端密码"**
3. 填写描述：`MS365 Admin Backend Secret`
4. 选择过期时间：`24个月` （建议）
5. 点击 **"添加"**

### 步骤 2: 保存密钥值

**重要**: 密钥值只会显示一次！

- **客户端密钥值**: `复制并安全保存此值`

---

## 配置应用程序

### 步骤 1: 创建环境变量文件

在项目根目录下创建 `.env` 文件：

```bash
cd C:/code/ms365_v2/backend
```

创建 `.env` 文件，内容如下：

```env
# 服务器配置
PORT=3000
HOST=localhost

# 数据库配置
DB_PATH=./data/db.sqlite
BACKUP_ENABLED=true
BACKUP_PATH=./data/backups
BACKUP_INTERVAL=3600000

# Azure AD 配置
AZURE_TENANT_ID=你的租户ID
AZURE_CLIENT_ID=你的客户端ID
AZURE_CLIENT_SECRET=你的客户端密钥

# Microsoft Graph API
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# 应用模式
# development - 使用本地 SQLite 数据库（测试用）
# production - 使用 Microsoft Graph API（生产环境）
APP_MODE=development
```

### 步骤 2: 更新 .gitignore

确保 `.env` 文件不会被提交到版本控制：

```bash
echo ".env" >> .gitignore
```

### 步骤 3: 创建环境变量模板

为了方便团队成员配置，创建 `.env.example`:

```env
# 服务器配置
PORT=3000
HOST=localhost

# 数据库配置
DB_PATH=./data/db.sqlite
BACKUP_ENABLED=true
BACKUP_PATH=./data/backups
BACKUP_INTERVAL=3600000

# Azure AD 配置（从 Azure Portal 获取）
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
AZURE_CLIENT_SECRET=your-client-secret-here

# Microsoft Graph API
GRAPH_API_ENDPOINT=https://graph.microsoft.com/v1.0
GRAPH_API_SCOPE=https://graph.microsoft.com/.default

# 应用模式
APP_MODE=development
```

---

## 验证配置

### 步骤 1: 测试 Graph API 连接

使用以下 PowerShell 脚本测试连接（可选）：

```powershell
# 获取访问令牌
$tenantId = "你的租户ID"
$clientId = "你的客户端ID"
$clientSecret = "你的客户端密钥"

$body = @{
    grant_type    = "client_credentials"
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "https://graph.microsoft.com/.default"
}

$tokenResponse = Invoke-RestMethod `
    -Method Post `
    -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" `
    -Body $body

$accessToken = $tokenResponse.access_token
Write-Host "Access Token acquired successfully!"

# 测试 API 调用
$headers = @{
    Authorization = "Bearer $accessToken"
}

$users = Invoke-RestMethod `
    -Method Get `
    -Uri "https://graph.microsoft.com/v1.0/users" `
    -Headers $headers

Write-Host "Found $($users.value.Count) users"
$users.value | Select-Object displayName, userPrincipalName | Format-Table
```

### 步骤 2: 启动应用程序

```bash
cd C:/code/ms365_v2/backend
npm run dev
```

查看日志，确认没有 Azure 相关的错误。

---

## 常见问题

### Q1: "Insufficient privileges" 错误

**原因**: 应用程序权限未被管理员授予同意

**解决方案**:
1. 在 Azure Portal 中检查 "API 权限" 页面
2. 确保所有权限都有绿色勾选标记
3. 如果没有，点击 "授予管理员同意"

### Q2: "Invalid client secret" 错误

**原因**: 客户端密钥错误或已过期

**解决方案**:
1. 在 Azure Portal 的 "证书和密码" 中检查密钥状态
2. 如果已过期，创建新密钥并更新 `.env` 文件

### Q3: 无法读取用户列表

**原因**: 权限不足或未授予同意

**解决方案**:
1. 确保添加了 `User.Read.All` 或 `User.ReadWrite.All` 权限
2. 确保已授予管理员同意
3. 重启应用程序以刷新令牌

---

## 参考资源

- [Microsoft Graph API 文档](https://docs.microsoft.com/en-us/graph/)
- [Azure AD 应用注册指南](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Graph API 权限参考](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [客户端凭据流](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)
