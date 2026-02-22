-- Migration: create_file_notification_tables_fixed
-- Created at: 1764405015

-- 党组织生活会议管理系统 - 文件和通知表（修复版）

-- 文件信息表
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(300) NOT NULL,
  original_name VARCHAR(300) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_category VARCHAR(50),
  related_id UUID,
  related_type VARCHAR(30),
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  upload_status VARCHAR(20) DEFAULT 'uploading',
  upload_progress INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_files_related_id ON files(related_id);
CREATE INDEX IF NOT EXISTS idx_files_related_type ON files(related_type);
CREATE INDEX IF NOT EXISTS idx_files_file_category ON files(file_category);
CREATE INDEX IF NOT EXISTS idx_files_upload_status ON files(upload_status);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_is_public ON files(is_public);
-- 使用简单搜索而不是中文搜索
CREATE INDEX IF NOT EXISTS idx_files_search ON files USING gin(to_tsvector('simple', file_name || ' ' || COALESCE(original_name, '') || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

DROP TRIGGER IF EXISTS trigger_files_updated_at ON files;
CREATE TRIGGER trigger_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 文件版本表
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_version_number ON file_versions(file_id, version_number);

-- 通知模板表
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL,
  subject VARCHAR(200),
  content TEXT NOT NULL,
  variables JSONB,
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
('attendance_rate_low', '参会率低提醒', 'system', '参会率低提醒', '最近一次会议的参会率偏低，建议加强参与度。')
ON CONFLICT (code) DO NOTHING;

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID,
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) DEFAULT 'user',
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  related_id UUID,
  related_type VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;