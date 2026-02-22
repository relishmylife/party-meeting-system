# 党组织生活会议管理系统数据库表结构设计

## 概述

本文档详细设计党组织生活会议管理系统的数据库表结构，采用Supabase PostgreSQL数据库，无外键约束的架构设计，确保数据的一致性通过业务逻辑和触发器来保证。

## 数据库设计原则

1. **无外键约束**：遵循Supabase最佳实践，避免复杂的级联操作
2. **UUID主键**：所有主键使用UUID，确保全球唯一性
3. **软删除**：支持软删除，保留历史数据
4. **审计字段**：所有表包含审计字段(created_at, updated_at, created_by, updated_by)
5. **RLS支持**：所有业务表支持行级安全策略

## 核心数据模型

### 1. 用户管理模块

#### 1.1 用户配置表 (user_profiles)
存储用户的详细配置信息，是auth.users的扩展表。

```sql
-- 用户配置表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- 关联auth.users.id
  org_id UUID, -- 组织ID
  employee_id VARCHAR(50), -- 员工编号
  full_name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  avatar_url TEXT,
  phone VARCHAR(20),
  gender VARCHAR(10), -- male, female, other
  birth_date DATE,
  join_party_date DATE, -- 入党日期
  party_branch VARCHAR(100), -- 所在党支部
  position VARCHAR(50), -- 职务
  role VARCHAR(20) DEFAULT 'member', -- admin, member
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_org_id ON user_profiles(org_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- 全文检索索引
CREATE INDEX idx_user_profiles_search ON user_profiles USING gin(to_tsvector('chinese', full_name || ' ' || COALESCE(nickname, '') || ' ' || COALESCE(party_branch, '') || ' ' || COALESCE(position, '')));
```

#### 1.2 组织架构表 (organizations)
存储党组织架构信息。

```sql
-- 组织架构表
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE, -- 组织编码
  type VARCHAR(50), -- party_committee, party_branch, party_group
  parent_id UUID, -- 父组织ID
  level INTEGER NOT NULL, -- 组织级别 1=党委, 2=党总支, 3=党支部, 4=党小组
  description TEXT,
  contact_person_id UUID, -- 负责人ID
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_level ON organizations(level);
CREATE INDEX idx_organizations_status ON organizations(status);

-- 全文检索索引
CREATE INDEX idx_organizations_search ON organizations USING gin(to_tsvector('chinese', name || ' ' || COALESCE(code, '') || ' ' || COALESCE(description, '')));

-- 触发器：更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. 三会一课管理模块

#### 2.1 会议类型配置表 (meeting_types)
会议类型的标准化配置。

```sql
-- 会议类型配置表
CREATE TABLE meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  required_attendance_rate DECIMAL(5,2) DEFAULT 0.80, -- 最低参会率要求
  min_participants INTEGER DEFAULT 3, -- 最少参与人数
  max_participants INTEGER, -- 最大参与人数
  duration_minutes INTEGER, -- 建议会议时长
  template_id UUID, -- 会议模板ID
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入默认会议类型
INSERT INTO meeting_types (code, name, description) VALUES
('branch_meeting', '支委会', '党支部委员会会议'),
('member_meeting', '党员大会', '全体党员大会'),
('group_meeting', '党小组会', '党小组会议'),
('party_lecture', '党课', '党课教育');
```

#### 2.2 会议主表 (meetings)
存储会议的基本信息和状态。

```sql
-- 会议主表
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  type_code VARCHAR(50) NOT NULL, -- 会议类型编码
  org_id UUID NOT NULL, -- 主办组织
  organizer_id UUID NOT NULL, -- 组织者ID
  meeting_date TIMESTAMP NOT NULL, -- 会议时间
  location VARCHAR(200), -- 会议地点
  content TEXT, -- 会议内容
  agenda JSONB, -- 会议议程(JSON格式)
  participants JSONB, -- 参与人员列表
  min_attendees INTEGER, -- 最少参会人数
  max_attendees INTEGER, -- 最大参会人数
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, ongoing, completed, cancelled
  attendance_rate DECIMAL(5,2) DEFAULT 0.00, -- 实际参会率
  actual_attendees INTEGER DEFAULT 0, -- 实际参会人数
  notes TEXT, -- 会议纪要
  summary TEXT, -- 会议总结
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_meetings_org_id ON meetings(org_id);
CREATE INDEX idx_meetings_organizer_id ON meetings(organizer_id);
CREATE INDEX idx_meetings_type_code ON meetings(type_code);
CREATE INDEX idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_organizer_date ON meetings(organizer_id, meeting_date);

