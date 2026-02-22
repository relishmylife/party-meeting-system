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

        // 王来老师账户信息
        const wangLaiData = {
            email: 'wang_lai@imust.com',
            password: 'wang_lai123',
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: '王来',
                is_super_admin: true
            }
        };

        const lihuijuanData = {
            email: 'li_huijuan@imust.com',
            password: 'li_huijuan123',
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: '李惠娟',
                is_super_admin: true
            }
        };

        // 创建王来老师账户
        const wangLaiAuthUser = await adminClient.createUser(wangLaiData);

        // 创建王来老师档案
        const wangLaiProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: wangLaiAuthUser.id,
                org_id: '82060473-2317-47f7-bc7c-008b4d1432dc',
                full_name: '王来',
                phone: '18435224981',
                gender: '女',
                join_party_date: '2018-06-25',
                party_branch: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
                position: '党支部书记',
                role: 'super_admin',
                status: 'active'
            })
        });

        // 创建李惠娟老师账户
        const liHuijuanAuthUser = await adminClient.createUser(lihuijuanData);

        // 创建李惠娟老师档案
        const liHuijuanProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: liHuijuanAuthUser.id,
                org_id: '82060473-2317-47f7-bc7c-008b4d1432dc',
                full_name: '李惠娟',
                phone: '15504890027',
                gender: '女',
                join_party_date: '2008-06-03',
                party_branch: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
                position: '党支部书记',
                role: 'super_admin',
                status: 'active'
            })
        });

        const wangLaiProfile = await wangLaiProfileResponse.json();
        const liHuijuanProfile = await liHuijuanProfileResponse.json();

        return new Response(JSON.stringify({
            success: true,
            message: '超级管理员账户创建成功',
            data: {
                wang_lai: {
                    auth_user: wangLaiAuthUser,
                    profile: wangLaiProfile,
                    credentials: {
                        email: 'wang_lai@imust.com',
                        password: 'wang_lai123'
                    }
                },
                li_huijuan: {
                    auth_user: liHuijuanAuthUser,
                    profile: liHuijuanProfile,
                    credentials: {
                        email: 'li_huijuan@imust.com',
                        password: 'li_huijuan123'
                    }
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('创建超级管理员账户失败:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'CREATE_SUPER_ADMIN_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});