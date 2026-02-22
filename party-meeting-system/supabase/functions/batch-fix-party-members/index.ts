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
        const requestData = await req.json();
        const { phone, full_name } = requestData;

        // 验证必要参数
        if (!phone || !full_name) {
            throw new Error('phone and full_name are required');
        }

        const email = `${phone}@imust.com`;
        const org_id = '82060473-2317-47f7-bc7c-008b4d1432dc';

        // 获取Supabase配置
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseServiceKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // 创建管理员客户端
        const adminClient = {
            async deleteUser(userId: string) {
                const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Content-Type': 'application/json'
                    }
                });
                return response.ok;
            },

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

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Failed to create user: ${error}`);
                }

                return await response.json();
            },

            async getUserByEmail(email: string) {
                const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    return null;
                }

                const data = await response.json();
                return data.users && data.users.length > 0 ? data.users[0] : null;
            },

            async createUserProfile(userId: string, profileData: any) {
                const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': anonKey || supabaseServiceKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(profileData)
                });

                return response.ok;
            }
        };

        // 检查用户是否已存在
        const existingUser = await adminClient.getUserByEmail(email);
        let userId = existingUser?.id;

        if (existingUser) {
            console.log(`删除现有用户: ${email} (${full_name})`);
            // 删除现有用户和关联的profile
            await adminClient.deleteUser(existingUser.id);
        }

        // 创建新用户
        console.log(`创建新用户: ${email} (${full_name})`);
        const newUser = await adminClient.createUser({
            email: email,
            password: phone,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: full_name,
                phone: phone
            }
        });

        userId = newUser.id;

        // 创建用户profile
        const profileData = {
            user_id: userId,
            org_id: org_id,
            employee_id: phone,
            full_name: full_name,
            nickname: full_name,
            phone: phone,
            gender: '未设置',
            birth_date: null,
            join_party_date: null,
            party_branch: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
            position: '党员',
            role: 'member',
            status: 'active',
            created_by: userId,
            updated_by: userId,
            is_deleted: false
        };

        const profileCreated = await adminClient.createUserProfile(userId, profileData);

        if (!profileCreated) {
            throw new Error('Failed to create user profile');
        }

        console.log(`成功修复用户账号: ${full_name} (${phone}@imust.com)`);

        return new Response(JSON.stringify({ 
            success: true, 
            message: `成功修复用户账号: ${full_name}`,
            email: email,
            phone: phone,
            full_name: full_name,
            user_id: userId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('批量修复党员账号错误:', error);
        
        const errorResponse = {
            error: {
                code: 'BATCH_FIX_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});