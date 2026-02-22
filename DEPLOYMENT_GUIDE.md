# 党组织生活会议管理系统 - 完整部署指南

## 🚀 快速部署流程

### 前置条件
- 可用的Supabase项目（URL和ANON_KEY）
- Node.js 18+ 和 pnpm

---

## 第一步：Supabase后端配置

### 1.1 获取Supabase项目配置

[ACTION_REQUIRED] 请提供以下信息：

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

获取方式：
1. 登录 https://supabase.com
2. 选择项目 → 左侧菜单 "Project Settings" → "API"
3. 复制 "Project URL" 和 "anon public" key

### 1.2 执行数据库迁移脚本

在Supabase项目的SQL编辑器中，**按顺序**执行以下脚本：

```bash
/workspace/database_scripts/01_create_base_tables.sql
/workspace/database_scripts/02_create_meeting_tables.sql
/workspace/database_scripts/03_create_file_notification_tables.sql
/workspace/database_scripts/04_create_statistics_system_tables.sql
/workspace/database_scripts/05_create_rls_policies.sql
/workspace/database_scripts/06_create_storage_rls_policies.sql
```

**重要**: 每个脚本执行后检查是否有错误，确保成功后再执行下一个。

### 1.3 创建Storage Bucket

在Supabase项目中创建存储桶：

1. 左侧菜单选择 "Storage"
2. 点击 "Create bucket"
3. 设置：
   - Name: `meeting-files`
   - Public bucket: ✅ 启用
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg,image/png,application/pdf`

### 1.4 插入基础数据

在SQL编辑器中执行：

```sql
-- 插入三会一课会议类型
INSERT INTO meeting_types (id, name, code, description, frequency, required_participants, duration_minutes) VALUES
  (gen_random_uuid(), '支委会', 'branch_committee', '党支部委员会会议', 'monthly', 5, 120),
  (gen_random_uuid(), '党员大会', 'party_assembly', '全体党员参加的会议', 'quarterly', 20, 180),
  (gen_random_uuid(), '党小组会', 'party_group', '党小组组织生活会', 'monthly', 8, 90),
  (gen_random_uuid(), '党课', 'party_class', '党员教育培训课程', 'quarterly', 30, 120);

-- 创建默认组织
INSERT INTO organizations (id, name, code, level, parent_id, status) VALUES
  (gen_random_uuid(), '示例党组织', 'demo_org', 'branch', NULL, 'active');
```

### 1.5 部署Edge Functions

一旦提供了Supabase配置，运行以下命令部署Edge Functions：

```bash
# 确保已安装Supabase CLI
# npm install -g supabase

# 登录Supabase
supabase login

# 链接项目
supabase link --project-ref your-project-id

# 部署Edge Functions
supabase functions deploy file-upload
supabase functions deploy send-notification  
supabase functions deploy generate-statistics
```

**或者**使用`batch_deploy_edge_functions`工具（推荐）：

- file-upload: 文件上传功能
- send-notification: 通知系统
- generate-statistics: 统计分析

### 1.6 配置Edge Function环境变量

在Supabase项目中设置Edge Functions需要的环境变量：

1. 项目设置 → Edge Functions → Secrets
2. 添加以下密钥：
   - `EMAIL_API_KEY`: 邮件服务API密钥（可选，SendGrid等）
   - `SMS_API_KEY`: 短信服务API密钥（可选，阿里云等）

---

## 第二步：前端应用部署

### 2.1 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
cd /workspace/party-meeting-system
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF
```

### 2.2 安装依赖

```bash
pnpm install
```

### 2.3 本地开发测试

```bash
pnpm dev
```

访问 http://localhost:5173 测试功能

### 2.4 生产构建

```bash
pnpm build
```

### 2.5 部署到生产环境

#### 选项A: Vercel部署（推荐）

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### 选项B: 使用deploy工具

```bash
# 使用内置deploy工具
[tool: deploy] 部署dist目录
```

---

## 第三步：系统测试（必需）

### 3.1 用户认证测试

1. **注册测试用户**
   - 打开登录页面
   - 使用测试邮箱注册
   - 检查邮箱验证链接

2. **创建用户profile**
   ```sql
   -- 在SQL编辑器中手动创建用户profile
   INSERT INTO user_profiles (user_id, full_name, role, organization_id, phone, email, status)
   VALUES (
     'user-uuid-from-auth.users',  -- 从auth.users表获取
     '测试管理员',
     'admin',
     'org-uuid-from-organizations',  -- 从organizations表获取
     '13800000000',
     'test@example.com',
     'active'
   );
   ```

3. **登录测试**
   - 使用注册的账号登录
   - 验证仪表板正常显示

### 3.2 会议管理测试

1. **创建会议**
   - 点击"创建会议"按钮
   - 填写会议信息（类型、标题、时间、地点）
   - 提交并验证创建成功

