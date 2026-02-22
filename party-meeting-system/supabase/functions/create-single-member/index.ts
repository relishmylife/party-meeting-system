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

        if (!supabaseServiceKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // 直接使用REST API创建用户
        const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: phone,
                email_confirm: true,
                phone_confirm: true,
                user_metadata: {
                    full_name: full_name,
                    phone: phone
                }
            })
        });

        if (!createUserResponse.ok) {
            const errorText = await createUserResponse.text();
            console.error('用户创建失败:', errorText);
            throw new Error(`Failed to create user: ${errorText}`);
        }

        const newUser = await createUserResponse.json();
        const userId = newUser.id;

        console.log(`成功创建用户: ${full_name} (${email}), userId: ${userId}`);

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

        const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(profileData)
        });

        if (!createProfileResponse.ok) {
            const profileError = await createProfileResponse.text();
            console.error('Profile创建失败:', profileError);
            // 不要因为profile创建失败就失败整个操作
        } else {
            console.log(`成功创建Profile: ${full_name}`);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: `成功创建用户账号: ${full_name}`,
            email: email,
            phone: phone,
            full_name: full_name,
            user_id: userId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('创建党员账号错误:', error);
        
        const errorResponse = {
            error: {
                code: 'CREATE_MEMBER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});