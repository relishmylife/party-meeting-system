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

        const adminClient = {
            async createUser(userData: any) {
                const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(`Failed to create user: ${JSON.stringify(result)}`);
                }
                return result;
            }
        };

        // 创建管理员测试账号
        const adminData = {
            email: 'admin@test.com',
            password: 'password',
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: '测试管理员'
            }
        };

        const authUser = await adminClient.createUser(adminData);

        // 创建用户档案
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: authUser.id,
                org_id: '82060473-2317-47f7-bc7c-008b4d1432dc',
                full_name: '测试管理员',
                phone: '13384896554',
                gender: '男',
                join_party_date: '2025-01-01',
                party_branch: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
                position: '管理员',
                role: 'admin',
                status: 'active'
            })
        });

        const profile = await profileResponse.json();

        return new Response(JSON.stringify({
            success: true,
            message: '管理员测试账号创建成功',
            auth_user: authUser,
            profile: profile
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('创建管理员测试账号失败:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CREATE_ADMIN_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});