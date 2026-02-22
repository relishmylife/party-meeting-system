#!/bin/bash

# 党组织生活会议管理系统 - 内蒙古科技大学自动化部署脚本
# 目标域名: party.imust.edu.cn
# 版本: v1.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="party.imust.edu.cn"
EMAIL="admin@imust.edu.cn"
PROJECT_NAME="内蒙古科技大学党组织生活会议管理系统"
WEB_ROOT="/var/www/party-system"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SSL_PATH="/etc/letsencrypt/live"
LOG_FILE="/var/log/deployment.log"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
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

# 检查root权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "此脚本需要root权限运行，请使用: sudo bash $0"
    fi
}

# 检查操作系统
check_os() {
    if ! command -v lsb_release &> /dev/null; then
        error "无法检测操作系统类型"
    fi
    
    OS=$(lsb_release -si)
    if [[ "$OS" != "Ubuntu" ]] && [[ "$OS" != "Debian" ]]; then
        warning "推荐使用Ubuntu或Debian系统，当前系统: $OS"
        read -p "是否继续安装? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 更新系统
update_system() {
    log "更新系统软件包..."
    apt update && apt upgrade -y
    log "系统更新完成"
}

# 安装必要软件
install_packages() {
    log "安装必要软件包..."
    PACKAGES=(
        "nginx"
        "curl"
        "unzip"
        "git"
        "fail2ban"
        "certbot"
        "python3-certbot-nginx"
        "htop"
        "iotop"
        "nmap"
        "apache2-utils"
        "logrotate"
    )
    
    for package in "${PACKAGES[@]}"; do
        if ! command -v $package &> /dev/null; then
            log "安装 $package..."
            apt install -y $package
        else
            info "$package 已安装"
        fi
    done
    log "软件包安装完成"
}

# 配置防火墙
configure_firewall() {
    log "配置防火墙..."
    
    # 检查是否使用ufw
    if command -v ufw &> /dev/null; then
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow ssh
        ufw allow http
        ufw allow https
        ufw --force enable
        log "UFW防火墙配置完成"
    else
        warning "UFW未安装，请手动配置防火墙规则"
    fi
}

# 配置fail2ban
configure_fail2ban() {
    log "配置fail2ban..."
    
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

    systemctl enable fail2ban
    systemctl restart fail2ban
    log "fail2ban配置完成"
}

# 创建网站目录结构
create_directories() {
    log "创建网站目录结构..."
    
    # 主目录
    mkdir -p $WEB_ROOT
    
    # 日志目录
    mkdir -p /var/log/nginx
    
    # 备份目录
    mkdir -p /backup/party-system
    
    # 设置权限
    chown -R www-data:www-data $WEB_ROOT
    chmod -R 755 $WEB_ROOT
    
    log "目录结构创建完成"
}

# 创建Nginx配置
create_nginx_config() {
    log "创建Nginx配置..."
    
    cat > $NGINX_AVAILABLE/$DOMAIN << 'EOF'
# 重定向HTTP到HTTPS
server {
    listen 80;
    server_name party.imust.edu.cn;
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器配置
server {
    listen 443 ssl http2;
    server_name party.imust.edu.cn;
    root /var/www/party-system;
    index index.html;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/party.imust.edu.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/party.imust.edu.cn/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 隐藏Nginx版本
    server_tokens off;
    
    # 限制请求频率
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=2r/s;
    
    # Gzip压缩配置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # 访问日志配置
    access_log /var/log/nginx/party.imust.edu.cn.access.log;
    error_log /var/log/nginx/party.imust.edu.cn.error.log;
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        access_log off;
    }
    
    # HTML文件缓存
    location ~* \.(html|htm)$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
    
    # API代理到Supabase
    location /api/ {
        limit_req zone=api burst=20;
        proxy_pass https://lfmpvxczahvcselayyho.supabase.co/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # WebSocket支持 (Supabase Realtime)
    location /api/realtime {
        limit_req zone=api burst=20;
        proxy_pass https://lfmpvxczahvcselayyho.supabase.co;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # CAS认证处理
    location /cas/ {
        limit_req zone=general burst=10;
        proxy_pass http://cas.imust.edu.cn/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 移除Set-Cookie避免跨域问题
        proxy_hide_header Set-Cookie;
        add_header Set-Cookie "";
    }
    
    # React路由支持 (SPA)
    location / {
        limit_req zone=general burst=5;
        try_files $uri $uri/ /index.html;
    }
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 阻止访问敏感文件
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(sql|env|conf)$ {
        deny all;
    }
    
    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF

    # 启用网站
    ln -sf $NGINX_AVAILABLE/$DOMAIN $NGINX_ENABLED/
    
    # 删除默认配置
    rm -f $NGINX_ENABLED/default
    
    # 测试配置
    nginx -t || error "Nginx配置测试失败"
    
    log "Nginx配置创建完成"
}

# 创建SSL证书脚本
create_ssl_scripts() {
    log "创建SSL证书管理脚本..."
    
    # SSL检查脚本
    cat > /root/ssl-check.sh << 'EOF'
#!/bin/bash
# SSL证书检查脚本

DOMAIN="party.imust.edu.cn"
CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ -f "$CERT_FILE" ]; then
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    
    DAYS_LEFT=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))
    
    if [ $DAYS_LEFT -lt 30 ]; then
        echo "WARNING: SSL证书将在 $DAYS_LEFT 天后过期"
        echo "正在尝试续期..."
        certbot renew --quiet --nginx
        if [ $? -eq 0 ]; then
            echo "SSL证书续期成功"
            systemctl reload nginx
        else
            echo "SSL证书续期失败"
            exit 1
        fi
    else
        echo "SSL证书有效，剩余天数: $DAYS_LEFT"
    fi
else
    echo "ERROR: SSL证书文件不存在"
    exit 1
fi
EOF
    
    # SSL证书获取脚本
    cat > /root/ssl-issue.sh << 'EOF'
#!/bin/bash
# SSL证书获取脚本

DOMAIN="party.imust.edu.cn"
EMAIL="admin@imust.edu.cn"

if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "正在申请SSL证书..."
    certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
    echo "SSL证书申请完成"
else
    echo "SSL证书已存在"
fi
EOF
    
    # 设置执行权限
    chmod +x /root/ssl-check.sh /root/ssl-issue.sh
    
    log "SSL证书脚本创建完成"
}

# 创建监控脚本
create_monitoring_scripts() {
    log "创建系统监控脚本..."
    
    # 主监控脚本
    cat > /root/monitor.sh << 'EOF'
#!/bin/bash
# 系统监控脚本

LOG_FILE="/var/log/system-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DOMAIN="party.imust.edu.cn"

# 检查Nginx状态
if ! systemctl is-active --quiet nginx; then
    echo "$TIMESTAMP - ERROR: Nginx is not running" | tee -a $LOG_FILE
    systemctl restart nginx
    sleep 3
    if systemctl is-active --quiet nginx; then
        echo "$TIMESTAMP - INFO: Nginx restarted successfully" | tee -a $LOG_FILE
    else
        echo "$TIMESTAMP - CRITICAL: Failed to restart Nginx" | tee -a $LOG_FILE
        # 发送告警邮件 (需要配置邮件服务器)
        # echo "Nginx服务重启失败，请及时处理" | mail -s "服务器告警" admin@imust.edu.cn
    fi
fi

# 检查磁盘空间
DISK_USAGE=$(df /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$TIMESTAMP - WARNING: Disk usage is ${DISK_USAGE}%" | tee -a $LOG_FILE
    if [ $DISK_USAGE -gt 90 ]; then
        echo "$TIMESTAMP - CRITICAL: Disk usage exceeded 90%" | tee -a $LOG_FILE
    fi
fi

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 85 ]; then
    echo "$TIMESTAMP - WARNING: Memory usage is ${MEM_USAGE}%" | tee -a $LOG_FILE
fi

# 检查CPU负载
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$LOAD_AVG > 2.0" | bc -l) )); then
    echo "$TIMESTAMP - WARNING: High CPU load: $LOAD_AVG" | tee -a $LOG_FILE
fi

# 检查网站响应
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$DOMAIN/health" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
    echo "$TIMESTAMP - ERROR: Website not responding, HTTP code: $HTTP_CODE" | tee -a $LOG_FILE
fi

# 检查SSL证书
/root/ssl-check.sh >> $LOG_FILE 2>&1

# 检查fail2ban状态
if ! systemctl is-active --quiet fail2ban; then
    echo "$TIMESTAMP - ERROR: fail2ban is not running" | tee -a $LOG_FILE
fi

echo "$TIMESTAMP - System check completed" >> $LOG_FILE
EOF
    
    # 性能统计脚本
    cat > /root/performance-stats.sh << 'EOF'
#!/bin/bash
# 性能统计脚本

LOG_FILE="/var/log/performance.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== Performance Report $DATE ===" >> $LOG_FILE

# 系统负载
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')" >> $LOG_FILE

# 内存使用
echo "Memory Usage:" >> $LOG_FILE
free -h >> $LOG_FILE

# 磁盘使用
echo "Disk Usage:" >> $LOG_FILE
df -h >> $LOG_FILE

# 网络连接
echo "Network Connections:" >> $LOG_FILE
ss -tuln | head -20 >> $LOG_FILE

# 进程信息
echo "Top Processes:" >> $LOG_FILE
ps aux --sort=-%cpu | head -10 >> $LOG_FILE

echo "" >> $LOG_FILE
EOF
    
    # 备份脚本
    cat > /root/backup.sh << 'EOF'
#!/bin/bash
# 系统备份脚本

BACKUP_DIR="/backup/party-system"
DATE=$(date +%Y%m%d_%H%M%S)
WEB_DIR="/var/www/party-system"
NGINX_CONFIG="/etc/nginx/sites-available/party.imust.edu.cn"

mkdir -p $BACKUP_DIR

# 备份网站文件
log "正在备份网站文件..."
tar -czf $BACKUP_DIR/website_$DATE.tar.gz -C $WEB_DIR .

# 备份Nginx配置
log "正在备份Nginx配置..."
cp $NGINX_CONFIG $BACKUP_DIR/nginx_config_$DATE.conf

# 备份Nginx日志 (最近24小时)
log "正在备份Nginx日志..."
find /var/log/nginx -name "*party.imust.edu.cn*" -mtime -1 -exec tar -czf $BACKUP_DIR/nginx_logs_$DATE.tar.gz {} +

# 清理旧备份 (保留30天)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.conf" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    # 设置执行权限
    chmod +x /root/monitor.sh /root/performance-stats.sh /root/backup.sh
    
    log "监控脚本创建完成"
}

# 配置定时任务
configure_cron_jobs() {
    log "配置定时任务..."
    
    # 添加监控任务 (每5分钟)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /root/monitor.sh") | crontab -
    
    # 添加性能统计任务 (每小时)
    (crontab -l 2>/dev/null; echo "0 * * * * /root/performance-stats.sh") | crontab -
    
    # 添加备份任务 (每天凌晨2点)
    (crontab -l 2>/dev/null; echo "0 2 * * * /root/backup.sh") | crontab -
    
    # 添加SSL检查任务 (每天检查一次)
    (crontab -l 2>/dev/null; echo "0 2 * * * /root/ssl-check.sh") | crontab -
    
    # 添加SSL续期任务 (每周检查续期)
    (crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/bin/certbot renew --quiet") | crontab -
    
    log "定时任务配置完成"
}

# 配置日志轮转
configure_logrotate() {
    log "配置日志轮转..."
    
    cat > /etc/logrotate.d/party-system << 'EOF'
/var/log/nginx/party.imust.edu.cn.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/var/log/system-monitor.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
    create 0640 root adm
}

/var/log/performance.log {
    weekly
    missingok
    rotate 8
    compress
    delaycompress
    notifempty
    create 0640 root adm
}

EOF
    
    log "日志轮转配置完成"
}

# 创建应急恢复脚本
create_emergency_scripts() {
    log "创建应急恢复脚本..."
    
    cat > /root/emergency-recovery.sh << 'EOF'
#!/bin/bash
# 紧急恢复脚本

echo "开始紧急恢复流程..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== Emergency Recovery $TIMESTAMP ==="

# 1. 检查系统状态
echo "检查系统状态..."
systemctl status nginx
systemctl status fail2ban

# 2. 重启核心服务
echo "重启核心服务..."
systemctl restart nginx
systemctl restart fail2ban

# 3. 检查磁盘空间
echo "磁盘使用情况:"
df -h

# 4. 检查内存使用
echo "内存使用情况:"
free -h

# 5. 检查系统负载
echo "系统负载:"
uptime

# 6. 检查网络连接
echo "网络端口监听状态:"
ss -tuln | grep :80
ss -tuln | grep :443

# 7. 检查Nginx配置
echo "测试Nginx配置..."
nginx -t

# 8. 重新加载Nginx配置
echo "重新加载Nginx配置..."
nginx -s reload

# 9. 检查SSL证书
echo "检查SSL证书状态..."
/root/ssl-check.sh

# 10. 测试网站响应
echo "测试网站响应..."
curl -I https://party.imust.edu.cn

echo "=== Emergency Recovery Completed ==="
EOF
    
    # 快速重启脚本
    cat > /root/quick-restart.sh << 'EOF'
#!/bin/bash
# 快速重启脚本

echo "快速重启服务..."
systemctl restart nginx fail2ban
systemctl status nginx fail2ban
echo "服务重启完成"
EOF
    
    chmod +x /root/emergency-recovery.sh /root/quick-restart.sh
    
    log "应急恢复脚本创建完成"
}

# 主部署函数
main() {
    echo "========================================="
    echo "内蒙古科技大学党组织生活会议管理系统"
    echo "自动化部署脚本 v1.0"
    echo "目标域名: party.imust.edu.cn"
    echo "========================================="
    echo
    
    # 初始化日志文件
    touch $LOG_FILE
    chmod 644 $LOG_FILE
    
    log "开始部署流程..."
    
    # 执行各个步骤
    check_root
    check_os
    update_system
    install_packages
    configure_firewall
    configure_fail2ban
    create_directories
    create_nginx_config
    create_ssl_scripts
    create_monitoring_scripts
    create_emergency_scripts
    configure_cron_jobs
    configure_logrotate
    
    # 启动Nginx
    systemctl enable nginx
    systemctl start nginx
    
    log "基础环境部署完成！"
    echo
    echo "========================================="
    echo "🎉 基础环境部署完成！"
    echo "========================================="
    echo
    echo "下一步操作："
    echo "1. 上传网站文件到 $WEB_ROOT"
    echo "2. 申请SSL证书: bash /root/ssl-issue.sh"
    echo "3. 配置域名解析到服务器IP"
    echo "4. 验证部署: https://party.imust.edu.cn"
    echo
    echo "重要文件位置："
    echo "- 网站目录: $WEB_ROOT"
    echo "- Nginx配置: /etc/nginx/sites-available/party.imust.edu.cn"
    echo "- SSL证书: $SSL_PATH/party.imust.edu.cn/"
    echo "- 监控脚本: /root/monitor.sh"
    echo "- 备份脚本: /root/backup.sh"
    echo "- 应急脚本: /root/emergency-recovery.sh"
    echo
    echo "查看日志: tail -f $LOG_FILE"
    echo "========================================="
}

# 执行主函数
main "$@"