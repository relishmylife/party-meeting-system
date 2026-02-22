# 党组织生活会议管理系统功能模块详细设计

## 概述

本文档详细设计党组织生活会议管理系统的功能模块实现，采用Supabase Edge Functions + React的架构模式，确保所有功能模块的安全性和可扩展性。设计遵循Supabase最佳实践，采用无外键约束和RLS权限控制。

## 模块架构设计

### 架构特点
1. **边缘函数架构**：所有复杂业务逻辑在Edge Functions中处理
2. **前端直连数据库**：简单的CRUD操作直接通过Supabase客户端
3. **权限分离**：RLS策略确保数据安全隔离
4. **实时同步**：利用Supabase Realtime实现实时数据更新

## 1. 用户认证与权限管理模块

### 1.1 功能概述
- 双角色用户系统（管理员/普通用户）
- 基于组织的权限管理
- 用户认证与授权
- 会话管理

### 1.2 前端实现

#### 用户认证组件
```tsx
// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    org_id: string;
    role: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 加载用户信息
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // 获取用户配置信息
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setProfile(profileData);
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 登录
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  // 注册
  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (data.user && !error) {
      // 创建用户配置
      await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          ...userData
        });
    }

    return { data, error };
  };

  // 登出
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 更新用户配置
  const updateProfile = async (updates: any) => {
    if (!user) throw new Error('用户未登录');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### 权限管理组件
```tsx
// src/components/auth/PermissionGuard.tsx
import React from 'react';
import { useAuth } from './AuthProvider';

interface PermissionGuardProps {
  requiredRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  requiredRole, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { profile } = useAuth();

