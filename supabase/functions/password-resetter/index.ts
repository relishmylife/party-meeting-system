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
      throw new Error('缺少Supabase配置');
    }

    // 需要修复的账号和对应密码
    const accountsToFix = [
      { email: 'wang_lai@imust.com', password: 'wang_lai123' },
      { email: 'li_huijuan@imust.com', password: 'li_huijuan123' },
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'user@test.com', password: 'user123' },
      { email: 'demo@test.com', password: 'demo123' },
      { email: '15560405231@imust.com', password: '15560405231' },
      { email: '15024981142@imust.com', password: '15024981142' },
      { email: '15848476685@imust.com', password: '15848476685' },
      { email: '18748439273@imust.com', password: '18748439273' },
      { email: '15247486647@imust.com', password: '15247486647' },
      { email: '13644724291@imust.com', password: '13644724291' },
      { email: '18686170502@imust.com', password: '18686170502' },
      { email: '15024942562@imust.com', password: '15024942562' },
      { email: '18310976961@imust.com', password: '18310976961' },
      { email: '15354885785@imust.com', password: '15354885785' },
      { email: '15047362557@imust.com', password: '15047362557' },
      { email: '13664024369@imust.com', password: '13664024369' },
      { email: '15540889736@imust.com', password: '15540889736' }
    ];

    const results = [];
    
    for (const account of accountsToFix) {
      try {
        // 使用Admin API更新用户密码
        const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });

        // 首先获取用户ID
        const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(account.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });

        if (getUserResponse.ok) {
          const userData = await getUserResponse.json();
          const users = userData.users || [];
          
          if (users.length > 0) {
            const userId = users[0].id;
            
            // 更新密码
            const updatePasswordResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                password: account.password
              })
            });

            if (updatePasswordResponse.ok) {
              results.push({
                email: account.email,
                success: true,
                message: '密码重置成功'
              });
            } else {
              const error = await updatePasswordResponse.text();
              results.push({
                email: account.email,
                success: false,
                error: `密码重置失败: ${error}`
              });
            }
          } else {
            results.push({
              email: account.email,
              success: false,
              error: '用户不存在'
            });
          }
        } else {
          const error = await getUserResponse.text();
          results.push({
            email: account.email,
            success: false,
            error: `获取用户失败: ${error}`
          });
        }
      } catch (error) {
        results.push({
          email: account.email,
          success: false,
          error: error.message
        });
      }
    }

    const stats = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});