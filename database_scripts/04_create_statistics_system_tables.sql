-- 党组织生活会议管理系统 - 统计和系统表

-- 统计分析维度表
CREATE TABLE IF NOT EXISTS statistics_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_name VARCHAR(100) NOT NULL,
  dimension_type VARCHAR(30) NOT NULL,
  parent_id UUID,
  level INTEGER,
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
('时间维度', 'time', 1)
ON CONFLICT DO NOTHING;

-- 统计数据表
CREATE TABLE IF NOT EXISTS statistics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL,
  metrics JSONB NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_value VARCHAR(50) NOT NULL,
  org_id UUID,
  reference_date DATE,
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_statistics_data_dimension_id ON statistics_data(dimension_id);
CREATE INDEX IF NOT EXISTS idx_statistics_data_period_type ON statistics_data(period_type);
CREATE INDEX IF NOT EXISTS idx_statistics_data_period_value ON statistics_data(period_value);
CREATE INDEX IF NOT EXISTS idx_statistics_data_org_id ON statistics_data(org_id);
CREATE INDEX IF NOT EXISTS idx_statistics_data_reference_date ON statistics_data(reference_date);

DROP TRIGGER IF EXISTS trigger_statistics_data_updated_at ON statistics_data;
CREATE TRIGGER trigger_statistics_data_updated_at 
  BEFORE UPDATE ON statistics_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 参会率统计表
CREATE TABLE IF NOT EXISTS attendance_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  meeting_type_code VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  period_value VARCHAR(50) NOT NULL,
  total_meetings INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  total_attendees INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,4) DEFAULT 0.0000,
  on_time_rate DECIMAL(5,4) DEFAULT 0.0000,
  late_rate DECIMAL(5,4) DEFAULT 0.0000,
  leave_rate DECIMAL(5,4) DEFAULT 0.0000,
  absent_rate DECIMAL(5,4) DEFAULT 0.0000,
  computed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_attendance_statistics_org_id ON attendance_statistics(org_id);
CREATE INDEX IF NOT EXISTS idx_attendance_statistics_meeting_type ON attendance_statistics(meeting_type_code);
CREATE INDEX IF NOT EXISTS idx_attendance_statistics_period ON attendance_statistics(period_type, period_value);

DROP TRIGGER IF EXISTS trigger_attendance_statistics_updated_at ON attendance_statistics;
CREATE TRIGGER trigger_attendance_statistics_updated_at 
  BEFORE UPDATE ON attendance_statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
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
('auto_cleanup_days', '365', 'number', '自动清理过期数据天数', 'system')
ON CONFLICT (config_key) DO NOTHING;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
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

CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_operation_logs_resource_type ON operation_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_operation_logs_success ON operation_logs(success);

-- 系统缓存表
CREATE TABLE IF NOT EXISTS system_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(200) UNIQUE NOT NULL,
  cache_value JSONB,
  cache_type VARCHAR(30),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_system_cache_key ON system_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_system_cache_type ON system_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_system_cache_expires_at ON system_cache(expires_at);

DROP TRIGGER IF EXISTS trigger_system_cache_updated_at ON system_cache;
CREATE TRIGGER trigger_system_cache_updated_at 
  BEFORE UPDATE ON system_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
