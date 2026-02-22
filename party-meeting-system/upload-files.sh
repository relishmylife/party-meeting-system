#!/bin/bash

# 网站文件上传和配置脚本
# 用于将构建后的前端文件上传到服务器并配置环境变量

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
SERVER_HOST=""
SERVER_USER=""
SERVER_PORT="22"
WEB_ROOT="/var/www/party-system"
LOCAL_DIST_DIR=""
DOMAIN="party.imust.edu.cn"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# 检查参数
check_parameters() {
    if [[ -z "$SERVER_HOST" ]]; then
        read -p "请输入服务器IP地址或域名: " SERVER_HOST
    fi
    
    if [[ -z "$SERVER_USER" ]]; then
        read -p "请输入服务器用户名 (通常是root或ubuntu): " SERVER_USER
    fi
    
    if [[ -z "$LOCAL_DIST_DIR" ]]; then
        read -p "请输入本地构建文件目录 (默认为./dist): " LOCAL_DIST_DIR
        LOCAL_DIST_DIR=${LOCAL_DIST_DIR:-"./dist"}
    fi
    
    if [[ ! -d "$LOCAL_DIST_DIR" ]]; then
        error "本地构建目录不存在: $LOCAL_DIST_DIR"
    fi
}

# 测试服务器连接
test_connection() {
    log "测试服务器连接..."
    
    if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "echo '连接测试成功'" 2>/dev/null; then
        error "无法连接到服务器 $SERVER_USER@$SERVER_HOST"
    fi
    
    log "服务器连接成功"
}

# 备份现有文件
backup_existing_files() {
    log "备份现有网站文件..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    if [ -d "/var/www/party-system" ] && [ "$(ls -A /var/www/party-system)" ]; then
        BACKUP_DIR="/backup/party-system/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        cp -r /var/www/party-system/* $BACKUP_DIR/
        echo "现有文件已备份到: $BACKUP_DIR"
    fi
EOF
}

