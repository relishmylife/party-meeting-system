-- Migration: create_statistics_tables
-- Created at: 1764402566

-- 统计分析维度表
CREATE TABLE statistics_dimensions (
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
('时间维度', 'time', 1);

-- 统计数据表
CREATE TABLE statistics_data (
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

CREATE INDEX idx_statistics_data_dimension_id ON statistics_data(dimension_id);
CREATE INDEX idx_statistics_data_period_type ON statistics_data(period_type);
CREATE INDEX idx_statistics_data_period_value ON statistics_data(period_value);
CREATE INDEX idx_statistics_data_org_id ON statistics_data(org_id);
CREATE INDEX idx_statistics_data_reference_date ON statistics_data(reference_date);

CREATE TRIGGER trigger_statistics_data_updated_at 
  BEFORE UPDATE ON statistics_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 参会率统计表
CREATE TABLE attendance_statistics (
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

CREATE INDEX idx_attendance_statistics_org_id ON attendance_statistics(org_id);
CREATE INDEX idx_attendance_statistics_meeting_type ON attendance_statistics(meeting_type_code);
CREATE INDEX idx_attendance_statistics_period ON attendance_statistics(period_type, period_value);

CREATE TRIGGER trigger_attendance_statistics_updated_at 
  BEFORE UPDATE ON attendance_statistics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;