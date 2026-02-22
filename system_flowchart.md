# 党组织生活会议管理系统 - 系统架构流程图

## 整体架构流程图

```mermaid
flowchart TB
    subgraph 客户端层["客户端层 - React前端"]
        direction TB
        A1[PC端/移动端 Web] --> A2[登录/鉴权模块]
        A2 --> A3{角色分流}
        A3 -->|管理员| A4[管理员控制台]
        A3 -->|普通党员| A5[党员工作台]
        
        A4 --> A41[会议管理]
        A4 --> A42[人员管理]
        A4 --> A43[统计分析]
        A4 --> A44[审批中心]
        A4 --> A45[系统设置]
        
        A5 --> A51[我的会议]
        A5 --> A52[扫码签到]
        A5 --> A53[会议记录]
        A5 --> A54[资料下载]
        A5 --> A55[通知中心]
    end
    
    subgraph 服务层["服务层 - Supabase"]
        direction TB
        B1[Supabase Client<br/>REST/Realtime] --> B2[Auth Service<br/>JWT认证]
        B2 --> B3[RLS Policies<br/>行级安全]
        
        B1 --> B4[Edge Functions<br/>边缘函数]
        B4 --> B41[会议管理函数]
        B4 --> B42[文件上传函数]
        B4 --> B43[通知发送函数]
        B4 --> B44[统计分析函数]
        B4 --> B45[用户管理函数]
    end
    
    subgraph 数据层["数据层 - 存储与外部服务"]
        direction TB
        C1[PostgreSQL数据库] --> C11[users用户表]
        C1 --> C12[organizations组织表]
        C1 --> C13[meetings会议表]
        C1 --> C14[meeting_participants参会人员表]
        C1 --> C15[attendance签到记录表]
        C1 --> C16[files文件表]
        C1 --> C17[notifications通知表]
        C1 --> C18[statistics统计数据表]
        
        C2[Storage Bucket文件存储] --> C21[Images图片文件]
        C2 --> C22[PDFs文档文件]
        
        C3[外部服务] --> C31[邮件服务]
        C3 --> C32[短信服务]
    end
    
    A1 --> B1
    B1 --> C1
    B1 --> C2
    B4 --> C3
    
    B3 --> C1
    
    style 客户端层 fill:#E8F4FF,stroke:#1890FF,stroke-width:2px
    style 服务层 fill:#FFF7E6,stroke:#FA8C16,stroke-width:2px
    style 数据层 fill:#F6FFED,stroke:#52C41A,stroke-width:2px
    
    style A1 fill:#FFFFFF,stroke:#1890FF,stroke-width:2px
    style A2 fill:#FFFFFF,stroke:#1890FF,stroke-width:2px
    style A3 fill:#FFF7E6,stroke:#FA8C16,stroke-width:2px
    style A4 fill:#FFE4E1,stroke:#E60000,stroke-width:2px
    style A5 fill:#E8F4FF,stroke:#1890FF,stroke-width:2px
    
    style B1 fill:#FFFFFF,stroke:#1890FF,stroke-width:2px
    style B2 fill:#FFF7E6,stroke:#FA8C16,stroke-width:2px
    style B3 fill:#FFF7E6,stroke:#FA8C16,stroke-width:2px
    style B4 fill:#FFF7E6,stroke:#FA8C16,stroke-width:2px
    
    style C1 fill:#F6FFED,stroke:#52C41A,stroke-width:2px
    style C2 fill:#F6FFED,stroke:#52C41A,stroke-width:2px
    style C3 fill:#FFE4E1,stroke:#E60000,stroke-width:2px
```

## 核心业务流程图

### 1. 用户认证流程

```mermaid
flowchart LR
    A[用户访问系统] --> B{是否已登录}
    B -->|否| C[登录页面]
    C --> D[输入账号密码]
    D --> E[Supabase Auth验证]
    E --> F{JWT Token生成}
    F -->|成功| G[获取用户角色]
    G --> H{角色判断}
    H -->|管理员| I[进入管理员控制台]
    H -->|普通党员| J[进入党员工作台]
    B -->|是| K[直接进入对应主页]
    
    style A fill:#E8F4FF,stroke:#1890FF
    style B fill:#FFF7E6,stroke:#FA8C16
    style C fill:#FFFFFF,stroke:#1890FF
    style E fill:#FFF7E6,stroke:#FA8C16
    style G fill:#FFF7E6,stroke:#FA8C16
    style I fill:#FFE4E1,stroke:#E60000
    style J fill:#E8F4FF,stroke:#1890FF
```

### 2. 会议管理流程

```mermaid
flowchart TB
    subgraph 会议管理流程
        A[管理员创建会议] --> B[选择会议类型]
        B --> C{三会一课类型}
        C -->|支委会| D[支委会会议]
        C -->|党员大会| E[党员大会]
        C -->|党小组会| F[党小组会]
        C -->|党课| G[党课]
        
        D --> H[填写会议信息]
        E --> H
        F --> H
        G --> H
        
        H --> I[设置参会人员]
        I --> J[设置会议时间地点]
        J --> K[保存到数据库]
        K --> L[发布会议]
        L --> M[触发通知函数]
        M --> N[发送通知给党员]
        N --> O[党员收到会议通知]
    end
    
    style A fill:#FFE4E1,stroke:#E60000
    style L fill:#FFE4E1,stroke:#E60000
    style M fill:#FFF7E6,stroke:#FA8C16
    style N fill:#FFF7E6,stroke:#FA8C16
    style O fill:#E8F4FF,stroke:#1890FF
```

