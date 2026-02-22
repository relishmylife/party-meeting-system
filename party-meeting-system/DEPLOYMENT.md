# 党组织生活会议管理系统 - 部署说明

## 项目状态

### ✅ 已完成的工作

#### 1. 前端开发
- React 18.3 + TypeScript + Vite 6.0 项目已初始化
- TailwindCSS 配置完成(学术蓝色主题)
- 核心功能模块已开发:
  - 用户认证系统 (登录/登出)
  - 会议管理模块 (列表/创建/编辑)
  - 仪表板界面

#### 2. 数据库设计
所有数据库表结构脚本已生成,位于 `/workspace/database_scripts/` 目录:
- `01_create_base_tables.sql` - 用户资料、组织、会议类型
- `02_create_meeting_tables.sql` - 会议、参会人员、签到、议程
- `03_create_file_notification_tables.sql` - 文件、通知模板、通知日志
- `04_create_statistics_system_tables.sql` - 统计、摘要、系统日志
- `05_create_rls_policies.sql` - 行级安全策略

#### 3. 项目结构
```
party-meeting-system/
├── src/
│   ├── components/
│   │   └── meetings/
│   │       ├── MeetingList.tsx      # 会议列表组件
│   │       └── MeetingForm.tsx      # 会议表单组件
│   ├── contexts/
│   │   └── AuthContext.tsx          # 认证上下文
│   ├── lib/
│   │   └── supabase.ts              # Supabase客户端
│   ├── pages/
│   │   ├── LoginPage.tsx            # 登录页面
│   │   ├── DashboardPage.tsx        # 仪表板
│   │   └── MeetingsPage.tsx         # 会议管理页面
│   └── App.tsx                      # 主应用
├── tailwind.config.js               # Tailwind配置(学术蓝色)
└── .env.example                     # 环境变量模板
```

### ⚠️ 需要解决的问题

#### 关键问题: Supabase项目不可用
当前Supabase项目状态为 **INACTIVE** (已暂停超过90天),无法恢复。

**影响:**
- 无法获取 SUPABASE_ANON_KEY
- 无法执行数据库操作
- 无法进行后端功能测试

**解决方案:**
需要提供一个新的可用Supabase项目,或提供以下信息:
1. `SUPABASE_URL` (项目URL)
2. `SUPABASE_ANON_KEY` (匿名密钥)

## 部署步骤

### 步骤1: 准备Supabase项目

1. 访问 https://supabase.com 创建新项目,或使用现有项目
2. 获取项目配置:
   - 项目设置 -> API -> Project URL
   - 项目设置 -> API -> anon public key

### 步骤2: 初始化数据库

在Supabase项目的SQL编辑器中,按顺序执行以下脚本:

1. `database_scripts/01_create_base_tables.sql`
2. `database_scripts/02_create_meeting_tables.sql`
3. `database_scripts/03_create_file_notification_tables.sql`
4. `database_scripts/04_create_statistics_system_tables.sql`
5. `database_scripts/05_create_rls_policies.sql`

### 步骤3: 配置环境变量

在项目根目录创建 `.env` 文件:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 步骤4: 安装依赖并运行

```bash
cd party-meeting-system
pnpm install
pnpm dev
```

### 步骤5: 初始化数据

在Supabase SQL编辑器中,插入会议类型基础数据:

```sql
-- 插入三会一课会议类型
INSERT INTO meeting_types (id, name, code, description) VALUES
  (gen_random_uuid(), '支委会', 'branch_committee', '党支部委员会会议'),
  (gen_random_uuid(), '党员大会', 'party_assembly', '全体党员参加的会议'),
  (gen_random_uuid(), '党小组会', 'party_group', '党小组组织生活会'),
  (gen_random_uuid(), '党课', 'party_class', '党员教育培训课程');
```

## 待开发功能

### 高优先级
1. 文件上传功能 (Edge Function + Storage)
2. 通知提醒系统 (邮件/短信)
3. 参会率统计和可视化

### 中优先级
4. 签到功能
5. 会议议程管理
6. 会议纪要生成

### 低优先级
7. 全文搜索
8. 数据导出
9. 权限管理优化

## 技术支持

如遇问题,请检查:
1. Supabase项目是否正常运行
2. 环境变量是否正确配置
3. 数据库表是否成功创建
4. 浏览器控制台是否有错误信息
