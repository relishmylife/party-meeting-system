-- Migration: create_notification_tables
-- Created at: 1764402547

-- 通知模板表
CREATE TABLE notification_templates (
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
('attendance_rate_low', '参会率低提醒', 'system', '参会率低提醒', '最近一次会议的参会率偏低，建议加强参与度。');

-- 通知记录表
CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_related_id ON notifications(related_id);

CREATE TRIGGER trigger_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;