-- 全文检索索引
CREATE INDEX idx_meetings_search ON meetings USING gin(to_tsvector('chinese', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(location, '')));

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_meetings_updated_at 
  BEFORE UPDATE ON meetings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3 会议参与者表 (meeting_participants)
记录会议的参与者和签到信息。

```sql
-- 会议参与者表
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  participant_id UUID NOT NULL, -- 参与者ID
  participant_name VARCHAR(100), -- 参与者姓名(冗余字段，方便查询)
  org_id UUID NOT NULL, -- 参与者所在组织
  invited_at TIMESTAMP DEFAULT NOW(),
  rsvp_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, declined
  rsvp_at TIMESTAMP, -- 回复时间
  checkin_status VARCHAR(20) DEFAULT 'absent', -- absent, present, late, leave
  checkin_time TIMESTAMP, -- 签到时间
  checkin_location TEXT, -- 签到地点
  leave_reason TEXT, -- 请假原因
  leave_approved BOOLEAN DEFAULT FALSE,
  remarks TEXT, -- 备注
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant_id ON meeting_participants(participant_id);
CREATE INDEX idx_meeting_participants_org_id ON meeting_participants(org_id);
CREATE INDEX idx_meeting_participants_rsvp_status ON meeting_participants(rsvp_status);
CREATE INDEX idx_meeting_participants_checkin_status ON meeting_participants(checkin_status);

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_meeting_participants_updated_at 
  BEFORE UPDATE ON meeting_participants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.4 会议记录表 (meeting_records)
存储会议记录和相关文档。

```sql
-- 会议记录表
CREATE TABLE meeting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  record_type VARCHAR(30), -- minutes, summary, decision, announcement
  title VARCHAR(300),
  content TEXT NOT NULL,
  attachments JSONB, -- 附件信息
  author_id UUID, -- 记录者ID
  reviewer_id UUID, -- 审核者ID
  approval_status VARCHAR(20) DEFAULT 'draft', -- draft, pending, approved, rejected
  approval_notes TEXT, -- 审核意见
  is_public BOOLEAN DEFAULT FALSE, -- 是否公开
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_meeting_records_meeting_id ON meeting_records(meeting_id);
CREATE INDEX idx_meeting_records_record_type ON meeting_records(record_type);
CREATE INDEX idx_meeting_records_approval_status ON meeting_records(approval_status);

-- 全文检索索引
CREATE INDEX idx_meeting_records_search ON meeting_records USING gin(to_tsvector('chinese', title || ' ' || content));

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_meeting_records_updated_at 
  BEFORE UPDATE ON meeting_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. 文件管理模块

#### 3.1 文件信息表 (files)
存储上传文件的元数据信息。

