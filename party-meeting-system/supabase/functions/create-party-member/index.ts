Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // 验证请求来源（获取当前用户）
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // 验证token并获取用户信息
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid token or unauthorized');
    }

    const currentUser = await userResponse.json();

    // 检查当前用户的角色
    const profileResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${currentUser.id}&select=role`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      }
    );

    if (!profileResponse.ok) {
      throw new Error('Failed to verify user permissions');
    }

    const profiles = await profileResponse.json();
    if (!profiles || profiles.length === 0 || profiles[0].role !== 'super_admin') {
      throw new Error('Permission denied: Only super admins can create party members');
    }

    // 获取请求数据
    const { email, password, full_name, phone, party_branch, position, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role');
    }

    // 创建认证用户
    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name
        }
      })
    });

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      throw new Error(`Failed to create user: ${errorText}`);
    }

    const userData = await createUserResponse.json();
    const userId = userData.id;

    // 创建用户档案
    const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        full_name,
        phone: phone || null,
        party_branch: party_branch || null,
        position: position || null,
        role,
        status: 'active'
      })
    });

    if (!createProfileResponse.ok) {
      const errorText = await createProfileResponse.text();
      
      // 如果档案创建失败，尝试删除已创建的用户
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      throw new Error(`Failed to create user profile: ${errorText}`);
    }

    const profileData = await createProfileResponse.json();

    return new Response(JSON.stringify({
      data: {
        user: userData,
        profile: profileData[0]
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create party member error:', error);

    const errorResponse = {
      error: {
        code: 'CREATE_MEMBER_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
