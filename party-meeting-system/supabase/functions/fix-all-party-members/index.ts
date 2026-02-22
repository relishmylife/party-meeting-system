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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    // 获取所有党员账号
    const usersResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_all_party_members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({})
    });

    if (!usersResponse.ok) {
      throw new Error('Failed to fetch party members');
    }

    const users = await usersResponse.json();
    const results = [];

    for (const user of users) {
      if (user.email === 'test@imust.com' || user.email.includes('15024942562')) {
        continue; // 跳过测试账号和已修复的账号
      }

      const phone = user.phone;
      if (!phone) continue;

      try {
        // 重置密码为手机号
        const updateUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({
            password: phone,
            email_confirm: true
          })
        });

        // 更新用户档案
        const updateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            position: '党员',
            party_branch: '中共内蒙古科技大学数智产业学院学生第三支部委员会',
            status: 'active'
          })
        });

        results.push({
          email: user.email,
          phone: phone,
          full_name: user.full_name,
          user_updated: updateUserResponse.ok,
          profile_updated: updateProfileResponse.ok
        });

      } catch (error) {
        results.push({
          email: user.email,
          phone: phone,
          full_name: user.full_name,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});