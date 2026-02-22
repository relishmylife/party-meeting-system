-- Migration: create_file_tables
-- Created at: 1764402529

-- 文件信息表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(300) NOT NULL,
  original_name VARCHAR(300) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_category VARCHAR(50),
  related_id UUID,
  related_type VARCHAR(30),
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  upload_status VARCHAR(20) DEFAULT 'uploading',
  upload_progress INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID,
  updated_by UUID,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_files_related_id ON files(related_id);
CREATE INDEX idx_files_related_type ON files(related_type);
CREATE INDEX idx_files_file_category ON files(file_category);
CREATE INDEX idx_files_upload_status ON files(upload_status);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_is_public ON files(is_public);
CREATE INDEX idx_files_search ON files USING gin(to_tsvector('chinese', file_name || ' ' || COALESCE(original_name, '') || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

CREATE TRIGGER trigger_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 文件版本表
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX idx_file_versions_version_number ON file_versions(file_id, version_number);;