@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 党组织生活会议管理系统 - Windows一键启动脚本
REM 作者: MiniMax Agent
REM 版本: v1.0
REM 日期: 2025-12-01

echo.
echo ===============================================
echo 🎯 党组织生活会议管理系统 - 一键启动
echo ===============================================
echo.
echo 请选择启动模式：
echo.
echo [1] 🚀 开发环境启动 (推荐)
echo     - 热重载功能
echo     - 快速启动
echo     - 端口: 5173
echo     - 适合开发测试
echo.
echo [2] 🏭 生产环境启动
echo     - 生产构建
echo     - 性能优化
echo     - 端口: 4173
echo     - 适合演示展示
echo.
echo [3] 🛑 停止所有服务
echo.
echo [4] 📖 查看使用说明
echo.
echo [0] 🚪 退出
echo.
echo ===============================================

:menu_choice
set /p choice="请输入选择 (0-4): "

if "%choice%"=="1" goto dev_start
if "%choice%"=="2" goto prod_start
if "%choice%"=="3" goto stop_services
if "%choice%"=="4" goto show_help
if "%choice%"=="0" goto exit
echo [ERROR] 无效选择，请重新输入
goto menu_choice

:dev_start
echo.
echo 🚀 启动开发环境...
call "启动开发环境.bat"
goto menu_choice

:prod_start
echo.
echo 🏭 启动生产环境...
call "启动生产环境.bat"
goto menu_choice

:stop_services
echo.
echo 🛑 停止所有服务...
call "停止所有服务.bat"
goto menu_choice

:show_help
echo.
echo ===============================================
echo 📖 使用说明
echo ===============================================
echo.
echo 【开发环境启动】
echo   - 双击 "启动开发环境.bat"
echo   - 或在菜单选择 [1]
echo   - 访问地址: http://localhost:5173
echo   - 特点: 热重载、调试友好
echo.
echo 【生产环境启动】
echo   - 双击 "启动生产环境.bat"  
echo   - 或在菜单选择 [2]
echo   - 访问地址: http://localhost:4173
echo   - 特点: 性能优化、生产构建
echo.
echo 【停止服务】
echo   - 双击 "停止所有服务.bat"
echo   - 或在菜单选择 [3]
echo   - 或关闭命令行窗口
echo.
echo 【环境要求】
echo   - Windows 10/11
echo   - Node.js 16+ (https://nodejs.org/)
echo   - pnpm (推荐) 或 npm
echo.
echo 【故障排除】
echo   - 端口被占用：脚本会自动处理
echo   - 依赖安装失败：检查网络连接
echo   - Node.js未安装：访问 nodejs.org 下载
echo.
echo 【注意事项】
echo   - 首次运行需要安装依赖，请耐心等待
echo   - 建议使用 pnpm 包管理器 (更快更稳定)
echo   - 按 Ctrl+C 可以停止开发服务器
echo.
echo ===============================================
pause
goto menu_choice

:exit
echo.
echo 👋 再见！
exit /b 0