### 3. 会议签到流程

```mermaid
flowchart LR
    A[党员收到会议通知] --> B[查看会议详情]
    B --> C[报名参会]
    C --> D{会议时间到达}
    D --> E[扫码签到/定位签到]
    E --> F[调用签到API]
    F --> G[验证签到信息]
    G --> H{验证结果}
    H -->|成功| I[更新签到状态]
    H -->|失败| J[提示错误信息]
    I --> K[记录考勤数据]
    K --> L[计算参会率]
    
    style A fill:#E8F4FF,stroke:#1890FF
    style C fill:#E8F4FF,stroke:#1890FF
    style E fill:#E8F4FF,stroke:#1890FF
    style G fill:#FFF7E6,stroke:#FA8C16
    style I fill:#F6FFED,stroke:#52C41A
    style L fill:#F6FFED,stroke:#52C41A
```

### 4. 文件上传流程

```mermaid
flowchart TB
    A[用户选择文件] --> B{文件类型验证}
    B -->|支持| C[文件大小验证]
    B -->|不支持| D[提示错误]
    
    C --> E{大小合适}
    E -->|是| F[转换为Base64]
    E -->|否| G[提示文件过大]
    
    F --> H[调用文件上传函数]
    H --> I[Edge Function处理]
    I --> J[上传到Storage]
    J --> K[生成文件URL]
    K --> L[保存文件元数据]
    L --> M[返回上传结果]
    
    style A fill:#E8F4FF,stroke:#1890FF
    style H fill:#FFF7E6,stroke:#FA8C16
    style J fill:#F6FFED,stroke:#52C41A
    style M fill:#F6FFED,stroke:#52C41A
```

### 5. 统计分析流程

```mermaid
flowchart TB
    A[管理员进入统计页面] --> B[选择统计维度]
    B --> C{统计类型}
    C --> D[参会率统计]
    C --> E[会议类型统计]
    C --> F[组织维度分析]
    
    D --> G[调用统计函数]
    E --> G
    F --> G
    
    G --> H[查询数据库聚合]
    H --> I[生成统计数据]
    I --> J[前端渲染图表]
    J --> K[展示统计看板]
    
    style A fill:#FFE4E1,stroke:#E60000
    style G fill:#FFF7E6,stroke:#FA8C16
    style I fill:#FFF7E6,stroke:#FA8C16
    style K fill:#F6FFED,stroke:#52C41A
```

## 系统数据流图

```mermaid
flowchart LR
    subgraph 前端层
        A[React应用]
    end
    
    subgraph API层
        B[Supabase Client]
    end
    
    subgraph 服务层
        C[Auth认证服务]
        D[Edge Functions]
    end
    
    subgraph 数据层
        E[PostgreSQL]
        F[Storage]
    end
    
    subgraph 外部服务
        G[邮件服务]
        H[短信服务]
    end
    
    A -->|HTTPS请求| B
    B -->|认证| C
    B -->|数据操作| E
    B -->|文件操作| F
    D -->|发送通知| G
    D -->|发送通知| H
    
    style A fill:#E8F4FF,stroke:#1890FF
    style B fill:#FFFFFF,stroke:#1890FF
    style C fill:#FFF7E6,stroke:#FA8C16
    style D fill:#FFF7E6,stroke:#FA8C16
    style E fill:#F6FFED,stroke:#52C41A
    style F fill:#F6FFED,stroke:#52C41A
    style G fill:#FFE4E1,stroke:#E60000
    style H fill:#FFE4E1,stroke:#E60000
```

## 核心数据库表关系

```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    ORGANIZATIONS ||--o{ USERS : contains
    ORGANIZATIONS ||--o{ MEETINGS : hosts
    MEETINGS ||--o{ MEETING_PARTICIPANTS : includes
    MEETING_PARTICIPANTS ||--o{ ATTENDANCE : records
    USERS ||--o{ ATTENDANCE : has
    MEETINGS ||--o{ FILES : contains
    USERS ||--o{ NOTIFICATIONS : receives
    MEETINGS ||--o{ STATISTICS : generates
    
    USERS {
        uuid id PK
        string email
        timestamp created_at
    }
    
    USER_PROFILES {
        uuid user_id PK
        string full_name
        string role
        uuid org_id FK
    }
    
    ORGANIZATIONS {
        uuid id PK
        string name
        string type
    }
    
    MEETINGS {
        uuid id PK
        string title
        string type_code
        uuid org_id FK
        timestamp meeting_date
        string status
    }
    
    MEETING_PARTICIPANTS {
        uuid id PK
        uuid meeting_id FK
        uuid participant_id FK
        string status
    }
    
    ATTENDANCE {
        uuid id PK
        uuid participant_id FK
        uuid meeting_id FK
        timestamp checkin_time
        string checkin_status
    }
    
    FILES {
        uuid id PK
        string file_name
        string mime_type
        uuid related_id FK
    }
    
    NOTIFICATIONS {
        uuid id PK
        uuid recipient_id FK
        string title
        string status
    }
