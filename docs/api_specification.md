# 党组织生活会议管理系统API接口规范

## 概述

本文档定义了党组织生活会议管理系统的完整API接口规范，采用RESTful API设计风格，基于Supabase平台实现。接口支持用户管理、会议管理、文件管理、通知提醒和统计分析等核心功能。

## API设计原则

### 1. 设计规范
- **RESTful架构**：遵循REST设计原则
- **统一响应格式**：所有API返回统一的数据结构
- **标准化错误处理**：统一的错误码和错误信息
- **版本管理**：支持API版本控制
- **安全认证**：基于JWT的认证授权机制

### 2. 技术标准
- **HTTP方法**：GET(查询)、POST(创建)、PUT(更新)、DELETE(删除)、PATCH(部分更新)
- **数据格式**：JSON格式
- **字符编码**：UTF-8
- **时间格式**：ISO 8601标准 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **分页标准**：基于limit和offset参数

### 3. 认证机制
- **认证方式**：Bearer Token (JWT)
- **令牌格式**：Authorization: Bearer <token>
- **有效期管理**：令牌过期处理和自动刷新
- **权限验证**：基于角色的访问控制(RBAC)

## 通用响应格式

### 1. 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据内容
  },
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req_123456789"
}
```

### 2. 错误响应
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "请求参数错误",
    "details": {
      "field": "email",
      "issue": "邮箱格式不正确"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request_id": "req_123456789"
}
```

### 3. 分页响应
```json
{
  "success": true,
  "data": [
    // 数据数组
  ],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "total_pages": 50,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 错误码定义

### 1. 认证相关错误码 (1000-1099)
| 错误码 | HTTP状态 | 说明 |
|-------|---------|------|
| 1001 | 401 | 未认证，需要登录 |
| 1002 | 401 | Token无效或已过期 |
| 1003 | 403 | 权限不足 |
| 1004 | 401 | 刷新令牌失败 |
| 1005 | 400 | 登录参数错误 |

### 2. 请求验证错误码 (1100-1199)
| 错误码 | HTTP状态 | 说明 |
|-------|---------|------|
| 1101 | 400 | 请求参数缺失 |
| 1102 | 400 | 请求参数格式错误 |
| 1103 | 400 | 请求参数值无效 |
| 1104 | 413 | 请求数据过大 |
| 1105 | 429 | 请求频率过高 |

### 3. 业务逻辑错误码 (1200-1299)
| 错误码 | HTTP状态 | 说明 |
|-------|---------|------|
| 1201 | 404 | 资源不存在 |
| 1202 | 409 | 资源冲突 |
| 1203 | 422 | 业务逻辑验证失败 |
| 1204 | 400 | 操作不支持 |
| 1205 | 503 | 服务暂不可用 |

### 4. 系统错误码 (1300-1399)
| 错误码 | HTTP状态 | 说明 |
|-------|---------|------|
| 1301 | 500 | 服务器内部错误 |
| 1302 | 503 | 服务暂时不可用 |
| 1303 | 502 | 网关错误 |
| 1304 | 504 | 请求超时 |
| 1305 | 500 | 数据库操作失败 |

## 1. 认证相关API

### 1.1 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember_me": false
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "user_123456",
      "email": "user@example.com",
      "full_name": "张三",
      "role": "member",
      "org_id": "org_789012",
      "avatar_url": "https://example.com/avatar.jpg"
    }
  }
}
```

### 1.2 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "full_name": "李四",
  "phone": "13800138000",
  "org_id": "org_789012",
  "employee_id": "EMP001"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "message": "注册成功，请检查邮箱验证邮件",
    "user_id": "user_987654"
  }
}
```

### 1.3 刷新令牌
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.4 用户登出
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

### 1.5 获取当前用户信息
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## 2. 用户管理API

### 2.1 获取用户列表
```http
GET /api/v1/users?page=1&limit=20&role=member&status=active&org_id=org_789012
Authorization: Bearer <access_token>
```

**查询参数：**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `role`: 用户角色筛选 (member, admin)
- `status`: 用户状态筛选 (active, inactive, suspended)
- `org_id`: 组织ID筛选
- `search`: 搜索关键词 (姓名、邮箱、员工编号)

### 2.2 获取用户详情
```http
GET /api/v1/users/{user_id}
Authorization: Bearer <access_token>
```

### 2.3 更新用户信息
```http
PUT /api/v1/users/{user_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "王五",
  "phone": "13900139000",
  "position": "党支部书记",
  "party_branch": "第一党支部"
}
```

### 2.4 删除用户
```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer <access_token>
```

### 2.5 更新用户角色
```http
PUT /api/v1/users/{user_id}/role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

## 3. 会议管理API

### 3.1 获取会议列表
```http
GET /api/v1/meetings?page=1&limit=20&type=branch_meeting&status=published&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <access_token>
```

**查询参数：**
- `page`: 页码
- `limit`: 每页数量
- `type`: 会议类型 (branch_meeting, member_meeting, group_meeting, party_lecture)
- `status`: 会议状态 (draft, published, ongoing, completed, cancelled)
- `date_from`: 开始日期 (YYYY-MM-DD)
- `date_to`: 结束日期 (YYYY-MM-DD)
- `org_id`: 组织筛选
- `search`: 搜索关键词

### 3.2 获取会议详情
```http
GET /api/v1/meetings/{meeting_id}
Authorization: Bearer <access_token>
```

### 3.3 创建会议
```http
POST /api/v1/meetings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "第一季度工作总结会议",
  "type_code": "branch_meeting",
  "meeting_date": "2024-01-20T14:00:00Z",
  "location": "党委会议室",
  "content": "总结第一季度工作成果，规划第二季度工作重点",
  "min_attendees": 5,
  "max_attendees": 20,
  "agenda": [
    {
      "time": "14:00",
      "item": "签到",
      "presenter": "会议组织者"
    },
    {
      "time": "14:10",
      "item": "第一季度工作总结",
      "presenter": "书记"
    }
  ],
  "participants": [
    {
      "user_id": "user_123456",
      "role": "required"
    }
  ]
}
```

### 3.4 更新会议
```http
PUT /api/v1/meetings/{meeting_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "第一季度工作总结会议（修订版）",
  "meeting_date": "2024-01-20T15:00:00Z",
  "location": "党委会议室A",
  "status": "published"
}
```

### 3.5 发布会议
```http
POST /api/v1/meetings/{meeting_id}/publish
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_123456",
    "status": "published",
    "participant_count": 15,
    "notifications_sent": 15,
    "message": "会议已发布，参与者已收到通知"
  }
}
```

### 3.6 取消会议
```http
POST /api/v1/meetings/{meeting_id}/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "cancel_reason": "重要领导临时有急事",
  "notify_participants": true
}
```

### 3.7 获取会议参与者列表
```http
GET /api/v1/meetings/{meeting_id}/participants?status=confirmed&checkin_status=present
Authorization: Bearer <access_token>
```

### 3.8 参会报名
```http
POST /api/v1/meetings/{meeting_id}/participants
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rsvp_status": "confirmed",
  "notes": "按时参加"
}
```

### 3.9 会议签到
```http
POST /api/v1/meetings/{meeting_id}/checkin
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "checkin_method": "qr_code",
  "location": "党委会议室",
  "device_info": "iPhone 14 Pro"
}
```

### 3.10 获取会议统计
```http
GET /api/v1/meetings/{meeting_id}/statistics
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_123456",
    "total_participants": 20,
    "confirmed_participants": 18,
    "checked_in_participants": 16,
    "late_participants": 2,
    "absent_participants": 4,
    "attendance_rate": 80.0,
    "on_time_rate": 70.0,
    "statistics_updated_at": "2024-01-20T16:30:00Z"
  }
}
```

## 4. 文件管理API

### 4.1 获取文件列表
```http
GET /api/v1/files?page=1&limit=20&related_type=meeting&file_category=meeting_material&mime_type=image/jpeg
Authorization: Bearer <access_token>
```

### 4.2 上传文件
```http
POST /api/v1/files/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: (binary data)
file_category: meeting_material
related_id: meeting_123456
related_type: meeting
description: 会议现场照片
```

### 4.3 获取文件详情
```http
GET /api/v1/files/{file_id}
Authorization: Bearer <access_token>
```

### 4.4 下载文件
```http
GET /api/v1/files/{file_id}/download
Authorization: Bearer <access_token>
```

### 4.5 更新文件信息
```http
PUT /api/v1/files/{file_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "description": "会议现场照片 - 重要发言",
  "tags": ["会议", "照片", "重要"],
  "file_category": "meeting_material"
}
```

### 4.6 删除文件
```http
DELETE /api/v1/files/{file_id}
Authorization: Bearer <access_token>
```

### 4.7 创建文件版本
```http
POST /api/v1/files/{file_id}/versions
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: (binary data)
description: 文件版本更新说明
```

## 5. 通知提醒API

### 5.1 获取通知列表
```http
GET /api/v1/notifications?page=1&limit=20&status=unread&type=meeting
Authorization: Bearer <access_token>
```

### 5.2 获取通知详情
```http
GET /api/v1/notifications/{notification_id}
Authorization: Bearer <access_token>
```

### 5.3 标记通知为已读
```http
POST /api/v1/notifications/{notification_id}/read
Authorization: Bearer <access_token>
```

### 5.4 标记所有通知为已读
```http
POST /api/v1/notifications/read-all
Authorization: Bearer <access_token>
```

### 5.5 发送会议通知
```http
POST /api/v1/notifications/meeting
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "meeting_id": "meeting_123456",
  "notification_type": "reminder",
  "recipient_ids": ["user_123456", "user_789012"],
  "template_id": "meeting_reminder_24h",
  "custom_content": "明天14:00召开会议，请准时参加",
  "send_time": "2024-01-19T10:00:00Z"
}
```

### 5.6 获取通知模板列表
```http
GET /api/v1/notification-templates?type=meeting&is_active=true
Authorization: Bearer <access_token>
```

### 5.7 创建通知模板
```http
POST /api/v1/notification-templates
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "meeting_invitation_custom",
  "name": "自定义会议邀请",
  "type": "system",
  "subject": "会议邀请：{{meeting_title}}",
  "content": "您被邀请参加{{meeting_title}}，时间：{{meeting_date}}，地点：{{location}}",
  "variables": {
    "meeting_title": "会议标题",
    "meeting_date": "会议时间",
    "location": "会议地点"
  }
}
```

## 6. 统计分析API

### 6.1 获取会议统计概览
```http
GET /api/v1/statistics/meetings?period=monthly&date_from=2024-01-01&date_to=2024-01-31&org_id=org_789012
Authorization: Bearer <access_token>
```

**查询参数：**
- `period`: 统计周期 (daily, weekly, monthly, quarterly, yearly)
- `date_from`: 开始日期
- `date_to`: 结束日期
- `org_id`: 组织筛选
- `type`: 会议类型筛选