```sql
-- 文件信息表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(300) NOT NULL,
  original_name VARCHAR(300) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage路径
  file_size BIGINT NOT NULL, -- 文件大小(字节)
  mime_type VARCHAR(100) NOT NULL,
  file_category VARCHAR(50), -- meeting_material, profile_photo, document, other
  related_id UUID, -- 关联的业务ID(如会议ID)
  related_type VARCHAR(30), -- meeting, record, profile
  description TEXT,
  tags TEXT[], -- 标签数组
  is_public BOOLEAN DEFAULT FALSE, -- 是否公开
  upload_status VARCHAR(20) DEFAULT 'uploading', -- uploading, uploaded, processing, completed, failed
  upload_progress INTEGER DEFAULT 0, -- 上传进度(0-100)
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  expires_at TIMESTAMP, -- 过期时间
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_files_related_id ON files(related_id);
CREATE INDEX idx_files_related_type ON files(related_type);
CREATE INDEX idx_files_file_category ON files(file_category);
CREATE INDEX idx_files_upload_status ON files(upload_status);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_is_public ON files(is_public);

-- 全文检索索引
CREATE INDEX idx_files_search ON files USING gin(to_tsvector('chinese', file_name || ' ' || COALESCE(original_name, '') || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.2 文件版本表 (file_versions)
支持文件版本管理。

```sql
-- 文件版本表
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE -- 是否为当前活跃版本
);

-- 创建索引
CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX idx_file_versions_version_number ON file_versions(file_id, version_number);
```

### 4. 通知提醒模块

#### 4.1 通知模板表 (notification_templates)
存储可复用的通知模板。

```sql
-- 通知模板表
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL, -- email, sms, push, system
  subject VARCHAR(200), -- 邮件主题
  content TEXT NOT NULL, -- 模板内容
  variables JSONB, -- 模板变量定义
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入默认模板
INSERT INTO notification_templates (code, name, type, subject, content) VALUES
('meeting_invitation', '会议邀请', 'system', '会议邀请通知', '您被邀请参加"{{meeting_title}}"会议，地点：{{location}}，时间：{{meeting_date}}'),
('meeting_reminder', '会议提醒', 'system', '会议提醒', '您参加的"{{meeting_title}}"会议即将开始，请提前到达。'),
('meeting_cancelled', '会议取消', 'system', '会议取消通知', '原定于{{meeting_date}}的"{{meeting_title}}"会议已取消。'),
('attendance_rate_low', '参会率低提醒', 'system', '参会率低提醒', '最近一次会议的参会率偏低，建议加强参与度。');
```

#### 4.2 通知记录表 (notifications)
记录所有发送的通知信息。

```sql
-- 通知记录表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
  recipient_id UUID NOT NULL, -- 接收者ID
  recipient_type VARCHAR(20) DEFAULT 'user', -- user, org
  type VARCHAR(30) NOT NULL, -- email, sms, push, system
  title VARCHAR(200),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed, read
  scheduled_at TIMESTAMP, -- 计划发送时间
  sent_at TIMESTAMP, -- 实际发送时间
  read_at TIMESTAMP, -- 阅读时间
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  related_id UUID, -- 关联业务ID
  related_type VARCHAR(30), -- meeting, record, system
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_related_id ON notifications(related_id);

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. 统计分析模块

#### 5.1 统计分析维度表 (statistics_dimensions)
预定义的统计分析维度。

```sql
-- 统计分析维度表
CREATE TABLE statistics_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_name VARCHAR(100) NOT NULL, -- 维度名称
  dimension_type VARCHAR(30) NOT NULL, -- organization, person, time, meeting_type, department
  parent_id UUID, -- 父维度ID，支持层级结构
  level INTEGER, -- 维度层级
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入默认维度
INSERT INTO statistics_dimensions (dimension_name, dimension_type, level) VALUES
('组织架构', 'organization', 1),
('人员统计', 'person', 1),
('会议类型', 'meeting_type', 1),
('时间维度', 'time', 1);
```

#### 5.2 统计数据表 (statistics_data)
存储预计算的统计数据。

