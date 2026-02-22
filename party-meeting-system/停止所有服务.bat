@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 党组织生活会议管理系统 - Windows服务停止脚本
REM 作者: MiniMax Agent
REM 版本: v1.0
REM 日期: 2025-12-01

echo.
echo ===============================================
echo 🛑 党组织生活会议管理系统 - 服务停止
echo ===============================================
echo.

echo [INFO] 正在停止相关服务进程...

REM 停止Vite开发服务器
echo [INFO] 停止Vite开发服务器...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im vite.exe >nul 2>&1

REM 停止pnpm相关进程
echo [INFO] 停止pnpm进程...
taskkill /f /im pnpm.exe >nul 2>&1

REM 清理可能的端口占用
echo [INFO] 清理端口占用...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4173 "') do taskkill /PID %%a /F >nul 2>&1

echo.
echo [SUCCESS] 服务停止完成
echo [INFO] 如果进程仍在运行，请手动关闭相关窗口
echo.
pause
