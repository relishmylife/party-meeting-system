-- Migration: create_private_messages_table
-- Created at: 1764417832


-- 创建私信消息表
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);

-- 启用 RLS
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户可以查看发送给自己或自己发送的消息
CREATE POLICY "Users can view their own messages"
  ON private_messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
  );

-- 创建 RLS 策略：用户可以发送消息
CREATE POLICY "Users can send messages"
  ON private_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- 创建 RLS 策略：用户可以更新自己接收的消息（标记已读）
CREATE POLICY "Users can update received messages"
  ON private_messages
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- 创建 RLS 策略：用户可以删除自己发送或接收的消息
CREATE POLICY "Users can delete their own messages"
  ON private_messages
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_private_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_private_messages_timestamp
  BEFORE UPDATE ON private_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_private_messages_updated_at();
;