```sql
-- 统计数据表
CREATE TABLE statistics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL, -- 统计维度ID
  metrics JSONB NOT NULL, -- 统计数据(JSON格式)
  period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly, yearly
  period_value VARCHAR(50) NOT NULL, -- 统计周期值，如"2024-01", "2024-Q1"
  org_id UUID, -- 所属组织
  reference_date DATE, -- 参考日期
  computed_at TIMESTAMP DEFAULT NOW(), -- 计算时间
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_statistics_data_dimension_id ON statistics_data(dimension_id);
CREATE INDEX idx_statistics_data_period_type ON statistics_data(period_type);
CREATE INDEX idx_statistics_data_period_value ON statistics_data(period_value);
CREATE INDEX idx_statistics_data_org_id ON statistics_data(org_id);
CREATE INDEX idx_statistics_data_reference_date ON statistics_data(reference_date);

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_statistics_data_updated_at 
  BEFORE UPDATE ON statistics_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 5.3 参会率统计表 (attendance_statistics)
专门存储参会率相关的统计数据。

```sql
-- 参会率统计表
CREATE TABLE attendance_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL, -- 所属组织
  meeting_type_code VARCHAR(50) NOT NULL, -- 会议类型
  period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
  period_value VARCHAR(50) NOT NULL, -- 周期值
  total_meetings INTEGER DEFAULT 0, -- 总会议数
  total_participants INTEGER DEFAULT 0, -- 总参与人数
  total_attendees INTEGER DEFAULT 0, -- 总参会人数
  attendance_rate DECIMAL(5,4) DEFAULT 0.0000, -- 参会率
  on_time_rate DECIMAL(5,4) DEFAULT 0.0000, -- 准时率
  late_rate DECIMAL(5,4) DEFAULT 0.0000, -- 迟到率
  leave_rate DECIMAL(5,4) DEFAULT 0.0000, -- 请假率
  absent_rate DECIMAL(5,4) DEFAULT 0.0000, -- 缺勤率
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_attendance_statistics_org_id ON attendance_statistics(org_id);
CREATE INDEX idx_attendance_statistics_meeting_type ON attendance_statistics(meeting_type_code);
CREATE INDEX idx_attendance_statistics_period ON attendance_statistics(period_type, period_value);

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_attendance_statistics_updated_at 
  BEFORE UPDATE ON attendance_statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. 系统管理模块

#### 6.1 系统配置表 (system_configs)
存储系统配置参数。

```sql
-- 系统配置表
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(30), -- string, number, boolean, json
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- 是否对前端可见
  category VARCHAR(50), -- 分类，如notification, file, meeting
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('max_file_size', '52428800', 'number', '最大文件上传大小(字节)'),
('allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx"]', 'json', '允许的文件类型'),
('default_attendance_rate', '0.80', 'number', '默认最低参会率要求'),
('meeting_reminder_days', '3', 'number', '会议提醒提前天数'),
('auto_cleanup_days', '365', 'number', '自动清理过期数据天数');
```

#### 6.2 操作日志表 (operation_logs)
记录系统操作日志。

```sql
-- 操作日志表
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL, -- 操作类型
  resource_type VARCHAR(50), -- 资源类型
  resource_id UUID, -- 资源ID
  description TEXT, -- 操作描述
  old_values JSONB, -- 修改前的值
  new_values JSONB, -- 修改后的值
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER, -- 执行时间(毫秒)
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_resource_type ON operation_logs(resource_type);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_success ON operation_logs(success);
```

#### 6.3 系统缓存表 (system_cache)
用于缓存计算结果，提高查询性能。

```sql
-- 系统缓存表
CREATE TABLE system_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(200) UNIQUE NOT NULL,
  cache_value JSONB,
  cache_type VARCHAR(30), -- statistics, search, calculation
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 创建索引
CREATE INDEX idx_system_cache_key ON system_cache(cache_key);
CREATE INDEX idx_system_cache_type ON system_cache(cache_type);
CREATE INDEX idx_system_cache_expires_at ON system_cache(expires_at);

-- 触发器：更新updated_at字段
CREATE TRIGGER trigger_system_cache_updated_at 
  BEFORE UPDATE ON system_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 触发器和函数

### 1. 通用触发器

#### 更新updated_at字段
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### 2. 会议统计触发器

#### 计算会议参会率
```sql
CREATE OR REPLACE FUNCTION calculate_meeting_attendance_rate()
RETURNS TRIGGER AS $$
DECLARE
  total_participants INTEGER;
  total_attendees INTEGER;
  attendance_rate DECIMAL(5,4);
