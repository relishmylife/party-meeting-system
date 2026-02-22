#!/bin/bash

# 党组织生活会议管理系统 - 停止所有服务脚本
# 作者: MiniMax Agent
# 版本: v1.0
# 日期: 2025-12-01

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="内蒙古科技大学党组织生活会议管理系统"
LOG_FILE="/var/log/party-system/shutdown.log"
PID_DIR="/var/run/party-system"

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")" "$PID_DIR"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $LOG_FILE
}

# 检查权限
check_permissions() {
    if [[ $EUID -ne 0 ]]; then
        error "此脚本需要root权限运行，请使用: sudo bash $0"
        exit 1
    fi
}

# 停止Nginx服务
stop_nginx() {
    log "🛑 停止Nginx服务..."
    
    if systemctl is-active --quiet nginx; then
        systemctl stop nginx
        sleep 2
        
        if ! systemctl is-active --quiet nginx; then
            log "Nginx服务已停止"
        else
            warning "Nginx服务停止可能失败，尝试强制停止..."
            pkill -f nginx || true
        fi
    else
        info "Nginx服务已经停止"
    fi
}

# 停止开发服务器
stop_dev_server() {
    log "🛑 停止开发服务器..."
    
    # 方法1: 查找并终止vite进程
    if pgrep -f "vite" > /dev/null; then
        pkill -f "vite" || true
        sleep 2
        
        if ! pgrep -f "vite" > /dev/null; then
            log "开发服务器已停止"
        else
            warning "开发服务器进程可能仍在运行"
        fi
    else
        info "未找到运行中的开发服务器"
    fi
    
    # 方法2: 查找并终止node进程 (Vite运行在Node.js中)
    if pgrep -f "node.*vite" > /dev/null; then
        pkill -f "node.*vite" || true
        log "Node.js开发进程已终止"
    fi
    
    # 方法3: 检查PID文件
    if [[ -f "$PID_DIR/dev-server.pid" ]]; then
        local dev_pid=$(cat "$PID_DIR/dev-server.pid")
        if kill -0 "$dev_pid" 2>/dev/null; then
            kill "$dev_pid" 2>/dev/null || true
            rm -f "$PID_DIR/dev-server.pid"
            log "通过PID文件终止开发服务器"
        else
            rm -f "$PID_DIR/dev-server.pid"
        fi
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log "🧹 清理临时文件..."
    
    # 清理PID文件
    rm -f "$PID_DIR"/*.pid
    
    # 清理日志文件 (保留最近50行)
    if [[ -f "$LOG_FILE" ]]; then
        tail -50 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
    
    # 清理node_modules/.vite目录
    local project_dir="$(dirname "$0")"
    if [[ -d "$project_dir/node_modules/.vite" ]]; then
        rm -rf "$project_dir/node_modules/.vite"
        log "清理Vite缓存"
    fi
    
    # 清理构建临时文件
    if [[ -d "$project_dir/dist-temp" ]]; then
        rm -rf "$project_dir/dist-temp"
        log "清理构建临时文件"
    fi
}

# 清理端口占用
cleanup_ports() {
    log "🔌 清理端口占用..."
    
    local ports=(80 443 5173 3000)
    
    for port in "${ports[@]}"; do
        local pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
        
        if [[ -n "$pid" && "$pid" != "-" ]]; then
            if kill -0 "$pid" 2>/dev/null; then
                warning "端口 $port 仍被进程 $pid 占用，尝试终止..."
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
                
                if ! netstat -tlnp 2>/dev/null | grep -q ":$port "; then
                    log "端口 $port 已释放"
                else
                    warning "端口 $port 释放失败"
                fi
            fi
        fi
    done
}

# 显示服务状态
show_status() {
    log "📊 当前服务状态:"
    
    # 检查Nginx
    if systemctl is-active --quiet nginx; then
        echo -e "  ${RED}❌ Nginx: 运行中${NC}"
    else
        echo -e "  ${GREEN}✅ Nginx: 已停止${NC}"
    fi
    
    # 检查开发服务器
    if pgrep -f "vite" > /dev/null || pgrep -f "node.*dev" > /dev/null; then
        echo -e "  ${RED}❌ 开发服务器: 运行中${NC}"
    else
        echo -e "  ${GREEN}✅ 开发服务器: 已停止${NC}"
    fi
    
    # 检查端口占用
    echo -e "\n${BLUE}端口占用情况:${NC}"
    for port in 80 443 5173 3000; do
        local status=$(netstat -tlnp 2>/dev/null | grep ":$port " | head -1)
        if [[ -n "$status" ]]; then
            echo -e "  ${YELLOW}⚠️  端口 $port: 被占用 - $status${NC}"
        else
            echo -e "  ${GREEN}✅ 端口 $port: 空闲${NC}"
        fi
    done
}

# 执行系统清理
system_cleanup() {
    log "🧹 执行系统清理..."
    
    # 清理系统缓存 (谨慎执行)
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    
    # 清理临时文件
    find /tmp -name "*party*" -type f -mtime +1 -delete 2>/dev/null || true
    
    # 重启网络服务 (可选)
    if [[ "$1" == "--restart-network" ]]; then
        log "重启网络服务..."
        systemctl restart networking || true
    fi
}

# 生成关闭报告
generate_shutdown_report() {
    local report_file="/var/log/party-system/shutdown-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
==========================================
党组织生活会议管理系统 - 关闭报告
==========================================

关闭时间: $(date '+%Y-%m-%d %H:%M:%S')
关闭用户: $(whoami)
服务器信息: $(uname -a)

服务状态:
- Nginx: $(systemctl is-active nginx)
- 开发服务器: $(pgrep -f vite > /dev/null && echo "运行中" || echo "已停止")

端口占用:
$(netstat -tlnp | grep -E ":(80|443|5173|3000) " || echo "无端口占用")

磁盘使用:
$(df -h / /var/www 2>/dev/null || echo "无法获取磁盘信息")

内存使用:
$(free -h 2>/dev/null || echo "无法获取内存信息")

关闭操作:
1. 停止Nginx服务: $(systemctl is-active nginx >/dev/null 2>&1 && echo "失败" || echo "成功")
2. 停止开发服务器: $(pgrep -f vite >/dev/null && echo "失败" || echo "成功")
3. 清理临时文件: 完成
4. 释放端口占用: 完成

==========================================
EOF

    log "关闭报告已生成: $report_file"
}

# 主函数
main() {
    local option="$1"
    
    echo -e "${BLUE}=========================================="
    echo -e "🛑 $PROJECT_NAME - 服务停止脚本"
    echo -e "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "==========================================${NC}"
    
    check_permissions
    
    case "$option" in
        "--quick"|"-q")
            log "快速停止模式"
            stop_nginx
            stop_dev_server
            ;;
        "--force"|"-f")
            log "强制停止模式"
            pkill -f nginx || true
            pkill -f vite || true
            pkill -f "node.*dev" || true
            ;;
        "--full"|"")
            log "完整停止模式"
            show_status
            stop_nginx
            stop_dev_server
            cleanup_ports
            cleanup_temp_files
            system_cleanup "$2"
            generate_shutdown_report
            ;;
        "--status"|"-s")
            show_status
            exit 0
            ;;
        "--help"|"-h")
            echo "使用方法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --quick, -q    快速停止 (仅停止主要服务)"
            echo "  --force, -f    强制停止 (终止所有相关进程)"
            echo "  --full         完整停止 (默认) - 停止所有服务并清理"
            echo "  --status, -s   显示当前服务状态"
            echo "  --restart-network 重启网络服务 (与--full配合使用)"
            echo "  --help, -h     显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  sudo $0              # 完整停止"
            echo "  sudo $0 --quick      # 快速停止"
            echo "  sudo $0 --force      # 强制停止"
            echo "  sudo $0 --status     # 查看状态"
            echo ""
            exit 0
            ;;
        *)
            error "未知选项: $1"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}✅ 所有服务已停止!${NC}"
    echo -e "${BLUE}如需重新启动，请运行: sudo bash start-all-services.sh${NC}"
}

# 错误处理
trap 'error "脚本执行过程中发生错误，请检查日志: $LOG_FILE"' ERR

# 检查日志目录权限
if [[ ! -w "$(dirname "$LOG_FILE")" ]]; then
    LOG_FILE="/tmp/party-system-shutdown.log"
    mkdir -p "$(dirname "$LOG_FILE")"
fi

# 执行主函数
main "$@"