**响应示例：**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "date_range": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "summary": {
      "total_meetings": 12,
      "total_attendees": 180,
      "average_attendance_rate": 75.5,
      "on_time_rate": 68.3
    },
    "monthly_data": [
      {
        "month": "2024-01",
        "meetings": 12,
        "attendees": 180,
        "attendance_rate": 75.5,
        "on_time_rate": 68.3
      }
    ],
    "type_breakdown": [
      {
        "type_code": "branch_meeting",
        "meeting_count": 8,
        "average_attendance_rate": 82.1
      },
      {
        "type_code": "member_meeting", 
        "meeting_count": 4,
        "average_attendance_rate": 68.9
      }
    ]
  }
}
```

### 6.2 获取参会率趋势分析
```http
GET /api/v1/statistics/attendance-trends?period=monthly&months=12&org_id=org_789012&type=branch_meeting
Authorization: Bearer <access_token>
```

### 6.3 获取组织参会率排名
```http
GET /api/v1/statistics/organization-ranking?period=monthly&date_from=2024-01-01&date_to=2024-01-31&limit=10
Authorization: Bearer <access_token>
```

### 6.4 获取个人参会记录
```http
GET /api/v1/statistics/personal-attendance?user_id=user_123456&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <access_token>
```

### 6.5 获取会议类型统计
```http
GET /api/v1/statistics/meeting-types?period=yearly&year=2024
Authorization: Bearer <access_token>
```

### 6.6 导出统计数据
```http
GET /api/v1/statistics/export?type=attendance&format=excel&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <access_token>
```

### 6.7 生成统计报告
```http
POST /api/v1/statistics/reports/generate
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "report_type": "monthly_attendance",
  "period": "monthly",
  "date_from": "2024-01-01",
  "date_to": "2024-01-31",
  "org_ids": ["org_789012", "org_345678"],
  "include_details": true,
  "format": "pdf"
}
```

## 7. 系统管理API

### 7.1 获取系统配置
```http
GET /api/v1/system/config?category=notification&is_public=true
Authorization: Bearer <access_token>
```

### 7.2 更新系统配置
```http
PUT /api/v1/system/config/{config_key}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "config_value": "0.85",
  "description": "默认最低参会率要求调整"
}
```

### 7.3 获取操作日志
```http
GET /api/v1/system/logs?page=1&limit=20&user_id=user_123456&action=CREATE_MEETING&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <access_token>
```

### 7.4 获取系统统计
```http
GET /api/v1/system/stats
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 145,
      "admins": 5,
      "new_this_month": 8
    },
    "meetings": {
      "total": 500,
      "this_month": 45,
      "completed": 420,
      "cancelled": 15
    },
    "files": {
      "total": 1200,
      "total_size_mb": 2500,
      "uploads_this_week": 85
    },
    "notifications": {
      "total_sent": 3000,
      "success_rate": 98.5,
      "this_week": 120
    }
  }
}
```

## 8. Edge Functions API

### 8.1 文件上传函数
```http
POST /functions/v1/file-upload
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fileData": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "fileName": "meeting_photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "relatedId": "meeting_123456",
  "relatedType": "meeting",
  "description": "会议现场照片"
}
```

### 8.2 会议统计计算函数
```http
POST /functions/v1/meeting-statistics
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "meetingId": "meeting_123456",
  "action": "calculate_attendance"
}
```

### 8.3 通知发送函数
```http
POST /functions/v1/notification-sender
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "send_batch",
  "notificationIds": ["notif_123", "notif_456"]
}
```

### 8.4 统计数据计算函数
```http
POST /functions/v1/statistics-calculator
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "orgId": "org_789012",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "type": "attendance_overview"
}
```

## 9. 搜索功能API

### 9.1 全文搜索
```http
GET /api/v1/search?q=工作总结&type=meetings&page=1&limit=20&date_from=2024-01-01&date_to=2024-01-31
Authorization: Bearer <access_token>
```

**查询参数：**
- `q`: 搜索关键词
- `type`: 搜索类型 (meetings, files, users, all)
- `page`: 页码
- `limit`: 每页数量
- `date_from`: 开始日期
- `date_to`: 结束日期
- `org_id`: 组织筛选

### 9.2 高级搜索
```http
POST /api/v1/search/advanced
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "meetings",
  "filters": {
    "title": "工作总结",
    "type_code": ["branch_meeting", "member_meeting"],
    "status": ["published", "completed"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "org_id": "org_789012",
    "min_attendance_rate": 80
  },
  "sort": {
    "field": "meeting_date",
    "order": "desc"
  },
  "page": 1,
  "limit": 20
}
```

## 10. 批量操作API

### 10.1 批量更新会议状态
```http
PUT /api/v1/meetings/batch/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "meeting_ids": ["meeting_123", "meeting_456", "meeting_789"],
  "status": "completed",
  "notes": "批量标记为已完成"
}
```

### 10.2 批量发送通知
```http
POST /api/v1/notifications/batch
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "template_id": "meeting_reminder",
  "recipient_filters": {
    "org_id": "org_789012",
    "role": "member",
    "status": "active"
  },
  "meeting_id": "meeting_123456",
  "variables": {
    "meeting_date": "2024-01-20T14:00:00Z",
    "location": "党委会议室"
  },
  "send_time": "2024-01-19T10:00:00Z"
}
```

### 10.3 批量导出数据
```http
POST /api/v1/export/batch
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "meetings",
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "org_id": "org_789012"
  },
  "format": "excel",
  "include_statistics": true,
  "include_participants": true
}
```

## 11. 实时功能API

### 11.1 WebSocket连接
```javascript
// 连接WebSocket
const ws = new WebSocket('wss://api.yourapp.com/ws?token=' + accessToken);

// 订阅会议更新
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'meetings',
  filters: { org_id: 'org_789012' }
}));

