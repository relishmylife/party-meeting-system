-- 党组织生活会议管理系统 - 会议相关表

-- 会议类型配置表
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  required_attendance_rate DECIMAL(5,2) DEFAULT 0.80,
  min_participants INTEGER DEFAULT 3,
  max_participants INTEGER,
  duration_minutes INTEGER,
  template_id UUID,
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
('party_lecture', '党课', '党课教育')
ON CONFLICT (code) DO NOTHING;

-- 会议主表
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  type_code VARCHAR(50) NOT NULL,
  org_id UUID NOT NULL,
  organizer_id UUID NOT NULL,
  meeting_date TIMESTAMP NOT NULL,
  location VARCHAR(200),
  content TEXT,
  agenda JSONB,
  participants JSONB,
  min_attendees INTEGER,
  max_attendees INTEGER,
  status VARCHAR(20) DEFAULT 'draft',
  attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  actual_attendees INTEGER DEFAULT 0,
  notes TEXT,
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_meetings_org_id ON meetings(org_id);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON meetings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meetings_type_code ON meetings(type_code);
CREATE INDEX IF NOT EXISTS idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_organizer_date ON meetings(organizer_id, meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_search ON meetings USING gin(to_tsvector('chinese', title || ' ' || COALESCE(content, '') || ' ' || COALESCE(location, '')));

DROP TRIGGER IF EXISTS trigger_meetings_updated_at ON meetings;
CREATE TRIGGER trigger_meetings_updated_at 
  BEFORE UPDATE ON meetings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 会议参与者表
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  participant_name VARCHAR(100),
  org_id UUID NOT NULL,
  invited_at TIMESTAMP DEFAULT NOW(),
  rsvp_status VARCHAR(20) DEFAULT 'pending',
  rsvp_at TIMESTAMP,
  checkin_status VARCHAR(20) DEFAULT 'absent',
  checkin_time TIMESTAMP,
  checkin_location TEXT,
  leave_reason TEXT,
  leave_approved BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_participant_id ON meeting_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_org_id ON meeting_participants(org_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_rsvp_status ON meeting_participants(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_checkin_status ON meeting_participants(checkin_status);

DROP TRIGGER IF EXISTS trigger_meeting_participants_updated_at ON meeting_participants;
CREATE TRIGGER trigger_meeting_participants_updated_at 
  BEFORE UPDATE ON meeting_participants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 会议记录表
CREATE TABLE IF NOT EXISTS meeting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  record_type VARCHAR(30),
  title VARCHAR(300),
  content TEXT NOT NULL,
  attachments JSONB,
  author_id UUID,
  reviewer_id UUID,
  approval_status VARCHAR(20) DEFAULT 'draft',
  approval_notes TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_meeting_records_meeting_id ON meeting_records(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_records_record_type ON meeting_records(record_type);
CREATE INDEX IF NOT EXISTS idx_meeting_records_approval_status ON meeting_records(approval_status);
CREATE INDEX IF NOT EXISTS idx_meeting_records_search ON meeting_records USING gin(to_tsvector('chinese', title || ' ' || content));

DROP TRIGGER IF EXISTS trigger_meeting_records_updated_at ON meeting_records;
CREATE TRIGGER trigger_meeting_records_updated_at 
  BEFORE UPDATE ON meeting_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
