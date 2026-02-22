-- Migration: create_rls_policies
-- Created at: 1764578096

-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 用户档案策略
CREATE POLICY "用户可以查看自己的档案" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "管理员可以查看所有档案" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "用户可以更新自己的档案" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 会议策略
CREATE POLICY "用户可以查看参与的会议" ON meetings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM meeting_participants 
      WHERE meeting_id = meetings.id
    )
    OR organizer_id = auth.uid()
  );

CREATE POLICY "管理员可以管理所有会议" ON meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 参与人员策略
CREATE POLICY "用户可以查看自己的参与记录" ON meeting_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "管理员可以管理所有参与记录" ON meeting_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 通知策略
CREATE POLICY "用户可以查看自己的通知" ON notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "管理员可以管理所有通知" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 私信策略
CREATE POLICY "用户可以查看自己参与私信" ON private_messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));

CREATE POLICY "用户可以发送私信" ON private_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "用户可以更新私信" ON private_messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 文件策略
CREATE POLICY "用户可以查看公开文件" ON files
  FOR SELECT USING (is_public = true OR auth.uid() = uploader_id);

CREATE POLICY "管理员可以管理所有文件" ON files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 操作日志策略
CREATE POLICY "管理员可以查看操作日志" ON operation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );;