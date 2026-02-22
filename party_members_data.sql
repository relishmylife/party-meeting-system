-- 导入内蒙古科技大学学生第三支部委员会党员数据
-- 组织ID: 82060473-2317-47f7-bc7c-008b4d1432dc

-- 第一批党员（来自第一张图片）
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

-- 第二批党员（来自第二张图片）
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