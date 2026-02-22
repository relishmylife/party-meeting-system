import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://lfmpvxczahvcselayyho.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmbXB2eGN6YWh2Y3NlbGF5eWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDA4MDEsImV4cCI6MjA3OTk3NjgwMX0.ZCafc0DNXOQueWQS4qsCUsecqAVUauH6kVK-w22QIPo'

// 创建Supabase客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