# 上传文件
upload_files() {
    log "上传网站文件..."
    
    # 创建临时上传目录
    TEMP_DIR=$(mktemp -d)
    
    # 复制本地文件到临时目录
    cp -r "$LOCAL_DIST_DIR"/* "$TEMP_DIR/"
    
    # 上传到服务器
    scp -r -P $SERVER_PORT "$TEMP_DIR"/* $SERVER_USER@$SERVER_HOST:$WEB_ROOT/
    
    # 清理临时目录
    rm -rf "$TEMP_DIR"
    
    log "文件上传完成"
}

# 设置文件权限
set_permissions() {
    log "设置文件权限..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /var/www/party-system
    
    # 设置目录权限
    find . -type d -exec chmod 755 {} \;
    
    # 设置文件权限
    find . -type f -exec chmod 644 {} \;
    
    # 设置所有者
    chown -R www-data:www-data .
    
    echo "文件权限设置完成"
EOF
}

# 创建环境变量文件
create_env_file() {
    log "创建生产环境配置文件..."
    
    ssh $SERVER_USER@$SERVER_HOST << EOF
cat > /var/www/party-system/.env.production << 'ENVEOF'
# Supabase配置
VITE_SUPABASE_URL=https://lfmpvxczahvcselayyho.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXB2eGN6YWh2Y3NlbGF5eWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDA4MDEsImV4cCI6MjA3OTk3NjgwMX0.ZCafc0DNXOQueWQS4qsCUsecqAVUauH6kVK-w22QIPo

# 学校特定配置
VITE_SCHOOL_NAME=内蒙古科技大学
VITE_SYSTEM_NAME=党组织生活会议管理系统
VITE_DOMAIN=party.imust.edu.cn
VITE_CAS_URL=https://cas.imust.edu.cn

# 生产环境标志
VITE_ENVIRONMENT=production
VITE_DEBUG=false
ENVEOF

chmod 600 /var/www/party-system/.env.production
echo "环境变量文件创建完成"
EOF
}

# 创建CAS配置脚本
create_cas_config() {
    log "创建CAS集成配置文件..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    # 创建CAS配置目录
    mkdir -p /var/www/party-system/cas
    
    # 创建CAS认证前端集成代码
    cat > /var/www/party-system/cas/cas-integration.js << 'JSEOF'
// CAS认证集成代码
class CASAuth {
    constructor() {
        this.casUrl = 'https://cas.imust.edu.cn';
        this.serviceUrl = window.location.origin;
    }

    // 跳转到CAS登录
    redirectToCAS() {
        const service = encodeURIComponent(this.serviceUrl);
        const redirect = encodeURIComponent(`${this.serviceUrl}/callback`);
        window.location.href = `${this.casUrl}/login?service=${service}&redirect_uri=${redirect}`;
    }

    // 处理CAS回调
    async handleCallback(ticket) {
        try {
            // 这里需要后端处理CAS票据验证
            const response = await fetch('/api/cas/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ticket })
            });
            
            const result = await response.json();
            if (result.success) {
                // 登录成功，重定向到主页
                window.location.href = '/';
            } else {
                console.error('CAS认证失败:', result.message);
                return false;
            }
        } catch (error) {
            console.error('CAS认证错误:', error);
            return false;
        }
    }

    // 登出
    async logout() {
        // 清除本地存储
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        // 跳转到CAS登出
        window.location.href = `${this.casUrl}/logout?service=${encodeURIComponent(this.serviceUrl)}`;
    }
}

// 在全局范围内暴露CAS认证实例
window.casAuth = new CASAuth();
JSEOF

    echo "CAS配置文件创建完成"
EOF
}

# 验证部署
verify_deployment() {
    log "验证部署结果..."
    
    # 检查文件是否存在
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /var/www/party-system
    
    echo "检查关键文件..."
    ls -la index.html
    ls -la .env.production
    
    echo "检查文件权限..."
    ls -la | head -10
    
    echo "检查Nginx状态..."
    systemctl is-active nginx
    
    echo "检查网站响应..."
    curl -I http://localhost
EOF
    
    # 测试网站访问
    log "测试网站访问..."
    sleep 3
    
    if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_HOST" | grep -q "200\|301\|302"; then
        log "网站访问正常"
    else
        warning "网站访问可能存在问题，请检查"
    fi
}

# 创建部署验证清单
create_deployment_checklist() {
    log "创建部署验证清单..."
    
    ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    cat > /root/deployment-checklist.txt << 'CHECKLISTEOF'
部署验证清单
=================

基础检查:
□ Nginx服务状态: systemctl status nginx
□ 网站文件权限: ls -la /var/www/party-system/
□ 环境变量文件: cat /var/www/party-system/.env.production
□ SSL证书状态: /root/ssl-check.sh

功能检查:
□ 主页访问: https://party.imust.edu.cn
□ 登录功能: 测试用户登录
□ 会议管理: 测试会议创建/查看
□ 文件上传: 测试文件上传功能
□ 用户管理: 测试用户管理功能

安全检查:
□ HTTPS访问: https://party.imust.edu.cn
□ HTTP重定向: http://party.imust.edu.cn
□ 安全头检查: curl -I https://party.imust.edu.cn
□ 防火墙状态: ufw status

性能检查:
□ 页面加载速度: < 3秒
□ 并发响应: 测试多个用户同时访问
□ 移动端适配: 测试手机浏览器

日志检查:
□ 访问日志: tail -f /var/log/nginx/party.imust.edu.cn.access.log
□ 错误日志: tail -f /var/log/nginx/party.imust.edu.cn.error.log
□ 监控日志: tail -f /var/log/system-monitor.log

常见问题排查:
1. 页面404: 检查Nginx配置和文件权限
2. 登录失败: 检查Supabase配置和网络连接
3. 文件上传失败: 检查存储权限和文件大小限制
4. 性能慢: 检查服务器资源和数据库响应

CHECKLISTEOF

    echo "部署验证清单创建完成: /root/deployment-checklist.txt"
EOF
}

# 主函数
main() {
    echo "========================================="
    echo "网站文件上传和配置脚本"
    echo "目标域名: party.imust.edu.cn"
    echo "========================================="
    echo
    
    check_parameters
    test_connection
    backup_existing_files
    upload_files
    set_permissions
    create_env_file
    create_cas_config
    verify_deployment
    create_deployment_checklist
    
    echo
    echo "========================================="
    echo "🎉 文件上传和配置完成！"
    echo "========================================="
    echo
    echo "下一步操作："
    echo "1. 申请SSL证书: ssh $SERVER_USER@$SERVER_HOST 'bash /root/ssl-issue.sh'"
    echo "2. 配置域名解析到服务器IP"
    echo "3. 验证网站访问: https://party.imust.edu.cn"
    echo "4. 执行功能测试"
    echo
    echo "文件位置："
    echo "- 网站根目录: $SERVER_HOST:$WEB_ROOT"
    echo "- 环境配置: $SERVER_HOST:/var/www/party-system/.env.production"
    echo "- 验证清单: $SERVER_HOST:/root/deployment-checklist.txt"
    echo "========================================="
}

# 执行主函数
main "$@"