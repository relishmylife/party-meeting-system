#!/bin/bash

# 党组织生活会议管理系统 - 快速开发启动脚本
# 作者: MiniMax Agent
# 版本: v1.0
# 日期: 2025-12-01

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="党组织生活会议管理系统"
DEV_PORT=5173
LOG_FILE="/tmp/dev-startup.log"
PID_FILE="/tmp/dev-server.pid"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $LOG_FILE
}

success() {
    echo -e "${PURPLE}[SUCCESS] $1${NC}" | tee -a $LOG_FILE
}

# 检查是否在项目目录
check_project_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        error "请在项目根目录运行此脚本"
    fi
}

# 检查端口是否可用
check_port() {
    if netstat -tlnp | grep -q ":$DEV_PORT "; then
        warning "端口 $DEV_PORT 已被占用"
        info "正在查找占用进程..."
        netstat -tlnp | grep ":$DEV_PORT "
        
        read -p "是否终止占用进程并继续? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local pid=$(netstat -tlnp | grep ":$DEV_PORT " | awk '{print $7}' | cut -d'/' -f1 | head -1)
            if [[ -n "$pid" && "$pid" != "-" ]]; then
                kill -9 "$pid" 2>/dev/null || true
                sleep 2
            fi
        else
            error "端口被占用，取消启动"
        fi
    fi
}

# 检查Node.js环境
check_nodejs() {
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装，请先安装 Node.js"
    fi
    
    local node_version=$(node --version)
    info "检测到 Node.js 版本: $node_version"
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
    fi
    
    # 检查pnpm
    if command -v pnpm &> /dev/null; then
        info "检测到 pnpm: $(pnpm --version)"
        PACKAGE_MANAGER="pnpm"
    else
        info "使用 npm 作为包管理器"
        PACKAGE_MANAGER="npm"
    fi
}

# 安装依赖
install_dependencies() {
    log "📦 检查并安装依赖..."
    
    if [[ ! -d "node_modules" ]]; then
        log "首次安装依赖..."
        
        if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
            pnpm install --prefer-offline
        else
            npm install --prefer-offline
        fi
        
        success "依赖安装完成"
    else
        log "依赖已存在，跳过安装"
    fi
}

# 启动开发服务器
start_dev_server() {
    log "🚀 启动开发服务器..."
    
    cd "$(dirname "$0")"
    
    # 设置环境变量
    export NODE_ENV=development
    export VITE_PORT=$DEV_PORT
    
    # 启动服务器
    if [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
        log "使用 pnpm 启动..."
        pnpm run dev &
    else
        log "使用 npm 启动..."
        npm run dev &
    fi
    
    local pid=$!
    echo $pid > "$PID_FILE"
    
    log "开发服务器PID: $pid"
}

# 等待服务器启动
wait_for_server() {
    log "⏳ 等待服务器启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -f "http://localhost:$DEV_PORT" > /dev/null 2>&1; then
            success "服务器启动成功!"
            return 0
        fi
        
        sleep 2
        log "尝试 $attempt/$max_attempts..."
        ((attempt++))
    done
    
    error "服务器启动超时，请检查日志"
}

# 检查服务器进程
check_server_process() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            success "开发服务器进程正常运行 (PID: $pid)"
        else
            warning "PID文件存在但进程未运行"
            rm -f "$PID_FILE"
        fi
    else
        warning "未找到PID文件"
    fi
}

# 显示启动信息
show_startup_info() {
    echo -e "\n${GREEN}🎉 开发服务器启动完成!${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo -e "📱 项目名称: $PROJECT_NAME"
    echo -e "🌐 本地地址: ${GREEN}http://localhost:$DEV_PORT${NC}"
    echo -e "🔧 网络地址: ${GREEN}http://$(hostname -I | awk '{print $1}'):$DEV_PORT${NC}"
    echo -e "📁 项目目录: $(pwd)"
    echo -e "📦 包管理器: $PACKAGE_MANAGER"
    echo -e "🆔 进程ID: $(cat $PID_FILE 2>/dev/null || echo '未知')"
    echo -e ""
    echo -e "${YELLOW}开发工具:${NC}"
    echo -e "  🔍 热重载: 启用"
    echo -e "  🐛 调试: 可使用浏览器开发者工具"
    echo -e "  📊 状态: 查看 http://localhost:$DEV_PORT"
    echo -e ""
    echo -e "${BLUE}常用命令:${NC}"
    echo -e "  停止服务器: kill $(cat $PID_FILE 2>/dev/null || echo '<PID>')"
    echo -e "  查看日志: tail -f $LOG_FILE"
    echo -e "  检查进程: ps aux | grep vite"
    echo -e ""
    echo -e "${RED}重要提醒:${NC}"
    echo -e "  ⚠️  开发服务器仅用于开发测试"
    echo -e "  ⚠️  生产环境请使用完整部署脚本"
    echo -e "  ⚠️  按 Ctrl+C 停止开发服务器"
    echo -e "${BLUE}===============================================${NC}"
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在清理...${NC}"
    
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            log "已终止开发服务器进程"
        fi
        rm -f "$PID_FILE"
    fi
    
    # 终止所有vite进程
    pkill -f "vite" 2>/dev/null || true
    
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo -e "${BLUE}🚀 $PROJECT_NAME - 快速开发启动${NC}"
    echo -e "${BLUE}时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}\n"
    
    check_project_directory
    check_nodejs
    check_port
    install_dependencies
    start_dev_server
    wait_for_server
    check_server_process
    show_startup_info
    
    # 保持脚本运行，显示日志
    log "开发服务器已启动，按 Ctrl+C 停止服务"
    
    # 监控日志
    tail -f $LOG_FILE &
    local tail_pid=$!
    
    # 等待中断信号
    while true; do
        sleep 1
        if ! kill -0 $(cat $PID_FILE 2>/dev/null) 2>/dev/null; then
            log "开发服务器进程已退出"
            break
        fi
    done
    
    # 清理
    kill $tail_pid 2>/dev/null || true
    cleanup
}

# 显示帮助信息
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "使用方法: $0 [选项]"
    echo ""
    echo "这是一个快速开发启动脚本，用于启动党组织生活会议管理系统的开发环境。"
    echo ""
    echo "选项:"
    echo "  --help, -h     显示此帮助信息"
    echo ""
    echo "功能:"
    echo "  ✅ 自动检查Node.js环境"
    echo "  ✅ 自动安装项目依赖"
    echo "  ✅ 检查端口占用并处理冲突"
    echo "  ✅ 启动Vite开发服务器"
    echo "  ✅ 启用热重载功能"
    echo "  ✅ 提供详细的状态信息"
    echo ""
    echo "示例:"
    echo "  ./quick-dev-start.sh    # 启动开发服务器"
    echo ""
    echo "访问地址:"
    echo "  http://localhost:5173"
    echo ""
    exit 0
fi

# 执行主函数
main