// 监听消息
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  
  switch(message.type) {
    case 'meeting.created':
      // 处理新会议创建
      break;
    case 'meeting.updated':
      // 处理会议更新
      break;
    case 'notification.new':
      // 处理新通知
      break;
    case 'attendance.changed':
      // 处理参会状态变更
      break;
  }
};
```

### 11.2 订阅管理
```http
POST /api/v1/subscriptions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "channel": "meetings",
  "filters": {
    "org_id": "org_789012"
  },
  "event_types": ["created", "updated", "cancelled"]
}
```

## 12. API版本管理

### 12.1 版本策略
- 当前版本：v1
- 版本格式：/api/v{version}/...
- 向前兼容：至少保留2个主版本
- 废弃通知：提前6个月通知

### 12.2 版本协商
```http
# 通过Accept头指定版本
Accept: application/vnd.party.v1+json

# 通过URL路径指定版本
GET /api/v1/meetings

# 通过查询参数指定版本
GET /api/meetings?api_version=v1
```

## 13. API限制和配额

### 13.1 频率限制
| 用户类型 | 每分钟请求数 | 每小时请求数 | 每日请求数 |
|---------|-------------|-------------|-----------|
| 普通用户 | 60 | 1000 | 10000 |
| 管理员 | 120 | 2000 | 50000 |
| 系统API | 1000 | 50000 | 1000000 |

### 13.2 数据限制
- 文件上传：最大50MB
- 批量操作：最多1000条记录
- 搜索结果：最多10000条
- 分页限制：最大100条/页

### 13.3 响应头信息
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642245600
X-Request-ID: req_123456789
X-Response-Time: 125ms
```

## 14. 测试和调试

### 14.1 API测试工具配置
```javascript
// Postman Collection配置
const baseURL = 'https://api.yourapp.com/api/v1';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {{access_token}}'
};

// 环境变量
{
  "base_url": "https://api.yourapp.com/api/v1",
  "access_token": "{{auth_token}}",
  "org_id": "org_789012",
  "user_id": "user_123456"
}
```

### 14.2 测试用例示例
```javascript
// 自动化测试脚本示例
describe('会议管理API测试', () => {
  test('应该能够创建会议', async () => {
    const response = await fetch('/api/v1/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '测试会议',
        type_code: 'branch_meeting',
        meeting_date: '2024-01-20T14:00:00Z',
        location: '测试会议室'
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('测试会议');
  });
});
```

### 14.3 调试工具
- **Supabase Dashboard**: 数据库和认证管理
- **Network Tab**: 查看网络请求和响应
- **Console Logs**: Edge Functions日志查看
- **API文档**: 自动生成的接口文档

## 15. 部署和运维

### 15.1 环境配置
```javascript
// 环境变量配置
const config = {
  development: {
    apiUrl: 'http://localhost:54321',
    supabaseUrl: 'http://localhost:54321',
    enableLogging: true
  },
  staging: {
    apiUrl: 'https://staging-api.yourapp.com',
    supabaseUrl: 'https://staging-project.supabase.co',
    enableLogging: true
  },
  production: {
    apiUrl: 'https://api.yourapp.com',
    supabaseUrl: 'https://project.supabase.co',
    enableLogging: false
  }
};
```

### 15.2 监控和告警
- **API响应时间监控**
- **错误率监控**
- **用户访问量监控**
- **系统资源使用监控**

### 15.3 备份和恢复
- **数据自动备份**: 每日备份，保留30天
- **API日志归档**: 按月归档，保留1年
- **配置备份**: 重要配置版本化管理

## 总结

本API接口规范为党组织生活会议管理系统提供了完整的技术接口标准：

### 核心特性
- **RESTful设计**: 遵循REST设计原则，易于理解和使用
- **统一响应格式**: 标准的成功/错误/分页响应格式
- **安全认证**: 基于JWT的认证授权机制
- **错误处理**: 详细的错误码定义和错误信息
- **版本管理**: 支持API版本控制和向前兼容

### 功能覆盖
- **认证管理**: 登录、注册、令牌管理
- **用户管理**: 用户CRUD、角色管理
- **会议管理**: 完整的会议生命周期管理
- **文件管理**: 文件上传、下载、版本管理
- **通知提醒**: 模板管理、批量发送
- **统计分析**: 多维度数据分析和报告生成
- **系统管理**: 配置管理、日志查看

### 技术优势
- **高性能**: 基于Supabase的全球CDN网络
- **高可用**: 99.99%服务可用性保证
- **可扩展**: 支持水平扩展和自动扩容
- **安全性**: 内置安全认证和权限控制

该API规范为前端开发、第三方集成和系统维护提供了完整的技术标准，确保系统的可维护性和可扩展性。