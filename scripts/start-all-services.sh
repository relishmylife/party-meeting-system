#!/bin/bash

# 党组织生活会议管理系统 - 一键启动所有服务脚本
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
PROJECT_NAME="内蒙古科技大学党组织生活会议管理系统"
LOG_DIR="/var/log/party-system"
PID_DIR="/var/run/party-system"
START_LOG="$LOG_DIR/startup.log"
SUPABASE_URL="https://lfmpvxczahvcselayyho.supabase.co"
DEV_PORT=5173
NGINX_ENABLED="/etc/nginx/sites-enabled"
NGINX_AVAILABLE="/etc/nginx/sites-available"

# 创建必要的目录
mkdir -p "$LOG_DIR" "$PID_DIR"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $START_LOG
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $START_LOG
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $START_LOG
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $START_LOG
}

success() {
    echo -e "${PURPLE}[SUCCESS] $1${NC}" | tee -a $START_LOG
}

# 打印分隔线
print_separator() {
    echo -e "${BLUE}$1${NC}"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "此脚本需要root权限运行，请使用: sudo bash $0"
    fi
}

# 检查系统依赖
check_dependencies() {
    log "🔍 检查系统依赖..."
    
    local missing_deps=()
    
    # 检查必要的命令
    local commands=("node" "npm" "nginx" "systemctl" "curl" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    # 检查必要的包
    local packages=("build-essential" "nginx" "curl" "wget" "git")
    for pkg in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $pkg "; then
            missing_deps+=("$pkg")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        warning "发现缺少依赖: ${missing_deps[*]}"
        info "正在尝试自动安装缺少的依赖..."
        
        apt update -qq
        
        for dep in "${missing_deps[@]}"; do
            if command -v apt &> /dev/null; then
                apt install -y "$dep" 2>/dev/null || warning "安装 $dep 失败"
            fi
        done
    fi
    
    success "依赖检查完成"
}

# 检查端口占用
check_ports() {
    log "🔍 检查端口占用情况..."
    
    local ports=(80 443 5173)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tlnp | grep -q ":$port "; then
            occupied_ports+=("$port")
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]]; then
        warning "以下端口已被占用: ${occupied_ports[*]}"
        info "如果这是预期的（如80端口已被其他服务占用），请忽略此警告"
    else
        success "所有端口均可正常使用"
    fi
}

# 启动Supabase服务检查
check_supabase() {
    log "🔍 检查Supabase后端服务..."
    
    if curl -s -f "$SUPABASE_URL/rest/v1/" > /dev/null; then
        success "Supabase服务正常"
        info "数据库URL: $SUPABASE_URL"
    else
        error "Supabase服务不可用，请检查网络连接和配置"
    fi
}

# 初始化项目依赖
init_dependencies() {
    log "📦 初始化项目依赖..."
    
    cd "$(dirname "$0")"
    
    # 检查是否使用pnpm
    if command -v pnpm &> /dev/null; then
        log "使用pnpm安装依赖..."
        pnpm install --prefer-offline
    else
        log "使用npm安装依赖..."
        npm install --prefer-offline
    fi
    
    success "依赖安装完成"
}

# 构建生产版本
build_production() {
    log "🔨 构建生产版本..."
    
    if [[ -d "dist" && -f "dist/index.html" ]]; then
        log "发现已有的构建文件，跳过构建步骤"
        return 0
    fi
    
    if command -v pnpm &> /dev/null; then
        pnpm run build:prod
    else
        npm run build
    fi
    
    if [[ -f "dist/index.html" ]]; then
        success "构建完成"
    else
        error "构建失败，未找到index.html文件"
    fi
}

