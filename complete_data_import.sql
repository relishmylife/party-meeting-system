-- 党组织生活会议管理系统 - 完整数据导入脚本
-- 包含：30名党员 + 2名管理员 + 测试账号

-- =============================================================================
-- 第一部分：创建组织架构
-- =============================================================================

-- 插入组织架构数据
INSERT INTO organizations (
  id, 
  name, 
  code, 
  type, 
  parent_id, 
  level, 
  description, 
  status
) VALUES (
  '82060473-2317-47f7-bc7c-008b4d1432dc',
  '内蒙古科技大学学生第三支部委员会',
  'IMUST_STUDENT_3RD_BRANCH',
  'party_branch',
  NULL,
  1,
  '中共内蒙古科技大学数智产业学院学生第三支部委员会',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 第二部分：导入30名党员账号
-- =============================================================================

-- 第一批党员（13名）
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
-- 王颖
(gen_random_uuid(), '15024942562@imust.com', crypt('15024942562', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 娜仁图雅  
(gen_random_uuid(), '18748439273@imust.com', crypt('18748439273', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 马明哲
(gen_random_uuid(), '15540889736@imust.com', crypt('15540889736', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 刘晓雨
(gen_random_uuid(), '15024981142@imust.com', crypt('15024981142', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 靳秀兰
(gen_random_uuid(), '13664024369@imust.com', crypt('13664024369', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 董昊轩
(gen_random_uuid(), '15047362557@imust.com', crypt('15047362557', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 罗旭诚
(gen_random_uuid(), '18310976961@imust.com', crypt('18310976961', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 李惠娟
(gen_random_uuid(), '15504890027@imust.com', crypt('15504890027', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 张铭月
(gen_random_uuid(), '13644724291@imust.com', crypt('13644724291', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 吴浩
(gen_random_uuid(), '15848476685@imust.com', crypt('15848476685', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 范骁腾
(gen_random_uuid(), '15354885785@imust.com', crypt('15354885785', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 侯佳林
(gen_random_uuid(), '15560405231@imust.com', crypt('15560405231', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 宋欣梦
(gen_random_uuid(), '15247486647@imust.com', crypt('15247486647', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated');

-- 第二批党员（17名）
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
-- 黄凯
(gen_random_uuid(), '18647096683@imust.com', crypt('18647096683', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 李娜
(gen_random_uuid(), '13614749935@imust.com', crypt('13614749935', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 孟雨竹
(gen_random_uuid(), '15647177995@imust.com', crypt('15647177995', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 刘鑫宇
(gen_random_uuid(), '15661105424@imust.com', crypt('15661105424', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 韩青华
(gen_random_uuid(), '17552735097@imust.com', crypt('17552735097', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 师杰
(gen_random_uuid(), '13384896554@imust.com', crypt('13384896554', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 高煜东
(gen_random_uuid(), '13948433895@imust.com', crypt('13948433895', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 王来
(gen_random_uuid(), '18435224981@imust.com', crypt('18435224981', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 张惠英
(gen_random_uuid(), '13484749056@imust.com', crypt('13484749056', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 刘家旭
(gen_random_uuid(), '18697413351@imust.com', crypt('18697413351', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 傅永朋
(gen_random_uuid(), '15047445435@imust.com', crypt('15047445435', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 魏雨新
(gen_random_uuid(), '15024978540@imust.com', crypt('15024978540', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 杜政达
(gen_random_uuid(), '18686170502@imust.com', crypt('18686170502', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 金跃文
(gen_random_uuid(), '13214951334@imust.com', crypt('13214951334', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 何林娜
(gen_random_uuid(), '18847445527@imust.com', crypt('18847445527', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 邢雅波
(gen_random_uuid(), '19847730736@imust.com', crypt('19847730736', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 赵逸飞
(gen_random_uuid(), '15048430379@imust.com', crypt('15048430379', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 李文凯
(gen_random_uuid(), '15144841681@imust.com', crypt('15144841681', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 许再佳
(gen_random_uuid(), '15049309721@imust.com', crypt('15049309721', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated'),
-- 巩皓楠
(gen_random_uuid(), '15149237376@imust.com', crypt('15149237376', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, 'authenticated');

-- =============================================================================
-- 第三部分：创建2名超级管理员账号
-- =============================================================================

INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
-- 王来老师 - 超级管理员
(gen_random_uuid(), 'wang_lai@imust.com', crypt('wang_lai123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "王来", "is_super_admin": true}', true, 'authenticated'),
-- 李惠娟老师 - 超级管理员  
(gen_random_uuid(), 'li_huijuan@imust.com', crypt('li_huijuan123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "李惠娟", "is_super_admin": true}', true, 'authenticated');

-- =============================================================================
-- 第四部分：创建测试账号
-- =============================================================================

INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
-- 测试管理员账号
(gen_random_uuid(), 'admin@test.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "测试管理员", "role": "admin"}', false, 'authenticated'),
-- 测试普通用户账号
(gen_random_uuid(), 'user@test.com', crypt('user123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "测试用户", "role": "member"}', false, 'authenticated'),
-- 演示账号
(gen_random_uuid(), 'demo@test.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "演示账号", "role": "member"}', false, 'authenticated');

-- =============================================================================
-- 第五部分：创建用户档案信息
-- =============================================================================

-- 注意：这里需要先获取刚创建的用户ID，然后插入对应的档案信息
-- 由于用户ID是随机生成的，我们需要先查询用户信息，然后创建档案

-- 创建党员档案（示例几个主要党员的档案信息）
INSERT INTO user_profiles (
  user_id,
  org_id,
  full_name,
  phone,
  gender,
  join_party_date,
  party_branch,
  position,
  role,
  status
) 
SELECT 
  u.id,
  '82060473-2317-47f7-bc7c-008b4d1432dc',
  CASE 
    WHEN u.email = '15024942562@imust.com' THEN '王颖'
    WHEN u.email = '18748439273@imust.com' THEN '娜仁图雅'
    WHEN u.email = '15540889736@imust.com' THEN '马明哲'
    WHEN u.email = '15024981142@imust.com' THEN '刘晓雨'
    WHEN u.email = '13664024369@imust.com' THEN '靳秀兰'
    WHEN u.email = '15047362557@imust.com' THEN '董昊轩'
    WHEN u.email = '18310976961@imust.com' THEN '罗旭诚'
    WHEN u.email = '15504890027@imust.com' THEN '李惠娟'
    WHEN u.email = '13644724291@imust.com' THEN '张铭月'
    WHEN u.email = '15848476685@imust.com' THEN '吴浩'
    WHEN u.email = '15354885785@imust.com' THEN '范骁腾'
    WHEN u.email = '15560405231@imust.com' THEN '侯佳林'
    WHEN u.email = '15247486647@imust.com' THEN '宋欣梦'
    WHEN u.email = '18647096683@imust.com' THEN '黄凯'
    WHEN u.email = '13614749935@imust.com' THEN '李娜'
    WHEN u.email = '15647177995@imust.com' THEN '孟雨竹'
    WHEN u.email = '15661105424@imust.com' THEN '刘鑫宇'
    WHEN u.email = '17552735097@imust.com' THEN '韩青华'
    WHEN u.email = '13384896554@imust.com' THEN '师杰'
    WHEN u.email = '13948433895@imust.com' THEN '高煜东'
    WHEN u.email = '18435224981@imust.com' THEN '王来'
    WHEN u.email = '13484749056@imust.com' THEN '张惠英'
    WHEN u.email = '18697413351@imust.com' THEN '刘家旭'
    WHEN u.email = '15047445435@imust.com' THEN '傅永朋'
    WHEN u.email = '15024978540@imust.com' THEN '魏雨新'
    WHEN u.email = '18686170502@imust.com' THEN '杜政达'
    WHEN u.email = '13214951334@imust.com' THEN '金跃文'
    WHEN u.email = '18847445527@imust.com' THEN '何林娜'
    WHEN u.email = '19847730736@imust.com' THEN '邢雅波'
    WHEN u.email = '15048430379@imust.com' THEN '赵逸飞'
    WHEN u.email = '15144841681@imust.com' THEN '李文凯'
    WHEN u.email = '15049309721@imust.com' THEN '许再佳'
    WHEN u.email = '15149237376@imust.com' THEN '巩皓楠'
    WHEN u.email = 'wang_lai@imust.com' THEN '王来'
    WHEN u.email = 'li_huijuan@imust.com' THEN '李惠娟'
    WHEN u.email = 'admin@test.com' THEN '测试管理员'
    WHEN u.email = 'user@test.com' THEN '测试用户'
    WHEN u.email = 'demo@test.com' THEN '演示账号'
    ELSE '未知用户'
  END as full_name,
  CASE 
    WHEN u.email = '15024942562@imust.com' THEN '15024942562'
    WHEN u.email = '18748439273@imust.com' THEN '18748439273'
    WHEN u.email = '15540889736@imust.com' THEN '15540889736'
    WHEN u.email = '15024981142@imust.com' THEN '15024981142'
    WHEN u.email = '13664024369@imust.com' THEN '13664024369'
    WHEN u.email = '15047362557@imust.com' THEN '15047362557'
    WHEN u.email = '18310976961@imust.com' THEN '18310976961'
    WHEN u.email = '15504890027@imust.com' THEN '15504890027'
    WHEN u.email = '13644724291@imust.com' THEN '13644724291'
    WHEN u.email = '15848476685@imust.com' THEN '15848476685'
    WHEN u.email = '15354885785@imust.com' THEN '15354885785'
    WHEN u.email = '15560405231@imust.com' THEN '15560405231'
    WHEN u.email = '15247486647@imust.com' THEN '15247486647'
    WHEN u.email = '18647096683@imust.com' THEN '18647096683'
    WHEN u.email = '13614749935@imust.com' THEN '13614749935'
    WHEN u.email = '15647177995@imust.com' THEN '15647177995'
    WHEN u.email = '15661105424@imust.com' THEN '15661105424'
    WHEN u.email = '17552735097@imust.com' THEN '17552735097'
    WHEN u.email = '13384896554@imust.com' THEN '13384896554'
    WHEN u.email = '13948433895@imust.com' THEN '13948433895'
    WHEN u.email = '18435224981@imust.com' THEN '18435224981'
    WHEN u.email = '13484749056@imust.com' THEN '13484749056'
    WHEN u.email = '18697413351@imust.com' THEN '18697413351'
    WHEN u.email = '15047445435@imust.com' THEN '15047445435'
    WHEN u.email = '15024978540@imust.com' THEN '15024978540'
    WHEN u.email = '18686170502@imust.com' THEN '18686170502'
    WHEN u.email = '13214951334@imust.com' THEN '13214951334'
    WHEN u.email = '18847445527@imust.com' THEN '18847445527'
    WHEN u.email = '19847730736@imust.com' THEN '19847730736'
    WHEN u.email = '15048430379@imust.com' THEN '15048430379'
    WHEN u.email = '15144841681@imust.com' THEN '15144841681'
    WHEN u.email = '15049309721@imust.com' THEN '15049309721'
    WHEN u.email = '15149237376@imust.com' THEN '15149237376'
    WHEN u.email = 'wang_lai@imust.com' THEN '18435224981'
    WHEN u.email = 'li_huijuan@imust.com' THEN '15504890027'
    WHEN u.email = 'admin@test.com' THEN '13800000001'
    WHEN u.email = 'user@test.com' THEN '13800000002'
    WHEN u.email = 'demo@test.com' THEN '13800000003'
    ELSE '13800000000'
  END as phone,
  CASE 
    WHEN u.email IN ('15024942562@imust.com', '18748439273@imust.com', '15504890027@imust.com', '13644724291@imust.com', '15247486647@imust.com', '13614749935@imust.com', '15647177995@imust.com', '13484749056@imust.com', '18847445527@imust.com', 'wang_lai@imust.com', 'li_huijuan@imust.com') THEN '女'
    ELSE '男'
  END as gender,
  '2020-01-01' as join_party_date,
  '中共内蒙古科技大学数智产业学院学生第三支部委员会' as party_branch,
  CASE 
    WHEN u.email = 'wang_lai@imust.com' THEN '党支部书记'
    WHEN u.email = 'li_huijuan@imust.com' THEN '党支部副书记'
    ELSE '党员'
  END as position,
  CASE 
    WHEN u.email = 'wang_lai@imust.com' OR u.email = 'li_huijuan@imust.com' THEN 'super_admin'
    WHEN u.email = 'admin@test.com' THEN 'admin'
    ELSE 'member'
  END as role,
  'active' as status
FROM auth.users u
WHERE u.email LIKE '%@imust.com' OR u.email LIKE '%@test.com';

-- =============================================================================
-- 完成导入
-- =============================================================================

-- 查看导入结果
SELECT 
  '用户统计' as 统计项目,
  COUNT(*) as 数量
FROM auth.users
UNION ALL
SELECT 
  '党员数量' as 统计项目,
  COUNT(*) as 数量
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE up.role = 'member'
UNION ALL
SELECT 
  '管理员数量' as 统计项目,
  COUNT(*) as 数量
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE up.role IN ('admin', 'super_admin')
UNION ALL
SELECT 
  '测试账号数量' as 统计项目,
  COUNT(*) as 数量
FROM auth.users 
WHERE email LIKE '%@test.com';

COMMIT;