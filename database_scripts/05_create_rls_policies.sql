-- 党组织生活会议管理系统 - RLS策略配置

-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_statistics ENABLE ROW LEVEL SECURITY;

-- user_profiles 策略
CREATE POLICY "Allow public read for user_profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow insert via edge function for user_profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- organizations 策略
CREATE POLICY "Allow public read for organizations" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Allow insert via edge function for organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Service role can modify organizations" ON organizations
  FOR UPDATE USING (auth.role() = 'service_role');

-- meetings 策略  
CREATE POLICY "Allow public read for published meetings" ON meetings
  FOR SELECT USING (status = 'published' OR status = 'completed' OR auth.role() = 'service_role');

CREATE POLICY "Allow insert via edge function for meetings" ON meetings
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Organizers can update meetings" ON meetings
  FOR UPDATE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');

-- meeting_participants 策略
CREATE POLICY "Allow read for participants" ON meeting_participants
  FOR SELECT USING (auth.uid() = participant_id OR auth.role() = 'service_role');

CREATE POLICY "Allow insert via edge function for meeting_participants" ON meeting_participants
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Participants can update their status" ON meeting_participants
  FOR UPDATE USING (auth.uid() = participant_id OR auth.role() = 'service_role');

-- meeting_records 策略
CREATE POLICY "Allow read for meeting records" ON meeting_records
  FOR SELECT USING (is_public = true OR auth.role() = 'service_role');

CREATE POLICY "Allow insert via edge function for meeting_records" ON meeting_records
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Authors can update records" ON meeting_records
  FOR UPDATE USING (auth.uid() = author_id OR auth.role() = 'service_role');

-- files 策略
CREATE POLICY "Allow read for public files" ON files
  FOR SELECT USING (is_public = true OR auth.uid() = uploaded_by OR auth.role() = 'service_role');

CREATE POLICY "Allow insert via edge function for files" ON files
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Uploaders can update files" ON files
  FOR UPDATE USING (auth.uid() = uploaded_by OR auth.role() = 'service_role');

-- notifications 策略
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id OR auth.role() = 'service_role');

CREATE POLICY "Allow insert via edge function for notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = recipient_id OR auth.role() = 'service_role');

-- attendance_statistics 策略
CREATE POLICY "Allow read for attendance_statistics" ON attendance_statistics
  FOR SELECT USING (true);

CREATE POLICY "Allow insert via edge function for attendance_statistics" ON attendance_statistics
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Service role can update attendance_statistics" ON attendance_statistics
  FOR UPDATE USING (auth.role() = 'service_role');
