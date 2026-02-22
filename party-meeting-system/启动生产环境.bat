@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 党组织生活会议管理系统 - Windows生产环境启动脚本
REM 作者: MiniMax Agent
REM 版本: v1.0
REM 日期: 2025-12-01

echo.
echo ===============================================
echo 🏭 党组织生活会议管理系统 - 生产环境启动
echo ===============================================
echo.

REM 设置项目变量
set PROJECT_NAME=党组织生活会议管理系统
set PREVIEW_PORT=4173
set PROJECT_DIR=%~dp0

echo 项目目录: %PROJECT_DIR%
echo 预览端口: %PREVIEW_PORT%
echo.

REM 检查是否在项目目录
if not exist "package.json" (
    echo [ERROR] 请在项目根目录运行此脚本
    echo 当前目录: %CD%
    pause
    exit /b 1
)

echo [INFO] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo [INFO] Node.js 版本: %NODE_VERSION%

echo.
echo [INFO] 检查包管理器...
where pnpm >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%a in ('pnpm --version') do set PM_VERSION=%%a
    set PACKAGE_MANAGER=pnpm
    echo [INFO] 使用 pnpm 版本: %PM_VERSION%
) else (
    set PACKAGE_MANAGER=npm
    echo [INFO] 使用 npm 包管理器
)

echo.
echo [INFO] 检查端口占用...
netstat -an | findstr ":%PREVIEW_PORT% " >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] 端口 %PREVIEW_PORT% 已被占用
    set /p kill_process="是否终止占用进程并继续? (y/N): "
    if /i "!kill_process!"=="y" (
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PREVIEW_PORT% "') do (
            taskkill /PID %%a /F >nul 2>&1
        )
        echo [INFO] 已终止占用进程
    ) else (
        echo [ERROR] 端口被占用，取消启动
        pause
        exit /b 1
    )
)

echo.
echo [INFO] 构建生产版本...
if "%PACKAGE_MANAGER%"=="pnpm" (
    pnpm run build:prod
) else (
    npm run build
)

if errorlevel 1 (
    echo [ERROR] 构建失败
    pause
    exit /b 1
)

echo.
echo [INFO] 构建完成，启动预览服务器...
echo.

REM 启动预览服务器
if "%PACKAGE_MANAGER%"=="pnpm" (
    start "预览服务器 - %PROJECT_NAME%" /wait cmd /c "pnpm run preview"
) else (
    start "预览服务器 - %PROJECT_NAME%" /wait cmd /c "npm run preview"
)

echo.
echo [INFO] 预览服务器已关闭
pause
