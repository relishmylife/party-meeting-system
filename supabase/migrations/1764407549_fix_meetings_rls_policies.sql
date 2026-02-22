-- Migration: fix_meetings_rls_policies
-- Created at: 1764407549

-- 修复meetings表的RLS策略

-- 删除现有的INSERT策略
DROP POLICY IF EXISTS "Allow insert via edge function for meetings" ON meetings;

-- 创建新的INSERT策略，允许认证用户插入会议
CREATE POLICY "Allow authenticated users to insert meetings" ON meetings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 删除现有的SELECT策略
DROP POLICY IF EXISTS "Allow public read for published meetings" ON meetings;

-- 创建新的SELECT策略，允许认证用户读取所有会议
CREATE POLICY "Allow authenticated users to read all meetings" ON meetings
FOR SELECT USING (auth.role() = 'authenticated' OR status IN ('published', 'completed'));

-- 确保UPDATE策略也是正确的
DROP POLICY IF EXISTS "Organizers can update meetings" ON meetings;
CREATE POLICY "Organizers can update meetings" ON meetings
FOR UPDATE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');

-- 添加DELETE策略
CREATE POLICY "Organizers can delete meetings" ON meetings
FOR DELETE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');;