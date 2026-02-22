#!/bin/bash

# 党组织生活会议管理系统 - 使用示例演示脚本
# 这个脚本演示了所有启动脚本的使用方法
# 作者: MiniMax Agent

echo "=========================================="
echo "党组织生活会议管理系统 - 脚本使用演示"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 演示函数
demo_command() {
    local description="$1"
    local command="$2"
    
    echo -e "${YELLOW}📖 描述: $description${NC}"
    echo -e "${BLUE}💻 命令: $command${NC}"
    echo ""
}

# 演示1: 开发环境快速启动
demo_command "快速启动开发服务器 (推荐用于开发测试)" \
"./quick-dev-start.sh"

echo -e "${GREEN}特点:${NC}"
echo "  ✅ 无需sudo权限"
echo "  ✅ 自动检查和安装依赖"
echo "  ✅ 智能处理端口冲突"
echo "  ✅ 启动后可直接访问 http://localhost:5173"
echo ""
echo -e "${GREEN}适用场景:${NC}"
echo "  • 本地开发调试"
echo "  • 功能测试验证"
echo "  • 快速演示展示"
echo ""
echo "----------------------------------------"
echo ""

# 演示2: 生产环境完整部署
demo_command "生产环境完整部署 (推荐用于正式上线)" \
"sudo bash start-all-services.sh"

echo -e "${GREEN}特点:${NC}"
echo "  ✅ 完整的系统服务管理"
echo "  ✅ Nginx反向代理配置"
echo "  ✅ SSL证书准备 (可选)"
echo "  ✅ 健康检查和状态监控"
echo "  ✅ 生产级别的错误处理"
echo ""
echo -e "${GREEN}适用场景:${NC}"
echo "  • 正式生产环境部署"
echo "  • 内蒙古科技大学集成"
echo "  • 长期稳定运行"
echo ""
echo "----------------------------------------"
echo ""

# 演示3: 开发模式启动
demo_command "开发模式启动 (包含开发服务器和Nginx)" \
"sudo bash start-all-services.sh dev"

echo -e "${GREEN}特点:${NC}"
echo "  ✅ 启动开发服务器 (端口5173)"
echo "  ✅ 同时保持Nginx服务 (端口80)"
echo "  ✅ 双重访问地址支持"
echo "  ✅ 开发调试友好"
echo ""
echo -e "${GREEN}访问地址:${NC}"
echo "  • 开发地址: http://localhost:5173"
echo "  • 生产地址: http://localhost:80"
echo ""
echo "----------------------------------------"
echo ""

# 演示4: 服务管理
demo_command "查看当前服务状态" \
"sudo bash stop-all-services.sh --status"

demo_command "快速停止所有服务" \
"sudo bash stop-all-services.sh --quick"

demo_command "强制停止所有服务" \
"sudo bash stop-all-services.sh --force"

demo_command "完整停止并生成报告" \
"sudo bash stop-all-services.sh --full"

echo -e "${GREEN}停止模式说明:${NC}"
echo "  • --quick: 快速停止主要服务"
echo "  • --force: 强制终止所有进程"
echo "  • --full: 完整停止 + 清理 + 报告 (默认)"
echo "  • --status: 查看服务状态"
echo ""
echo "----------------------------------------"
echo ""

# 演示5: 帮助信息
demo_command "查看所有脚本的帮助信息" \
"sudo bash start-all-services.sh --help"
echo ""
demo_command "查看停止脚本的帮助信息" \
"sudo bash stop-all-services.sh --help"
echo ""
demo_command "查看开发脚本的帮助信息" \
"./quick-dev-start.sh --help"

echo -e "${GREEN}帮助信息包含:${NC}"
echo "  • 详细的参数说明"
echo "  • 使用示例"
echo "  • 注意事项"
echo "  • 故障排除"
echo ""
echo "----------------------------------------"
echo ""

# 实际使用流程演示
echo -e "${BLUE}🎯 实际使用流程演示:${NC}"
echo ""

echo -e "${YELLOW}场景1: 新用户首次使用${NC}"
echo "1. 进入项目目录: cd /workspace/party-meeting-system"
echo "2. 开发环境测试: ./quick-dev-start.sh"
echo "3. 访问测试: http://localhost:5173"
echo "4. 停止服务: sudo bash stop-all-services.sh --quick"
echo ""

echo -e "${YELLOW}场景2: 生产环境部署${NC}"
echo "1. 进入项目目录: cd /workspace/party-meeting-system"
echo "2. 完整系统启动: sudo bash start-all-services.sh"
echo "3. 验证部署: sudo bash stop-all-services.sh --status"
echo "4. 访问系统: http://localhost/ 或 https://party.imust.edu.cn/"
echo ""

echo -e "${YELLOW}场景3: 开发环境 + 生产服务${NC}"
echo "1. 进入项目目录: cd /workspace/party-meeting-system"
echo "2. 双模式启动: sudo bash start-all-services.sh dev"
echo "3. 开发者访问: http://localhost:5173 (热重载)"
echo "4. 用户访问: http://localhost/ (生产版本)"
echo ""

echo -e "${YELLOW}场景4: 系统维护${NC}"
echo "1. 查看服务状态: sudo bash stop-all-services.sh --status"
echo "2. 查看启动日志: sudo tail -f /var/log/party-system/startup.log"
echo "3. 重启服务: sudo systemctl restart nginx"
echo "4. 完整维护停止: sudo bash stop-all-services.sh --full"
echo ""

echo "----------------------------------------"
echo ""

# 最佳实践建议
echo -e "${BLUE}💡 最佳实践建议:${NC}"
echo ""

echo -e "${GREEN}开发阶段:${NC}"
echo "  • 使用 ./quick-dev-start.sh 进行快速开发"
echo "  • 利用热重载功能提高开发效率"
echo "  • 定期测试Supabase连接"
echo "  • 监控浏览器控制台错误"
echo ""

echo -e "${GREEN}测试阶段:${NC}"
echo "  • 使用 sudo bash start-all-services.sh dev"
echo "  • 同时测试开发和生产版本"
echo "  • 验证所有功能正常工作"
echo "  • 检查性能和响应时间"
echo ""

echo -e "${GREEN}生产阶段:${NC}"
echo "  • 使用 sudo bash start-all-services.sh 进行部署"
echo "  • 配置SSL证书启用HTTPS"
echo "  • 设置定时备份和监控"
echo "  • 定期检查系统资源使用"
echo ""

echo -e "${GREEN}维护阶段:${NC}"
echo "  • 使用停止脚本进行安全停机"
echo "  • 定期查看错误日志"
echo "  • 监控系统性能和资源"
echo "  • 及时更新依赖和安全补丁"
echo ""

echo "----------------------------------------"
echo ""

# 故障排除流程
echo -e "${BLUE}🔧 故障排除流程:${NC}"
echo ""

echo -e "${YELLOW}第1步: 检查服务状态${NC}"
echo "sudo bash stop-all-services.sh --status"
echo ""

echo -e "${YELLOW}第2步: 查看错误日志${NC}"
echo "sudo tail -50 /var/log/nginx/error.log"
echo "sudo tail -50 /var/log/party-system/startup.log"
echo ""

echo -e "${YELLOW}第3步: 检查网络连接${NC}"
echo "curl -I https://lfmpvxczahvcselayyho.supabase.co"
echo "ping party.imust.edu.cn"
echo ""

echo -e "${YELLOW}第4步: 重启服务${NC}"
echo "sudo bash stop-all-services.sh --force"
echo "sudo bash start-all-services.sh"
echo ""

echo "----------------------------------------"
echo ""

# 成功案例
echo -e "${BLUE}🎉 成功启动的标志:${NC}"
echo ""

echo -e "${GREEN}✅ 开发环境:${NC}"
echo "  • 终端显示: '开发服务器启动成功'"
echo "  • 访问地址: http://localhost:5173 能正常打开"
echo "  • 浏览器显示: React应用界面正常渲染"
echo ""

echo -e "${GREEN}✅ 生产环境:${NC}"
echo "  • Nginx状态: 'active (running)'"
echo "  • 访问地址: http://localhost/ 能正常打开"
echo "  • 响应时间: < 2秒"
echo "  • 日志无错误: /var/log/nginx/error.log 无错误"
echo ""

echo -e "${GREEN}✅ 系统集成:${NC}"
echo "  • 用户登录功能正常"
echo "  • 数据库连接正常"
echo "  • 文件上传功能正常"
echo "  • 统计分析功能正常"
echo ""

echo "=========================================="
echo -e "${GREEN}演示完成！${NC}"
echo ""
echo -e "${BLUE}现在您可以根据自己的需求选择合适的启动方式:${NC}"
echo ""
echo -e "${YELLOW}开发测试:${NC} ./quick-dev-start.sh"
echo -e "${YELLOW}生产部署:${NC} sudo bash start-all-services.sh"
echo -e "${YELLOW}混合模式:${NC} sudo bash start-all-services.sh dev"
echo -e "${YELLOW}服务管理:${NC} sudo bash stop-all-services.sh --status"
echo ""
echo -e "${BLUE}更多详细信息请查看:${NC}"
echo "  • 启动脚本使用指南.md"
echo "  • 服务启动顺序指南.md"
echo "  • 使用 --help 参数查看各脚本帮助"
echo ""
echo "=========================================="