BEGIN
  -- 计算参与总人数和实际参会人数
  SELECT 
    COUNT(*) as total_participants,
    COUNT(CASE WHEN checkin_status IN ('present', 'late') THEN 1 END) as total_attendees
  INTO total_participants, total_attendees
  FROM meeting_participants 
  WHERE meeting_id = COALESCE(NEW.meeting_id, OLD.meeting_id) 
    AND is_deleted = FALSE;
  
  -- 计算参会率
  IF total_participants > 0 THEN
    attendance_rate := total_attendees::DECIMAL / total_participants::DECIMAL;
  ELSE
    attendance_rate := 0;
  END IF;
  
  -- 更新会议表
  UPDATE meetings 
  SET 
    actual_attendees = total_attendees,
    attendance_rate = attendance_rate
  WHERE id = COALESCE(NEW.meeting_id, OLD.meeting_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER trigger_calculate_attendance_rate_participants
  AFTER INSERT OR UPDATE OR DELETE ON meeting_participants
  FOR EACH ROW EXECUTE FUNCTION calculate_meeting_attendance_rate();
```

### 3. 文件管理触发器

#### 清理过期文件
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
BEGIN
  -- 标记过期文件为已删除
  UPDATE files 
  SET is_deleted = TRUE 
  WHERE expires_at < NOW() 
    AND is_deleted = FALSE;
END;
$$ language 'plpgsql';
```

### 4. 统计分析触发器

#### 更新统计缓存
```sql
CREATE OR REPLACE FUNCTION update_attendance_statistics_cache()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  meeting_type_code VARCHAR(50);
  period_type VARCHAR(20);
  period_value VARCHAR(50);
BEGIN
  -- 确定需要更新的统计数据
  IF TG_OP = 'DELETE' THEN
    -- 删除操作
    org_id := OLD.org_id;
    -- 根据会议时间确定统计周期
    SELECT type_code INTO meeting_type_code FROM meetings WHERE id = OLD.meeting_id;
  ELSE
    -- 插入或更新操作
    org_id := COALESCE(NEW.org_id, OLD.org_id);
    SELECT type_code INTO meeting_type_code FROM meetings WHERE id = COALESCE(NEW.meeting_id, OLD.meeting_id);
  END IF;
  
  -- 删除相关缓存，触发重新计算
  DELETE FROM system_cache 
  WHERE cache_key LIKE '%attendance_statistics%' 
    AND cache_value->>'org_id' = org_id::TEXT;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER trigger_update_attendance_cache
  AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_attendance_statistics_cache();
```

## 视图和查询优化

### 1. 会议完整信息视图
```sql
CREATE VIEW meeting_complete_info AS
SELECT 
  m.id,
  m.title,
  m.type_code,
  mt.name as type_name,
  m.org_id,
  o.name as org_name,
  m.organizer_id,
  up.full_name as organizer_name,
  m.meeting_date,
  m.location,
  m.content,
  m.agenda,
  m.participants,
  m.min_attendees,
  m.max_attendees,
  m.status,
  m.attendance_rate,
  m.actual_attendees,
  m.notes,
  m.summary,
  m.created_at,
  m.updated_at
FROM meetings m
LEFT JOIN organizations o ON m.org_id = o.id
LEFT JOIN meeting_types mt ON m.type_code = mt.code
LEFT JOIN user_profiles up ON m.organizer_id = up.user_id
WHERE m.is_deleted = FALSE;
```

### 2. 参会统计视图
```sql
CREATE VIEW meeting_attendance_summary AS
SELECT 
  mp.meeting_id,
  COUNT(*) as total_participants,
  COUNT(CASE WHEN mp.checkin_status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN mp.checkin_status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN mp.checkin_status = 'leave' THEN 1 END) as leave_count,
  COUNT(CASE WHEN mp.checkin_status = 'absent' THEN 1 END) as absent_count,
  ROUND(
    (COUNT(CASE WHEN mp.checkin_status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
  ) as attendance_rate
FROM meeting_participants mp
WHERE mp.is_deleted = FALSE
GROUP BY mp.meeting_id;
```

### 3. 组织人员统计视图
```sql
CREATE VIEW organization_personnel_stats AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.type as org_type,
  COUNT(up.id) as total_members,
  COUNT(CASE WHEN up.role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN up.status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN up.gender = 'male' THEN 1 END) as male_count,
  COUNT(CASE WHEN up.gender = 'female' THEN 1 END) as female_count
FROM organizations o
LEFT JOIN user_profiles up ON o.id = up.org_id AND up.is_deleted = FALSE
WHERE o.is_deleted = FALSE
GROUP BY o.id, o.name, o.type;
```

## 数据迁移和初始化脚本

### 1. 初始化组织架构
```sql
-- 初始化党组织架构
INSERT INTO organizations (id, name, code, type, level, description) VALUES
('00000000-0000-0000-0000-000000000001', '中共XX市委员会', 'CC_XC', 'party_committee', 1, '市级党委'),
('00000000-0000-0000-0000-000000000002', 'XX区委员会', 'QD_QW', 'party_committee', 1, '区级党委'),
('00000000-0000-0000-0000-000000000003', 'XX街道党工委', 'JD_DGW', 'party_committee', 1, '街道级党委');

-- 添加下级组织
INSERT INTO organizations (name, code, type, parent_id, level) VALUES
('XX社区党支部', 'SQ_DZB', 'party_branch', '00000000-0000-0000-0000-000000000003', 2),
('第一党支部', 'DY_DZB', 'party_branch', '00000000-0000-0000-0000-000000000003', 2),
('第二党支部', 'DE_DZB', 'party_branch', '00000000-0000-0000-0000-000000000003', 2);
```

### 2. 创建管理员用户
```sql
-- 注意：管理员用户需要先在auth.users中创建，然后创建对应的profile
-- 这里只是创建profile的示例
INSERT INTO user_profiles (user_id, org_id, full_name, role, status) VALUES
('admin-user-uuid-1', '00000000-0000-0000-0000-000000000001', '系统管理员', 'admin', 'active');
```

## 性能优化建议

### 1. 索引优化
- 为高频查询字段创建适当的索引
- 对于全文检索字段使用Gin索引
- 复合索引的顺序要符合查询模式

### 2. 分区策略
对于操作日志和通知记录等大量数据表，建议使用时间分区：
```sql
-- 示例：按月分区操作日志表
CREATE TABLE operation_logs_2024_01 PARTITION OF operation_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3. 查询优化
- 使用JOIN而不是子查询
- 避免SELECT *，只选择需要的字段
- 合理使用LIMIT和OFFSET
- 对大表使用分页查询

## 数据安全和备份

### 1. RLS策略配置
所有业务表都需要配置适当的RLS策略，确保用户只能访问授权的数据。

### 2. 数据备份策略
- 每日自动备份
- 保留30天的备份数据
- 重要操作前手动备份

### 3. 数据清理
- 软删除的数据定期清理
- 过期缓存数据自动清理
- 日志数据定期归档

## 总结

本数据库设计遵循Supabase最佳实践，采用无外键约束的架构，通过业务逻辑和触发器保证数据一致性。设计考虑了性能、安全性和可扩展性，为党组织生活会议管理系统提供了完整的数据支持。

主要特点：
- 完整覆盖三会一课管理需求
- 支持文件上传和版本管理
- 内置通知提醒系统
- 完善的统计分析功能
- 符合安全要求的RLS策略
- 优秀的查询性能优化

该设计为后续的功能开发和系统实现提供了坚实的数据库基础。