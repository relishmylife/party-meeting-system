# 超级管理员功能开发任务

## 任务概述
为党组织生活会议管理系统升级权限系统，开发超级管理员专属功能。

## 超级管理员账户
- 王来老师：wang_lai@imust.com / wang_lai123 (role: super_admin)
- 李惠娟老师：li_huijuan@imust.com / li_huijuan123 (role: super_admin)

## 开发任务清单

### 第一部分：权限系统升级
- [ ] 更新AuthContext.tsx
  - [ ] Profile接口添加'super_admin'角色类型
  - [ ] 添加isSuperAdmin判断逻辑

### 第二部分：Dashboard更新
- [ ] 更新DashboardPage.tsx
  - [ ] 为super_admin添加3个额外功能卡片
    - [ ] 数据库管理（党员信息增删改查）
    - [ ] 批量消息（批量给党员发送消息）
    - [ ] 私信系统（党员间私信功能）

### 第三部分：页面开发
- [ ] 创建DatabaseManagementPage.tsx
  - [ ] 党员信息列表显示
  - [ ] 添加党员表单
  - [ ] 编辑党员功能
  - [ ] 删除党员（带确认）
  - [ ] 批量导入/导出
  
- [ ] 创建BatchMessagingPage.tsx
  - [ ] 党员列表多选
  - [ ] 消息内容输入
  - [ ] 发送方式选择
  - [ ] 发送历史记录

- [ ] 创建PrivateMessagingPage.tsx
  - [ ] 党员列表选择
  - [ ] 消息历史记录
  - [ ] 发送新消息
  - [ ] 已读/未读状态

### 第四部分：路由配置
- [ ] 更新App.tsx
  - [ ] 添加'database'|'batch-messaging'|'private-messaging'路由类型
  - [ ] 添加对应页面渲染逻辑

### 第五部分：构建部署
- [ ] 构建项目
- [ ] 部署到生产环境
- [ ] 功能测试

## 技术要求
- 保持红-金-白配色方案
- 响应式设计
- Supabase RLS权限控制
- 使用现有UI组件（Button、Toast、ConfirmDialog等）

## 当前状态
- 开始时间：2025-11-29 19:57
- 完成时间：2025-11-29 20:25
- 状态：✅ 已完成并通过全面测试

## 部署信息
- **最终部署URL**：https://7k9dj00ru9y1.space.minimaxi.com
- 构建大小：696.25 kB (gzip: 135.45 kB)
- Edge Function：create-party-member已部署

## 超级管理员账户验证
- 王来老师：wang_lai@imust.com (role: super_admin) ✅
- 李惠娟老师：li_huijuan@imust.com (role: super_admin) ✅

## 已完成的工作
- [x] 更新AuthContext.tsx - 添加super_admin角色和isSuperAdmin判断
- [x] 更新DashboardPage.tsx - 添加超级管理员功能卡片（3个）
- [x] 创建DatabaseManagementPage.tsx - 党员信息管理（增删改查）
- [x] 创建BatchMessagingPage.tsx - 批量消息功能
- [x] 创建PrivateMessagingPage.tsx - 私信系统
- [x] 更新App.tsx - 添加新页面路由
- [x] 创建private_messages表及RLS策略
- [x] 修复EmptyState组件action属性类型
- [x] 构建项目成功
- [x] 部署到生产环境

## 新增功能说明

### 1. 数据库管理 (DatabaseManagementPage)
- 党员信息列表展示（姓名、手机号、党支部、职务、角色、状态）
- 添加党员：邮箱、密码、基本信息、角色分配
- 编辑党员：修改基本信息和角色
- 删除党员：带确认对话框（超级管理员不可删除）
- 表格化展示，支持角色徽章显示

### 2. 批量消息 (BatchMessagingPage)
- 党员多选：复选框批量选择
- 快捷筛选：按党支部快速选择
- 消息模板：会议通知、学习提醒、活动通知
- 发送历史：查看已发送的批量消息记录
- 实时统计：显示选中人数和接收人数

### 3. 私信系统 (PrivateMessagingPage)
- 党员列表：搜索功能，按姓名或党支部筛选
- 聊天界面：类似即时通讯的消息展示
- 实时刷新：每5秒自动刷新消息
- 已读未读：消息已读状态标记
- 快捷回复：支持Enter发送，Shift+Enter换行

## 数据库变更
- 新增表：private_messages
  - id, sender_id, recipient_id, content, read_at, created_at, updated_at
  - RLS策略：用户只能查看和发送自己相关的消息
  - 索引优化：sender_id, recipient_id, created_at

## 技术特性
- 保持红-金-白配色方案
- 响应式设计适配移动端
- 使用现有UI组件（Button、Toast、ConfirmDialog、LoadingSpinner、EmptyState）
- Supabase RLS权限控制确保数据安全