  if (requiredRole && profile?.role !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 1.3 Edge Functions实现

#### 用户认证函数
```typescript
// supabase/functions/auth-manage/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, data } = await req.json();

    let result;

    switch (action) {
      case 'create_user':
        result = await createUser(supabase, data);
        break;
      case 'update_user_role':
        result = await updateUserRole(supabase, data);
        break;
      case 'reset_password':
        result = await resetPassword(supabase, data);
        break;
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createUser(supabase: any, userData: any) {
  // 创建用户账户
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  });

  if (authError) throw authError;

  // 创建用户配置
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      ...userData.profile
    });

  if (profileError) throw profileError;

  return authData.user;
}

async function updateUserRole(supabase: any, data: any) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: data.role })
    .eq('user_id', data.user_id);

  if (error) throw error;

  return { success: true };
}

async function resetPassword(supabase: any, data: any) {
  const { data: authData, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: data.email
  });

  if (error) throw error;

  return authData.properties;
}
```

## 2. 三会一课管理模块

### 2.1 功能概述
- 会议类型管理（支委会、党员大会、党小组会、党课）
- 会议创建和审批
- 参会人员管理
- 会议签到系统
- 会议记录管理

### 2.2 前端实现

#### 会议列表组件
```tsx
// src/components/meetings/MeetingList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface Meeting {
  id: string;
  title: string;
  type_code: string;
  meeting_date: string;
  location: string;
  status: string;
  attendance_rate: number;
  org_name: string;
}

export function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    dateRange: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchMeetings();
  }, [filter, user]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('meeting_complete_info')
        .select('*');

      // 应用过滤条件
      if (filter.type) {
        query = query.eq('type_code', filter.type);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      if (filter.dateRange) {
        const [start, end] = filter.dateRange.split(',');
        query = query
          .gte('meeting_date', start)
          .lte('meeting_date', end);
      }

      const { data, error } = await query.order('meeting_date', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('获取会议列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async (meetingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');

      const { error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: meetingId,
          participant_id: user.id,
          org_id: user.user_metadata.org_id
        });

      if (error) throw error;
      
      // 显示成功消息
      alert('成功报名参会');
      fetchMeetings(); // 刷新列表
    } catch (error) {
      console.error('报名失败:', error);
      alert('报名失败: ' + error.message);
    }
  };

  return (
    <div className="meeting-list">
      <div className="filters">
        <select 
          value={filter.type} 
          onChange={(e) => setFilter({...filter, type: e.target.value})}
        >
          <option value="">所有类型</option>
          <option value="branch_meeting">支委会</option>
          <option value="member_meeting">党员大会</option>
          <option value="group_meeting">党小组会</option>
          <option value="party_lecture">党课</option>
        </select>
        
        <select 
          value={filter.status} 
          onChange={(e) => setFilter({...filter, status: e.target.value})}
        >
          <option value="">所有状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="ongoing">进行中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {loading ? (
        <div>加载中...</div>
      ) : (
        <div className="meeting-grid">
          {meetings.map(meeting => (
            <div key={meeting.id} className="meeting-card">
              <h3>{meeting.title}</h3>
              <p><strong>类型:</strong> {meeting.type_code}</p>
              <p><strong>时间:</strong> {new Date(meeting.meeting_date).toLocaleString()}</p>
              <p><strong>地点:</strong> {meeting.location}</p>
              <p><strong>状态:</strong> {meeting.status}</p>
              <p><strong>参会率:</strong> {meeting.attendance_rate}%</p>
              
              <div className="actions">
                {meeting.status === 'published' && (
                  <button onClick={() => joinMeeting(meeting.id)}>
                    报名参会
                  </button>
                )}
                <button>查看详情</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 会议创建组件
```tsx
// src/components/meetings/MeetingCreate.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthProvider';

export function MeetingCreate() {
  const [formData, setFormData] = useState({
    title: '',
    type_code: '',
    meeting_date: '',
    location: '',
    content: '',
    min_attendees: 3,
    max_attendees: 50,
    agenda: []
  });
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user || !profile) throw new Error('用户未登录');

      const { error } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          type_code: formData.type_code,
          org_id: profile.org_id,
          organizer_id: user.id,
          meeting_date: formData.meeting_date,
          location: formData.location,
          content: formData.content,
          min_attendees: formData.min_attendees,
          max_attendees: formData.max_attendees,
          agenda: formData.agenda,
          status: 'draft'
        });

      if (error) throw error;
      
      alert('会议创建成功');
      // 重置表单
      setFormData({
        title: '',
        type_code: '',
        meeting_date: '',
        location: '',
        content: '',
        min_attendees: 3,
        max_attendees: 50,
        agenda: []
      });
    } catch (error) {
      console.error('创建会议失败:', error);
      alert('创建失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addAgendaItem = () => {
    setFormData({
      ...formData,
      agenda: [
        ...formData.agenda,
        {
          time: '',
          item: '',
          presenter: ''
        }
      ]
    });
  };

  return (
    <div className="meeting-create">
      <h2>创建会议</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>会议标题:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>会议类型:</label>
          <select
            value={formData.type_code}
            onChange={(e) => setFormData({...formData, type_code: e.target.value})}
            required
          >
            <option value="">选择类型</option>
            <option value="branch_meeting">支委会</option>
            <option value="member_meeting">党员大会</option>
            <option value="group_meeting">党小组会</option>
            <option value="party_lecture">党课</option>
          </select>
        </div>

        <div className="form-group">
          <label>会议时间:</label>
          <input
            type="datetime-local"
            value={formData.meeting_date}
            onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>会议地点:</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>会议内容:</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>参会人数:</label>
          <div className="inline-inputs">
            <input
              type="number"
              value={formData.min_attendees}
              onChange={(e) => setFormData({...formData, min_attendees: parseInt(e.target.value)})}
              placeholder="最少人数"
              min="1"
            />
            <span>-</span>
            <input
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData({...formData, max_attendees: parseInt(e.target.value)})}
              placeholder="最多人数"
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>会议议程:</label>
          <button type="button" onClick={addAgendaItem}>添加议程</button>
          {formData.agenda.map((item, index) => (
            <div key={index} className="agenda-item">
              <input
                type="time"
                value={item.time}
                onChange={(e) => {
                  const newAgenda = [...formData.agenda];
                  newAgenda[index].time = e.target.value;
                  setFormData({...formData, agenda: newAgenda});
                }}
              />
              <input
                type="text"
                placeholder="议程内容"
                value={item.item}
                onChange={(e) => {
                  const newAgenda = [...formData.agenda];
                  newAgenda[index].item = e.target.value;
                  setFormData({...formData, agenda: newAgenda});
                }}
              />
              <input
                type="text"
                placeholder="汇报人"
                value={item.presenter}
                onChange={(e) => {
                  const newAgenda = [...formData.agenda];
                  newAgenda[index].presenter = e.target.value;
                  setFormData({...formData, agenda: newAgenda});
                }}
              />
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '创建中...' : '创建会议'}
        </button>
      </form>
    </div>
  );
}
```

### 2.3 Edge Functions实现

#### 会议管理函数
```typescript
// supabase/functions/meeting-manage/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, meetingId, data } = await req.json();

    let result;

    switch (action) {
      case 'publish':
        result = await publishMeeting(supabase, meetingId);
        break;
      case 'send_notifications':
        result = await sendMeetingNotifications(supabase, meetingId);
        break;
      case 'calculate_attendance':
        result = await calculateMeetingAttendance(supabase, meetingId);
        break;
      case 'export_attendance':
        result = await exportAttendanceReport(supabase, meetingId);
        break;
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function publishMeeting(supabase: any, meetingId: string) {
  // 更新会议状态为已发布
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .update({ status: 'published' })
    .eq('id', meetingId)
    .select()
    .single();

  if (meetingError) throw meetingError;

  // 生成参会邀请记录
  // 这里可以根据会议类型和参与范围自动生成参与者列表
  // 示例：邀请组织内所有党员
  const { data: participants } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .eq('org_id', meeting.org_id)
    .eq('status', 'active');

  if (participants) {
    const participantInserts = participants.map((participant: any) => ({
      meeting_id: meetingId,
      participant_id: participant.user_id,
      participant_name: participant.full_name,
      org_id: meeting.org_id,
      invited_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('meeting_participants')
      .insert(participantInserts);

    if (insertError) throw insertError;
  }

  return meeting;
}

async function sendMeetingNotifications(supabase: any, meetingId: string) {
  // 获取会议信息和参与者
  const { data: meeting } = await supabase
    .from('meetings')
    .select(`
      *,
      meeting_participants!inner(
        participant_id,
        user_profiles:participant_id (
          full_name,
          email
        )
      )
    `)
    .eq('id', meetingId)
    .single();

  if (!meeting) throw new Error('会议不存在');

  // 发送通知给所有参与者
  const notifications = meeting.meeting_participants.map((participant: any) => ({
    template_id: null, // 使用默认模板
    recipient_id: participant.participant_id,
    recipient_type: 'user',
    type: 'system',
    title: `会议邀请: ${meeting.title}`,
    content: `您被邀请参加"${meeting.title}"会议\\n\\n时间: ${new Date(meeting.meeting_date).toLocaleString()}\\n地点: ${meeting.location}`,
    scheduled_at: new Date().toISOString(),
    related_id: meetingId,
    related_type: 'meeting'
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) throw error;

  return { success: true, count: notifications.length };
}

async function calculateMeetingAttendance(supabase: any, meetingId: string) {
  // 获取会议参与者统计
  const { data: participants } = await supabase
    .from('meeting_participants')
    .select('checkin_status')
    .eq('meeting_id', meetingId)
    .eq('is_deleted', false);

  if (!participants) return { attendance_rate: 0 };

  const total = participants.length;
  const attended = participants.filter(p => p.checkin_status === 'present' || p.checkin_status === 'late').length;
  const attendance_rate = total > 0 ? (attended / total) * 100 : 0;

  // 更新会议表中的参会率
  await supabase
    .from('meetings')
    .update({ 
      actual_attendees: attended,
      attendance_rate: Math.round(attendance_rate * 100) / 100 
    })
    .eq('id', meetingId);

  return { 
    total_participants: total,
    attended_participants: attended,
    attendance_rate: Math.round(attendance_rate * 100) / 100
  };
}
```

## 3. 文件上传管理模块

### 3.1 功能概述
- 支持图片和PDF文件上传
- 文件版本管理
- 文件分类和标签
- 文件搜索和过滤
- 权限控制

### 3.2 前端实现

#### 文件上传组件
```tsx
// src/components/files/FileUpload.tsx
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface FileUploadProps {
  relatedId?: string;
  relatedType?: string;
  onUploadComplete?: (file: any) => void;
}

export function FileUpload({ relatedId, relatedType, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  const maxSize = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (files: FileList) => {
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const uploadFile = async (file: File) => {
    // 验证文件
    if (!allowedTypes.includes(file.type)) {
      alert(`不支持的文件类型: ${file.type}`);
      return;
    }

    if (file.size > maxSize) {
      alert(`文件太大，最大允许50MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // 转换为Base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // 使用Edge Function上传文件
      const { data, error } = await supabase.functions.invoke('file-upload', {
        body: {
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          relatedId,
          relatedType,
          description: ''
        }
      });

      if (error) throw error;

      setProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }

      alert('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      alert('文件上传失败: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          <p>拖拽文件到此处或点击上传</p>
          <p className="upload-hint">支持 JPG, PNG, PDF 文件，最大50MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>上传中... {progress}%</p>
        </div>
      )}
    </div>
  );
}
```

#### 文件列表组件
```tsx
// src/components/files/FileList.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FileItem {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_category: string;
  description: string;
  created_at: string;
  uploaded_by: string;
  download_count: number;
}

interface FileListProps {
  relatedId?: string;
  relatedType?: string;
}

export function FileList({ relatedId, relatedType }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: '',
    fileType: ''
  });

  useEffect(() => {
    fetchFiles();
  }, [relatedId, relatedType, filter]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('is_deleted', false);

      if (relatedId) {
        query = query.eq('related_id', relatedId);
      }

      if (relatedType) {
        query = query.eq('related_type', relatedType);
      }

      if (filter.category) {
        query = query.eq('file_category', filter.category);
      }

      if (filter.fileType) {
        query = query.eq('mime_type', filter.fileType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('获取文件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('file-download', {
        body: { fileId }
      });

      if (error) throw error;

      // 创建下载链接
      const url = data.url;
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 更新下载次数
      await supabase
        .from('files')
        .update({ 
          download_count: supabase.sql`download_count + 1`,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', fileId);

    } catch (error) {
      console.error('文件下载失败:', error);
      alert('文件下载失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    }
    return '📎';
  };

  return (
    <div className="file-list">
      <div className="filters">
        <select 
          value={filter.category} 
          onChange={(e) => setFilter({...filter, category: e.target.value})}
        >
          <option value="">所有分类</option>
          <option value="meeting_material">会议材料</option>
          <option value="profile_photo">头像照片</option>
          <option value="document">文档</option>
          <option value="other">其他</option>
        </select>

        <select 
          value={filter.fileType} 
          onChange={(e) => setFilter({...filter, fileType: e.target.value})}
        >
          <option value="">所有类型</option>
          <option value="image/jpeg">JPG图片</option>
          <option value="image/png">PNG图片</option>
          <option value="application/pdf">PDF文档</option>
        </select>
      </div>

      {loading ? (
        <div>加载中...</div>
      ) : files.length === 0 ? (
        <div className="no-files">暂无文件</div>
      ) : (
        <div className="file-grid">
          {files.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-icon">{getFileIcon(file.mime_type)}</div>
              <div className="file-info">
                <h4 title={file.original_name}>{file.original_name}</h4>
                <p className="file-meta">
                  {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                </p>
                <p className="file-category">{file.file_category}</p>
                {file.description && (
                  <p className="file-description">{file.description}</p>
                )}
              </div>
              <div className="file-actions">
                <button onClick={() => downloadFile(file.id, file.original_name)}>
                  下载 ({file.download_count})
                </button>
                <button className="delete-btn">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.3 Edge Functions实现

#### 文件上传函数
```typescript
// supabase/functions/file-upload/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { fileData, fileName, fileType, fileSize, relatedId, relatedType, description } = await req.json();

    if (!fileData || !fileName) {
      throw new Error('文件数据和文件名是必需的');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 获取用户信息
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('需要授权');
    }

    const token = authHeader.replace('Bearer ', '');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('无效的令牌');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // 提取base64数据
    const base64Data = fileData.split(',')[1];
    const mimeType = fileData.split(';')[0].split(':')[1];

    // 转换为二进制数据
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // 生成存储路径（只允许ASCII字符）
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || '';
    const storagePath = `files/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // 上传到Supabase Storage
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/party-files/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: binaryData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`上传失败: ${errorText}`);
    }

    // 获取公共URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/party-files/${storagePath}`;

    // 保存文件元数据到数据库
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        file_name: storagePath,
        original_name: fileName,
        file_path: publicUrl,
        file_size: binaryData.length,
        mime_type: mimeType,
        file_category: relatedType || 'other',
        related_id: relatedId || null,
        related_type: relatedType || null,
        description: description || '',
        upload_status: 'uploaded',
        upload_progress: 100,
        uploaded_by: userId,
        is_public: false
      })
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`数据库插入失败: ${errorText}`);
    }

    const fileData_result = await insertResponse.json();

    return new Response(JSON.stringify({
      data: {
        url: publicUrl,
        file: fileData_result[0]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'FILE_UPLOAD_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

#### 文件下载函数
```typescript
// supabase/functions/file-download/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { fileId } = await req.json();

    if (!fileId) {
      throw new Error('文件ID是必需的');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 获取文件信息
    const { data: fileInfo, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!fileInfo) throw new Error('文件不存在');

    // 检查权限（这里简化处理，实际需要根据RLS策略）
    // 生成签名URL（24小时有效期）
    const { data: urlData, error: urlError } = await supabase.storage
      .from('party-files')
      .createSignedUrl(fileInfo.file_name, 24 * 60 * 60);

    if (urlError) throw urlError;

    return new Response(JSON.stringify({
      data: {
        url: urlData.signedUrl,
        fileName: fileInfo.original_name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'FILE_DOWNLOAD_FAILED',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

## 4. 通知提醒模块

### 4.1 功能概述
- 邮件和短信通知
- 会议提醒系统
- 通知模板管理
- 批量通知发送

### 4.2 前端实现

#### 通知中心组件
```tsx
// src/components/notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  read_at: string;
  related_type: string;
  related_id: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    dateRange: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // 实时监听新通知
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user?.id)
        .eq('is_deleted', false);

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.dateRange) {
        const [start, end] = filter.dateRange.split(',');
        query = query
          .gte('created_at', start)
          .lte('created_at', end);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user?.id)
        .eq('status', 'sent')
        .is('read_at', null);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read'
        })
        .eq('id', notificationId);

      if (error) throw error;
      
      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString(), status: 'read' }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read'
        })
        .eq('recipient_id', user?.id)
        .eq('status', 'sent')
        .is('read_at', null);

      if (error) throw error;
      
      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString(), status: 'read' }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '📅';
      case 'system':
        return '🔔';
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      default:
        return '💬';
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h2>通知中心</h2>
        <div className="header-actions">
          <span className="unread-count">{unreadCount} 条未读</span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-read">
              全部标为已读
            </button>
          )}
        </div>
      </div>

      <div className="filters">
        <select 
          value={filter.status} 
          onChange={(e) => setFilter({...filter, status: e.target.value})}
        >
          <option value="">所有状态</option>
          <option value="pending">待发送</option>
          <option value="sending">发送中</option>
          <option value="sent">已发送</option>
          <option value="failed">发送失败</option>
          <option value="read">已读</option>
        </select>

        <select 
          value={filter.type} 
          onChange={(e) => setFilter({...filter, type: e.target.value})}
        >
          <option value="">所有类型</option>
          <option value="meeting">会议</option>
          <option value="system">系统</option>
          <option value="email">邮件</option>
          <option value="sms">短信</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : notifications.length === 0 ? (
        <div className="no-notifications">暂无通知</div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.read_at ? 'unread' : ''}`}
              onClick={() => !notification.read_at && markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.content}</p>
                <span className="notification-time">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              {!notification.read_at && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.3 Edge Functions实现

#### 通知发送函数
```typescript
// supabase/functions/notification-sender/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { notificationIds, action } = await req.json();

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result;

    switch (action) {
      case 'send_batch':
        result = await sendBatchNotifications(supabase, notificationIds);
        break;
      case 'send_single':
        result = await sendSingleNotification(supabase, notificationIds);
        break;
      case 'schedule':
        result = await scheduleNotification(supabase, notificationIds);
        break;
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendBatchNotifications(supabase: any, notificationIds: string[]) {
  // 获取待发送的通知
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      user_profiles!recipient_id (
        full_name,
        email,
        phone
      )
    `)
    .in('id', notificationIds)
    .eq('status', 'pending');

  if (!notifications || notifications.length === 0) {
    throw new Error('没有找到待发送的通知');
  }

  const results = [];

  for (const notification of notifications) {
    try {
      let sendResult;
      
      switch (notification.type) {
        case 'email':
          sendResult = await sendEmailNotification(notification);
          break;
        case 'sms':
          sendResult = await sendSMSNotification(notification);
          break;
        case 'system':
          sendResult = await sendSystemNotification(supabase, notification);
          break;
        default:
          throw new Error(`不支持的通知类型: ${notification.type}`);
      }

      // 更新发送状态
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      results.push({
        notificationId: notification.id,
        status: 'sent',
        recipient: notification.user_profiles?.full_name || 'Unknown'
      });

    } catch (error) {
      // 更新发送失败状态
      await supabase
        .from('notifications')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: notification.retry_count + 1
        })
        .eq('id', notification.id);

      results.push({
        notificationId: notification.id,
        status: 'failed',
        error: error.message,
        recipient: notification.user_profiles?.full_name || 'Unknown'
      });
    }
  }

  return {
    total: notifications.length,
    results,
    success_count: results.filter(r => r.status === 'sent').length,
    failed_count: results.filter(r => r.status === 'failed').length
  };
}

async function sendEmailNotification(notification: any) {
  // 这里集成邮件发送服务，如SendGrid、阿里云邮件等
  // 示例代码
  const emailData = {
    to: notification.user_profiles?.email,
    subject: notification.title,
    html: notification.content
  };

  // 实际发送逻辑需要调用外部邮件服务
  // const response = await fetch('EMAIL_SERVICE_URL', { ... });
  
  return { success: true, messageId: 'mock_message_id' };
}

async function sendSMSNotification(notification: any) {
  // 这里集成短信发送服务，如阿里云短信、腾讯云短信等
  // 示例代码
  const smsData = {
    phone: notification.user_profiles?.phone,
    message: notification.content
  };

  // 实际发送逻辑需要调用外部短信服务
  // const response = await fetch('SMS_SERVICE_URL', { ... });
  
  return { success: true, messageId: 'mock_message_id' };
}

async function sendSystemNotification(supabase: any, notification: any) {
  // 系统通知直接更新状态，不需要外部服务
  return { success: true };
}
```

## 5. 统计分析模块

### 5.1 功能概述
- 党员参会率统计
- 会议类型统计
- 组织维度分析
- 可视化图表展示

### 5.2 前端实现

#### 统计数据看板
```tsx
// src/components/statistics/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthProvider';

interface AttendanceStats {
  total_meetings: number;
  total_attendees: number;
  average_attendance_rate: number;
  on_time_rate: number;
  monthly_data: any[];
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { profile } = useAuth();

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, profile]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 使用Edge Function计算统计数据
      const { data, error } = await supabase.functions.invoke('statistics-calculator', {
        body: {
          orgId: profile?.org_id,
          dateRange: dateRange,
          type: 'attendance_overview'
        }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('statistics-export', {
        body: {
          orgId: profile?.org_id,
          dateRange: dateRange,
          format: 'excel'
        }
      });

      if (error) throw error;

      // 下载文件
      const url = data.url;
      const link = document.createElement('a');
      link.href = url;
      link.download = `会议统计报告_${dateRange.start}_${dateRange.end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('导出报告失败:', error);
      alert('导出报告失败');
    }
  };

  if (loading) {
    return <div className="loading">加载统计数据中...</div>;
  }

  if (!stats) {
    return <div className="error">无法加载统计数据</div>;
  }

  return (
    <div className="statistics-dashboard">
      <div className="dashboard-header">
        <h2>统计分析</h2>
        <div className="date-range-picker">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
          <span>至</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
          <button onClick={fetchStatistics}>查询</button>
          <button onClick={exportReport} className="export-btn">导出报告</button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>总会议数</h3>
          <div className="stat-value">{stats.total_meetings}</div>
        </div>
        <div className="stat-card">
          <h3>总参与人次</h3>
          <div className="stat-value">{stats.total_attendees}</div>
        </div>
        <div className="stat-card">
          <h3>平均参会率</h3>
          <div className="stat-value">{stats.average_attendance_rate.toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <h3>准时率</h3>
          <div className="stat-value">{stats.on_time_rate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="charts-section">
        <h3>月度参会趋势</h3>
        <div className="chart-container">
          {/* 这里可以集成Chart.js或Recharts进行图表展示 */}
          <div className="chart-placeholder">
            <p>图表将在这里显示</p>
          </div>
        </div>
      </div>

      <div className="data-table">
        <h3>详细数据</h3>
        <table>
          <thead>
            <tr>
              <th>月份</th>
              <th>会议数</th>
              <th>参与人次</th>
              <th>参会率</th>
              <th>准时率</th>
            </tr>
          </thead>
          <tbody>
            {stats.monthly_data?.map((item, index) => (
              <tr key={index}>
                <td>{item.month}</td>
                <td>{item.meetings}</td>
                <td>{item.attendees}</td>
                <td>{item.attendance_rate}%</td>
                <td>{item.on_time_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 5.3 Edge Functions实现

#### 统计数据计算函数
```typescript
// supabase/functions/statistics-calculator/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { orgId, dateRange, type } = await req.json();

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let result;

    switch (type) {
      case 'attendance_overview':
        result = await calculateAttendanceOverview(supabase, orgId, dateRange);
        break;
      case 'monthly_trends':
        result = await calculateMonthlyTrends(supabase, orgId, dateRange);
        break;
      case 'meeting_type_stats':
        result = await calculateMeetingTypeStats(supabase, orgId, dateRange);
        break;
      default:
        throw new Error('Unknown statistics type');
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function calculateAttendanceOverview(supabase: any, orgId: string, dateRange: any) {
  // 获取会议统计
  const { data: meetingStats } = await supabase
    .from('meetings')
    .select('id, type_code, attendance_rate, actual_attendees, created_at')
    .eq('org_id', orgId)
    .gte('meeting_date', dateRange.start)
    .lte('meeting_date', dateRange.end)
    .eq('is_deleted', false);

  if (!meetingStats) {
    return {
      total_meetings: 0,
      total_attendees: 0,
      average_attendance_rate: 0,
      on_time_rate: 0,
      monthly_data: []
    };
  }

  // 获取参与者统计
  const { data: participantStats } = await supabase
    .from('meeting_participants')
    .select('checkin_status, created_at')
    .in('meeting_id', meetingStats.map(m => m.id))
    .eq('is_deleted', false);

  const total_meetings = meetingStats.length;
  const total_attendees = meetingStats.reduce((sum, m) => sum + (m.actual_attendees || 0), 0);
  const average_attendance_rate = meetingStats.length > 0 
    ? meetingStats.reduce((sum, m) => sum + (m.attendance_rate || 0), 0) / meetingStats.length 
    : 0;

  // 计算准时率
  const on_time_participants = participantStats?.filter(p => p.checkin_status === 'present').length || 0;
  const total_participants = participantStats?.length || 0;
  const on_time_rate = total_participants > 0 ? (on_time_participants / total_participants) * 100 : 0;

  // 按月统计
  const monthlyData = calculateMonthlyData(meetingStats, participantStats);

  return {
    total_meetings,
    total_attendees,
    average_attendance_rate: Math.round(average_attendance_rate * 100) / 100,
    on_time_rate: Math.round(on_time_rate * 100) / 100,
    monthly_data: monthlyData
  };
}

function calculateMonthlyData(meetingStats: any[], participantStats: any[]) {
  const monthlyMap = new Map();

  meetingStats.forEach(meeting => {
    const month = new Date(meeting.created_at).toISOString().slice(0, 7); // YYYY-MM
    
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, {
        month,
        meetings: 0,
        attendees: 0,
        total_attendance_rate: 0,
        attendance_count: 0,
        on_time_count: 0,
        total_count: 0
      });
    }

    const monthData = monthlyMap.get(month);
    monthData.meetings++;
    monthData.attendees += meeting.actual_attendees || 0;
    if (meeting.attendance_rate) {
      monthData.total_attendance_rate += meeting.attendance_rate;
      monthData.attendance_count++;
    }
  });

  participantStats?.forEach(participant => {
    const month = new Date(participant.created_at).toISOString().slice(0, 7);
    
    if (monthlyMap.has(month)) {
      const monthData = monthlyMap.get(month);
      monthData.total_count++;
      if (participant.checkin_status === 'present') {
        monthData.on_time_count++;
      }
    }
  });

  return Array.from(monthlyMap.values()).map(monthData => ({
    month: monthData.month,
    meetings: monthData.meetings,
    attendees: monthData.attendees,
    attendance_rate: monthData.attendance_count > 0 
      ? Math.round((monthData.total_attendance_rate / monthData.attendance_count) * 100) / 100
      : 0,
    on_time_rate: monthData.total_count > 0 
      ? Math.round((monthData.on_time_count / monthData.total_count) * 100) / 100
      : 0
  }));
}

async function calculateMonthlyTrends(supabase: any, orgId: string, dateRange: any) {
  // 月度趋势分析逻辑
  return await calculateAttendanceOverview(supabase, orgId, dateRange);
}

async function calculateMeetingTypeStats(supabase: any, orgId: string, dateRange: any) {
  // 按会议类型统计
  const { data: meetingStats } = await supabase
    .from('meetings')
    .select('type_code, attendance_rate, actual_attendees')
    .eq('org_id', orgId)
    .gte('meeting_date', dateRange.start)
    .lte('meeting_date', dateRange.end)
    .eq('is_deleted', false);

  const typeStats = new Map();

  meetingStats?.forEach(meeting => {
    if (!typeStats.has(meeting.type_code)) {
      typeStats.set(meeting.type_code, {
        type_code: meeting.type_code,
        meeting_count: 0,
        total_attendees: 0,
        total_attendance_rate: 0,
        attendance_count: 0
      });
    }

    const typeData = typeStats.get(meeting.type_code);
    typeData.meeting_count++;
    typeData.total_attendees += meeting.actual_attendees || 0;
    if (meeting.attendance_rate) {
      typeData.total_attendance_rate += meeting.attendance_rate;
      typeData.attendance_count++;
    }
  });

  return Array.from(typeStats.values()).map(typeData => ({
    ...typeData,
    average_attendance_rate: typeData.attendance_count > 0 
      ? Math.round((typeData.total_attendance_rate / typeData.attendance_count) * 100) / 100 
      : 0
  }));
}
```

## 6. 系统管理模块

### 6.1 功能概述
- 系统配置管理
- 操作日志查看
- 数据备份管理
- 性能监控

### 6.2 系统配置管理
```tsx
// src/components/admin/SystemConfig.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Config {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  description: string;
  is_public: boolean;
  category: string;
}

export function SystemConfig() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [newConfig, setNewConfig] = useState({
    config_key: '',
    config_value: '',
    config_type: 'string',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('*')
        .eq('is_deleted', false)
        .order('category, sort_order');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('获取配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!editingConfig) return;

    try {
      const { error } = await supabase
        .from('system_configs')
        .update({
          config_value: editingConfig.config_value,
          description: editingConfig.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingConfig.id);

      if (error) throw error;

      // 更新本地状态
      setConfigs(prev =>
        prev.map(c => 
          c.id === editingConfig.id 
            ? { ...c, config_value: editingConfig.config_value, description: editingConfig.description }
            : c
        )
      );

      setEditingConfig(null);
      alert('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const createConfig = async () => {
    try {
      const { error } = await supabase
        .from('system_configs')
        .insert({
          ...newConfig,
          is_public: false,
          sort_order: 0
        });

      if (error) throw error;

      // 刷新配置列表
      fetchConfigs();
      
      // 重置表单
      setNewConfig({
        config_key: '',
        config_value: '',
        config_type: 'string',
        description: '',
        category: 'general'
      });

      alert('配置创建成功');
    } catch (error) {
      console.error('创建配置失败:', error);
      alert('创建失败: ' + error.message);
    }
  };

  const groupedConfigs = configs.reduce((groups, config) => {
    const category = config.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(config);
    return groups;
  }, {} as Record<string, Config[]>);

  return (
    <div className="system-config">
      <h2>系统配置管理</h2>

      <div className="create-config-section">
        <h3>创建新配置</h3>
        <div className="config-form">
          <input
            type="text"
            placeholder="配置键名"
            value={newConfig.config_key}
            onChange={(e) => setNewConfig({...newConfig, config_key: e.target.value})}
          />
          <select
            value={newConfig.config_type}
            onChange={(e) => setNewConfig({...newConfig, config_type: e.target.value})}
          >
            <option value="string">字符串</option>
            <option value="number">数字</option>
            <option value="boolean">布尔值</option>
            <option value="json">JSON</option>
          </select>
          <select
            value={newConfig.category}
            onChange={(e) => setNewConfig({...newConfig, category: e.target.value})}
          >
            <option value="general">通用</option>
            <option value="notification">通知</option>
            <option value="file">文件</option>
            <option value="meeting">会议</option>
          </select>
          <textarea
            placeholder="配置值"
            value={newConfig.config_value}
            onChange={(e) => setNewConfig({...newConfig, config_value: e.target.value})}
            rows={3}
          />
          <input
            type="text"
            placeholder="描述"
            value={newConfig.description}
            onChange={(e) => setNewConfig({...newConfig, description: e.target.value})}
          />
          <button onClick={createConfig}>创建配置</button>
        </div>
      </div>

      {loading ? (
        <div>加载配置中...</div>
      ) : (
        <div className="config-groups">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            <div key={category} className="config-group">
              <h3>{category}</h3>
              <table>
                <thead>
                  <tr>
                    <th>配置键</th>
                    <th>配置值</th>
                    <th>类型</th>
                    <th>描述</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryConfigs.map(config => (
                    <tr key={config.id}>
                      <td>{config.config_key}</td>
                      <td>
                        {editingConfig?.id === config.id ? (
                          <input
                            type="text"
                            value={editingConfig.config_value}
                            onChange={(e) => setEditingConfig({
                              ...editingConfig,
                              config_value: e.target.value
                            })}
                          />
                        ) : (
                          <code>{config.config_value}</code>
                        )}
                      </td>
                      <td>{config.config_type}</td>
                      <td>
                        {editingConfig?.id === config.id ? (
                          <input
                            type="text"
                            value={editingConfig.description}
                            onChange={(e) => setEditingConfig({
                              ...editingConfig,
                              description: e.target.value
                            })}
                          />
                        ) : (
                          config.description
                        )}
                      </td>
                      <td>
                        {editingConfig?.id === config.id ? (
                          <>
                            <button onClick={saveConfig}>保存</button>
                            <button onClick={() => setEditingConfig(null)}>取消</button>
                          </>
                        ) : (
                          <button onClick={() => setEditingConfig(config)}>
                            编辑
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 7. 实时更新和WebSocket

### 7.1 实时订阅配置
```tsx
// src/hooks/useRealtime.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

export function useRealtime() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 订阅会议更新
    const meetingChannel = supabase
      .channel('meetings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `organizer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('会议更新:', payload);
          // 处理会议更新
        }
      )
      .subscribe();

    // 订阅参会状态更新
    const attendanceChannel = supabase
      .channel('attendance')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_participants',
          filter: `participant_id=eq.${user.id}`
        },
        (payload) => {
          console.log('参会状态更新:', payload);
          // 处理参会状态更新
        }
      )
      .subscribe();

    // 订阅通知
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('新通知:', payload.new);
          // 显示通知提醒
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(meetingChannel);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [user]);
}
```

## 8. 错误处理和用户体验

### 8.1 全局错误处理
```tsx
// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>抱歉，出现了一些问题</h2>
          <p>请刷新页面或联系管理员</p>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 9. 性能优化

### 9.1 懒加载和代码分割
```tsx
// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// 懒加载组件
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MeetingList = React.lazy(() => import('./components/meetings/MeetingList'));
const MeetingCreate = React.lazy(() => import('./components/meetings/MeetingCreate'));
const StatisticsDashboard = React.lazy(() => import('./components/statistics/Dashboard'));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="/meetings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <MeetingList />
                </Suspense>
              } />
              <Route path="/meetings/create" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <MeetingCreate />
                </Suspense>
              } />
              <Route path="/statistics" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <StatisticsDashboard />
                </Suspense>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

## 10. 测试策略

### 10.1 组件测试
```tsx
// src/components/__tests__/MeetingList.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeetingList } from '../meetings/MeetingList';
import { SupabaseTestProvider } from '@/test/SupabaseTestProvider';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [
            {
              id: '1',
              title: '支委会会议',
              type_code: 'branch_meeting',
              meeting_date: '2024-01-15T10:00:00Z',
              status: 'published'
            }
          ]
        }))
      }))
    }))
  }
}));

