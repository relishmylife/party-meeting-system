-- Migration: create_system_tables
-- Created at: 1764402585

-- 系统配置表
CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  config_type VARCHAR(30),
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  category VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 插入默认配置
INSERT INTO system_configs (config_key, config_value, config_type, description, category) VALUES
('max_file_size', '52428800', 'number', '最大文件上传大小(字节)', 'file'),
('allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx"]', 'json', '允许的文件类型', 'file'),
('default_attendance_rate', '0.80', 'number', '默认最低参会率要求', 'meeting'),
('meeting_reminder_days', '3', 'number', '会议提醒提前天数', 'notification'),
('auto_cleanup_days', '365', 'number', '自动清理过期数据天数', 'system');

-- 操作日志表
CREATE TABLE operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX idx_operation_logs_action ON operation_logs(action);
CREATE INDEX idx_operation_logs_resource_type ON operation_logs(resource_type);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX idx_operation_logs_success ON operation_logs(success);

-- 系统缓存表
CREATE TABLE system_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(200) UNIQUE NOT NULL,
  cache_value JSONB,
  cache_type VARCHAR(30),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_system_cache_key ON system_cache(cache_key);
CREATE INDEX idx_system_cache_type ON system_cache(cache_type);
CREATE INDEX idx_system_cache_expires_at ON system_cache(expires_at);

CREATE TRIGGER trigger_system_cache_updated_at 
  BEFORE UPDATE ON system_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;