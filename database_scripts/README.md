# 党组织生活会议管理系统 - 数据库脚本

## 使用说明

这些SQL脚本用于在Supabase数据库中创建所需的表结构和RLS策略。

### 执行顺序

请按以下顺序在Supabase SQL Editor中执行脚本:

1. `01_create_base_tables.sql` - 创建基础表(用户、组织)
2. `02_create_meeting_tables.sql` - 创建会议相关表
3. `03_create_file_notification_tables.sql` - 创建文件和通知表
4. `04_create_statistics_system_tables.sql` - 创建统计和系统表
5. `05_create_rls_policies.sql` - 配置RLS安全策略

### 执行方法

1. 登录Supabase Dashboard
2. 进入项目的SQL Editor
3. 按顺序复制粘贴每个脚本文件的内容
4. 点击"Run"执行脚本

### 注意事项

- 所有脚本使用 `IF NOT EXISTS` 和 `ON CONFLICT` 语法,可以安全地重复执行
- 脚本包含中文全文检索支持
- RLS策略允许 `anon` 和 `service_role` 两种角色,以支持Edge Functions
- 所有表都启用了软删除(`is_deleted`字段)

### 验证

执行完成后,可以在Supabase Dashboard的Table Editor中查看创建的表。

应该看到以下表:
- user_profiles
- organizations  
- meeting_types
- meetings
- meeting_participants
- meeting_records
- files
- file_versions
- notification_templates
- notifications
- statistics_dimensions
- statistics_data
- attendance_statistics
- system_configs
- operation_logs
- system_cache