2. **编辑会议**
   - 点击会议列表中的"查看详情"
   - 修改会议信息
   - 保存并验证更新成功

3. **筛选功能**
   - 测试按状态筛选（全部/计划中/进行中/已完成）
   - 验证筛选结果正确

### 3.3 文件上传测试

1. **上传图片**
   - 进入会议详情 → 文件管理
   - 选择JPEG/PNG图片（< 10MB）
   - 上传并验证成功

2. **上传PDF**
   - 选择PDF文件
   - 添加描述
   - 上传并验证URL可访问

3. **错误处理**
   - 测试超大文件（> 10MB）
   - 测试不支持的文件类型
   - 验证错误提示正确

### 3.4 统计分析测试

1. **生成统计数据**
   - 创建若干测试会议
   - 添加参会人员和签到记录
   ```sql
   -- 添加参会人员
   INSERT INTO meeting_participants (meeting_id, user_id, role, status)
   VALUES ('meeting-uuid', 'user-uuid', 'participant', 'invited');
   
   -- 添加签到记录
   INSERT INTO meeting_sign_ins (meeting_id, user_id, sign_in_time, sign_in_method)
   VALUES ('meeting-uuid', 'user-uuid', NOW(), 'manual');
   ```

2. **查看统计页面**
   - 导航到"参会统计"
   - 选择日期范围
   - 点击"查询"
   - 验证数据正确显示

3. **验证图表**
   - 总会议数、参会人次正确
   - 参会率计算准确
   - 会议类型分布正确
   - 月度统计数据准确

### 3.5 权限控制测试

1. **管理员权限**
   - 以admin角色登录
   - 验证可看到"用户管理"和"系统设置"模块
   - 测试所有功能可用

2. **普通用户权限**
   - 创建普通用户（role='member'）
   - 登录验证
   - 确认"用户管理"和"系统设置"不可见
   - 测试基本功能可用

---

## 第四步：生产环境检查清单

### 数据库
- [  ] 所有表创建成功，无错误
- [  ] RLS策略已启用
- [  ] Storage bucket已创建
- [  ] 基础数据已插入（会议类型、组织）

### Edge Functions
- [  ] file-upload已部署并测试
- [  ] send-notification已部署
- [  ] generate-statistics已部署
- [  ] 所有Edge Functions返回200状态

### 前端应用
- [  ] 环境变量配置正确
- [  ] 生产构建无错误
- [  ] 部署到生产环境
- [  ] HTTPS正常访问

### 功能测试
- [  ] 用户登录/登出正常
- [  ] 会议CRUD操作正常
- [  ] 文件上传下载正常
- [  ] 统计分析数据准确
- [  ] 权限控制正确
- [  ] 响应式设计正常（移动端/桌面端）

### 性能和安全
- [  ] 页面加载速度 < 3秒
- [  ] API响应时间 < 1秒
- [  ] RLS策略正确配置（无数据泄露）
- [  ] 文件大小限制有效
- [  ] 错误处理完善

---

## 常见问题排查

### 问题1: "new row violates row-level security policy"

**原因**: RLS策略配置不正确

**解决方案**:
```sql
-- 检查RLS策略是否包含anon角色
SELECT * FROM pg_policies WHERE tablename = 'meeting_files';

-- 如果缺失，添加策略
CREATE POLICY "Allow insert via edge function" ON meeting_files
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));
```

### 问题2: Storage上传失败（InvalidKey）

**原因**: 文件路径包含非ASCII字符

**解决方案**: Edge Function已处理（使用ASCII文件名）

### 问题3: Edge Function 500错误

**排查步骤**:
1. 查看Edge Function日志
2. 检查环境变量是否配置
3. 验证Supabase URL和Service Role Key
4. 测试数据库连接

### 问题4: 统计数据不准确

**排查步骤**:
1. 检查数据库中是否有测试数据
2. 验证SQL查询逻辑
3. 检查日期范围筛选
4. 查看Edge Function日志

---

## 系统架构总结

```
┌─────────────────────────────────────────────────┐
│              前端应用 (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 会议管理  │  │ 文件归档  │  │ 统计分析  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Supabase Backend                       │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │   Storage   │              │
│  │  Database   │  │   Bucket    │              │
│  └─────────────┘  └─────────────┘              │
│  ┌─────────────────────────────────────────┐   │
│  │        Edge Functions                   │   │
│  │  • file-upload                          │   │
│  │  • send-notification                    │   │
│  │  • generate-statistics                  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│      External Services (可选)                   │
│  ┌──────────┐  ┌──────────┐                    │
│  │ SendGrid │  │阿里云短信 │                     │
│  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────┘
```

---

## 技术支持

如遇到问题，请检查：
1. Supabase项目日志（Dashboard → Logs）
2. Edge Function日志（Dashboard → Edge Functions → Logs）
3. 浏览器控制台错误信息
4. 网络请求响应（Network标签）

**当前状态**: 等待Supabase项目配置以继续部署和测试。
