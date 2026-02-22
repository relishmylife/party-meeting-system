#!/bin/bash

# 党组织生活会议管理系统 - 快速部署脚本
# 适用于Ubuntu/Debian系统

set -e  # 遇到错误立即退出

echo "========================================="
echo "党组织生活会议管理系统 - 快速部署脚本"
echo "========================================="

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
   echo "此脚本需要root权限运行，请使用: sudo bash deploy.sh" 
   exit 1
fi

# 安装依赖
echo "1. 安装系统依赖..."
apt update
apt install -y nginx curl unzip git

# 创建项目目录
echo "2. 创建项目目录..."
PROJECT_DIR="/var/www/party-system"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 提示用户上传构建文件
echo "3. 请将构建文件上传到 $PROJECT_DIR 目录"
echo "   您可以使用以下命令:"
echo "   scp -r /path/to/dist/* user@server:$PROJECT_DIR/"
echo ""
read -p "上传完成后按回车继续..."

# 检查文件是否存在
if [ ! -f "$PROJECT_DIR/index.html" ]; then
    echo "错误: index.html文件不存在，请检查上传"
    exit 1
fi

# 设置文件权限
echo "4. 设置文件权限..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# 配置Nginx
echo "5. 配置Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/party-system"

cat > $NGINX_CONFIG << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/party-system;
    index index.html;

    # 安全头配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 启用网站
echo "6. 启用网站..."
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# 删除默认配置（可选）
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# 测试Nginx配置
echo "7. 测试Nginx配置..."
nginx -t

# 重新加载Nginx
echo "8. 启动Nginx..."
systemctl enable nginx
systemctl reload nginx

# 设置防火墙
echo "9. 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow ssh
    ufw --force enable
fi

# 创建SSL证书脚本
echo "10. 创建SSL证书获取脚本..."
SSL_SCRIPT="/root/ssl-certificate.sh"
cat > $SSL_SCRIPT << 'EOF'
#!/bin/bash
# SSL证书获取脚本
echo "安装Certbot..."
apt install -y certbot python3-certbot-nginx

echo "请输入您的域名:"
read DOMAIN

echo "获取SSL证书..."
certbot --nginx -d $DOMAIN

echo "SSL证书获取完成！"
EOF

chmod +x $SSL_SCRIPT

# 创建监控脚本
echo "11. 创建系统监控脚本..."
MONITOR_SCRIPT="/root/system-monitor.sh"
cat > $MONITOR_SCRIPT << 'EOF'
#!/bin/bash
# 系统监控脚本

LOG_FILE="/var/log/system-monitor.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 检查Nginx状态
if ! systemctl is-active --quiet nginx; then
    echo "$TIMESTAMP - ERROR: Nginx is not running" >> $LOG_FILE
    systemctl restart nginx
fi

# 检查磁盘空间
DISK_USAGE=$(df /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$TIMESTAMP - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "$TIMESTAMP - WARNING: Memory usage is ${MEM_USAGE}%" >> $LOG_FILE
fi

echo "$TIMESTAMP - System check completed" >> $LOG_FILE
EOF

chmod +x $MONITOR_SCRIPT

# 添加定时任务
echo "12. 设置定时监控..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /root/system-monitor.sh") | crontab -

# 创建备份脚本
echo "13. 创建备份脚本..."
BACKUP_SCRIPT="/root/backup-system.sh"
cat > $BACKUP_SCRIPT << 'EOF'
#!/bin/bash
# 系统备份脚本

BACKUP_DIR="/root/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份网站文件
tar -czf $BACKUP_DIR/website_$DATE.tar.gz -C /var/www party-system

# 备份Nginx配置
cp /etc/nginx/sites-available/party-system $BACKUP_DIR/nginx_$DATE.conf

# 备份Nginx日志
tar -czf $BACKUP_DIR/nginx_logs_$DATE.tar.gz -C /var/log nginx

# 清理7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.conf" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $BACKUP_SCRIPT

# 创建卸载脚本
echo "14. 创建卸载脚本..."
UNINSTALL_SCRIPT="/root/uninstall-system.sh"
cat > $UNINSTALL_SCRIPT << 'EOF'
#!/bin/bash
# 系统卸载脚本

echo "正在卸载党组织生活会议管理系统..."

# 停止服务
systemctl stop nginx

# 删除网站文件
rm -rf /var/www/party-system

# 删除Nginx配置
rm -f /etc/nginx/sites-available/party-system
rm -f /etc/nginx/sites-enabled/party-system

# 删除定时任务
(crontab -l | grep -v "system-monitor.sh") | crontab -

echo "卸载完成！"
EOF

chmod +x $UNINSTALL_SCRIPT

# 显示完成信息
echo ""
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "访问地址: http://your-server-ip"
echo "项目目录: $PROJECT_DIR"
echo ""
echo "重要信息:"
echo "- Nginx配置文件: $NGINX_CONFIG"
echo "- SSL证书获取: bash $SSL_SCRIPT"
echo "- 系统监控: bash $MONITOR_SCRIPT"
echo "- 系统备份: bash $BACKUP_SCRIPT"
echo "- 系统卸载: bash $UNINSTALL_SCRIPT"
echo ""
echo "后续步骤:"
echo "1. 配置域名解析到服务器IP"
echo "2. 运行SSL证书获取脚本: bash $SSL_SCRIPT"
echo "3. 配置防火墙规则（可选）"
echo ""
echo "如果需要技术支持，请查看 DEPLOYMENT_GUIDE.md"
echo "========================================="