# 配置Nginx
configure_nginx() {
    log "⚙️ 配置Nginx..."
    
    # 检查是否已经配置
    if [[ -f "$NGINX_AVAILABLE/party-system" ]]; then
        log "检测到已有Nginx配置，跳过配置步骤"
        return 0
    fi
    
    # 创建Nginx配置文件
    cat > "$NGINX_AVAILABLE/party-system" << EOF
# 内蒙古科技大学党组织生活会议管理系统 - Nginx配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

server {
    listen 80;
    server_name localhost party.imust.edu.cn;
    
    # 日志配置
    access_log /var/log/nginx/party-system.access.log;
    error_log /var/log/nginx/party-system.error.log;
    
    # 静态文件根目录
    root /var/www/party-system;
    index index.html;
    
    # 前端路由
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理到Supabase
    location /api/ {
        proxy_pass $SUPABASE_URL/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS头
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}

# HTTPS配置 (需要SSL证书)
# server {
#     listen 443 ssl http2;
#     server_name party.imust.edu.cn;
#     
#     ssl_certificate /etc/letsencrypt/live/party.imust.edu.cn/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/party.imust.edu.cn/privkey.pem;
#     
#     # 其他配置与HTTP版本相同...
# }
EOF

    # 启用站点
    if [[ ! -L "$NGINX_ENABLED/party-system" ]]; then
        ln -sf "$NGINX_AVAILABLE/party-system" "$NGINX_ENABLED/party-system"
    fi
    
    # 测试Nginx配置
    if nginx -t; then
        success "Nginx配置完成"
    else
        error "Nginx配置测试失败"
    fi
}

# 部署静态文件
deploy_files() {
    log "📁 部署静态文件..."
    
    local target_dir="/var/www/party-system"
    
    # 确保目标目录存在
    mkdir -p "$target_dir"
    
    # 复制构建文件
    if [[ -d "dist" ]]; then
        cp -r dist/* "$target_dir/"
        chown -R www-data:www-data "$target_dir"
        chmod -R 755 "$target_dir"
        success "静态文件部署完成"
    else
        error "未找到构建文件，请先运行构建命令"
    fi
}

# 启动Nginx
start_nginx() {
    log "🚀 启动Nginx服务..."
    
    # 重启Nginx以应用新配置
    systemctl restart nginx
    sleep 2
    
    if systemctl is-active --quiet nginx; then
        success "Nginx服务启动成功"
        info "HTTP服务地址: http://localhost/"
        info "HTTPS服务地址: https://party.imust.edu.cn/ (需要配置SSL)"
    else
        error "Nginx服务启动失败"
    fi
}

# 启动开发服务器
start_dev_server() {
    local mode="$1"
    
    if [[ "$mode" != "dev" ]]; then
        return 0
    fi
    
    log "🛠️ 启动开发服务器..."
    
    cd "$(dirname "$0")"
    
    # 检查端口是否被占用
    if netstat -tlnp | grep -q ":$DEV_PORT "; then
        warning "开发端口 $DEV_PORT 已被占用"
        return 0
    fi
    
    # 启动开发服务器
    if command -v pnpm &> /dev/null; then
        pnpm run dev &
    else
        npm run dev &
    fi
    
    local dev_pid=$!
    echo $dev_pid > "$PID_DIR/dev-server.pid"
    
    sleep 3
    
    if kill -0 $dev_pid 2>/dev/null; then
        success "开发服务器启动成功"
        info "开发地址: http://localhost:$DEV_PORT/"
    else
        warning "开发服务器启动可能失败，请检查日志"
    fi
}

# 健康检查
health_check() {
    log "🏥 执行健康检查..."
    
    local services=("nginx")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet "$service"; then
            failed_services+=("$service")
        fi
    done
    
    # 检查Web服务
    if ! curl -s -f http://localhost/ > /dev/null; then
        failed_services+=("web-service")
    fi
    
    if [[ ${#failed_services[@]} -eq 0 ]]; then
        success "所有服务运行正常"
    else
        error "以下服务检查失败: ${failed_services[*]}"
    fi
    
    # 显示服务状态
    info "服务状态:"
    systemctl status nginx --no-pager -l | head -5
}

# 显示启动信息
show_startup_info() {
    print_separator "=========================================="
    success "🎉 $PROJECT_NAME 启动完成!"
    print_separator "=========================================="
    
    echo -e "${BLUE}服务信息:${NC}"
    echo -e "  📱 系统名称: $PROJECT_NAME"
    echo -e "  🌐 HTTP地址: http://localhost/"
    echo -e "  🔒 HTTPS地址: https://party.imust.edu.cn/ (需要SSL证书)"
    echo -e "  🛠️ 开发地址: http://localhost:$DEV_PORT/ (开发模式)"
    echo -e "  📊 监控面板: http://localhost/nginx_status"
    echo -e "  📁 静态文件: /var/www/party-system/"
    echo -e "  📝 日志文件: $LOG_DIR/"
    
    echo -e "\n${BLUE}管理命令:${NC}"
    echo -e "  停止服务: sudo systemctl stop nginx"
    echo -e "  重启服务: sudo systemctl restart nginx"
    echo -e "  查看日志: sudo tail -f $LOG_DIR/startup.log"
    echo -e "  检查状态: sudo systemctl status nginx"
    
    echo -e "\n${BLUE}重要提醒:${NC}"
    echo -e "  ✅ 生产环境建议配置SSL证书"
    echo -e "  ✅ 定期备份数据库和配置文件"
    echo -e "  ✅ 监控系统资源使用情况"
    echo -e "  ✅ 设置防火墙规则保护服务"
}

# 主函数
main() {
    local mode="${1:-prod}"  # 默认生产模式，可选参数: prod/dev
    
    print_separator "=========================================="
    info "🚀 $PROJECT_NAME - 服务启动脚本"
    info "模式: $mode"
    info "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    print_separator "=========================================="
    
    check_root
    check_dependencies
    check_ports
    check_supabase
    init_dependencies
    
    if [[ "$mode" == "prod" ]]; then
        build_production
        configure_nginx
        deploy_files
        start_nginx
    elif [[ "$mode" == "dev" ]]; then
        start_dev_server "dev"
    fi
    
    health_check
    show_startup_info
    
    success "启动脚本执行完成!"
}

# 错误处理
trap 'error "脚本执行过程中发生错误，请检查日志: $START_LOG"' ERR

# 显示帮助信息
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "使用方法: $0 [模式]"
    echo ""
    echo "模式:"
    echo "  prod  - 生产模式 (默认) - 启动Nginx静态服务"
    echo "  dev   - 开发模式 - 启动开发服务器"
    echo ""
    echo "示例:"
    echo "  sudo $0          # 生产模式启动"
    echo "  sudo $0 dev      # 开发模式启动"
    echo ""
    exit 0
fi

# 执行主函数
main "$@"