-- Migration: create_meeting_tables
-- Created at: 1764578071

-- 会议类型表
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  default_duration INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 会议表
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meeting_type_id UUID,
  status VARCHAR(20) DEFAULT 'planned',
  meeting_date TIMESTAMP NOT NULL,
  duration INTEGER DEFAULT 60,
  location VARCHAR(200),
  max_participants INTEGER,
  organizer_id UUID NOT NULL,
  recorder_id UUID,
  agenda TEXT,
  minutes TEXT,
  attachments JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT FALSE,
  allow_online_participation BOOLEAN DEFAULT FALSE,
  online_meeting_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 会议参与人员表
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'invited',
  attendance_status VARCHAR(20),
  participation_type VARCHAR(20) DEFAULT 'required',
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- 签到表
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  attendance_status VARCHAR(20) DEFAULT 'present',
  location VARCHAR(100),
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meeting_id, participant_id)
);;