describe('MeetingList', () => {
  it('渲染会议列表', async () => {
    render(
      <SupabaseTestProvider>
        <MeetingList />
      </SupabaseTestProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('支委会会议')).toBeInTheDocument();
    });
  });

  it('可以过滤会议类型', async () => {
    render(
      <SupabaseTestProvider>
        <MeetingList />
      </SupabaseTestProvider>
    );

    const typeFilter = screen.getByLabelText(/会议类型/i);
    fireEvent.change(typeFilter, { target: { value: 'branch_meeting' } });

    await waitFor(() => {
      expect(screen.getByText('支委会会议')).toBeInTheDocument();
    });
  });
});
```

## 11. 部署和运维

### 11.1 Docker配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 11.2 环境变量配置
```env
# .env.production
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_ENVIRONMENT=production
REACT_APP_API_BASE_URL=https://api.yourapp.com
```

## 总结

本功能模块详细设计文档涵盖了党组织生活会议管理系统的所有核心功能：

1. **用户认证与权限管理**：基于Supabase Auth的双角色系统
2. **三会一课管理**：完整的会议生命周期管理
3. **文件上传管理**：安全的文件存储和版本管理
4. **通知提醒模块**：多渠道通知系统
5. **统计分析模块**：多维度数据分析
6. **系统管理模块**：配置管理和监控

主要特点：
- 遵循Supabase最佳实践
- 安全的权限控制（RLS策略）
- 实时数据同步
- 完善的错误处理
- 性能优化和用户体验
- 完整的测试策略

该设计为党组织生活会议管理系统提供了完整的功能实现方案，确保系统的安全性、可用性和可扩展性。