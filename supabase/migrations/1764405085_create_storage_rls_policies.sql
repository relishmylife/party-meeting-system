-- Migration: create_storage_rls_policies
-- Created at: 1764405085

-- Storage RLS策略配置
-- 用于meeting-files存储桶的访问控制

-- 1. 启用RLS for storage.objects表（默认已启用，此处确认）
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. 创建Storage Bucket (通过Supabase界面或API)
-- Bucket名称: meeting-files
-- 公开访问: true

-- 3. 配置storage.objects表的RLS策略

-- 策略1: 允许public读取meeting-files桶中的文件
CREATE POLICY "Public read access for meeting-files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'meeting-files');

-- 策略2: 允许通过Edge Function上传文件（关键策略）
-- 注意: 必须同时允许anon和service_role角色
CREATE POLICY "Allow upload via edge function" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'meeting-files'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- 策略3: 仅允许service_role删除文件（管理员功能）
CREATE POLICY "Service role delete only" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'meeting-files' 
    AND auth.role() = 'service_role'
  );

-- 策略4: 允许更新文件（可选）
CREATE POLICY "Allow update via edge function" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'meeting-files'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- 说明：
-- 1. Edge Function使用service_role密钥调用Storage API
-- 2. 但RLS策略仍然检查原始调用者的角色（通常是anon）
-- 3. 因此必须在策略中同时允许anon和service_role两个角色
-- 4. 这避免"new row violates row-level security policy"错误;