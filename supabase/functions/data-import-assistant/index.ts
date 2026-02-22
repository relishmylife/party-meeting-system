Deno.serve(async (req) => {
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing required environment variables');
        }

        // 获取请求参数
        const requestData = await req.json();
        const { action = 'import_all', test_mode = false } = requestData;

        if (test_mode) {
            // 测试模式：验证数据库连接和表结构
            const testResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=count`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            const userCountResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users?select=count`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            return new Response(JSON.stringify({
                success: true,
                message: '数据库连接测试成功',
                data: {
                    user_profiles_table: testResponse.ok ? 'accessible' : 'not accessible',
                    auth_users_table: userCountResponse.ok ? 'accessible' : 'not accessible',
                    timestamp: new Date().toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 完整导入模式
        if (action === 'import_all') {
            // 1. 确保组织架构存在
            const orgCheckResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.82060473-2317-47f7-bc7c-008b4d1432dc`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            const existingOrgs = await orgCheckResponse.json();
            
            if (existingOrgs.length === 0) {
                // 创建组织架构
                await fetch(`${supabaseUrl}/rest/v1/organizations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: '82060473-2317-47f7-bc7c-008b4d1432dc',
                        name: '内蒙古科技大学学生第三支部委员会',
                        code: 'IMUST_STUDENT_3RD_BRANCH',
                        type: 'party_branch',
                        level: 1,
                        description: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
                        status: 'active'
                    })
                });
            }

            // 2. 检查现有用户数量
            const usersResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users?select=id,email`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            const existingUsers = await usersResponse.json();
            
            return new Response(JSON.stringify({
                success: true,
                message: '导入准备完成',
                data: {
                    existing_users_count: existingUsers.length,
                    organization_exists: existingOrgs.length > 0,
                    next_step: '请运行 complete_data_import.sql 脚本',
                    sql_file_path: '/workspace/complete_data_import.sql'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 验证导入结果
        if (action === 'verify_import') {
            const usersResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users?select=id,email`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=user_id,full_name,role`, {
                headers: {
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                }
            });

            const users = await usersResponse.json();
            const profiles = await profilesResponse.json();

            const roleStats = profiles.reduce((acc, profile) => {
                acc[profile.role] = (acc[profile.role] || 0) + 1;
                return acc;
            }, {});

            return new Response(JSON.stringify({
                success: true,
                message: '导入验证完成',
                data: {
                    total_users: users.length,
                    total_profiles: profiles.length,
                    role_distribution: roleStats,
                    users_list: users.map(u => ({ email: u.email })),
                    profiles_list: profiles.map(p => ({ name: p.full_name, role: p.role }))
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Unknown action specified');

    } catch (error) {
        console.error('数据导入助手错误:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'DATA_IMPORT_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});