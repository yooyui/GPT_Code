# MS365 管理系统启动脚本
# PowerShell 脚本用于一键启动前后端服务

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  MS365 管理系统 - 启动脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已安装依赖
$backendNodeModules = Test-Path ".\backend\node_modules"
$frontendNodeModules = Test-Path ".\frontend\node_modules"

if (-not $backendNodeModules) {
    Write-Host "[1/4] 安装后端依赖..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
} else {
    Write-Host "[1/4] 后端依赖已安装 ✓" -ForegroundColor Green
}

if (-not $frontendNodeModules) {
    Write-Host "[2/4] 安装前端依赖..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
} else {
    Write-Host "[2/4] 前端依赖已安装 ✓" -ForegroundColor Green
}

Write-Host "[3/4] 启动后端服务 (端口 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[4/4] 启动前端服务 (端口 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  服务启动成功!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "后端 API: http://localhost:3000" -ForegroundColor White
Write-Host "前端应用: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "提示: 关闭此窗口不会停止服务" -ForegroundColor Yellow
Write-Host "      请在各自的窗口中按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""
