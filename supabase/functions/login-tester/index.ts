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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('缺少Supabase配置');
    }

    // 测试账号数据
    const testAccounts = [
      // 超级管理员
      { email: 'wang_lai@imust.com', password: 'wang_lai123', role: 'super_admin', name: '王来' },
      { email: 'li_huijuan@imust.com', password: 'li_huijuan123', role: 'super_admin', name: '李惠娟' },
      
      // 管理员
      { email: 'admin@test.com', password: 'admin123', role: 'admin', name: '测试管理员' },
      
      // 测试用户
      { email: 'user@test.com', password: 'user123', role: 'member', name: '测试用户' },
      { email: 'demo@test.com', password: 'demo123', role: 'member', name: '演示账号' },
      
      // 党员账号（手机号密码）
      { email: '15560405231@imust.com', password: '15560405231', role: 'member', name: '侯佳林' },
      { email: '15024981142@imust.com', password: '15024981142', role: 'member', name: '刘晓雨' },
      { email: '15848476685@imust.com', password: '15848476685', role: 'member', name: '吴浩' },
      { email: '18748439273@imust.com', password: '18748439273', role: 'member', name: '娜仁图雅' },
      { email: '15247486647@imust.com', password: '15247486647', role: 'member', name: '宋欣梦' },
      { email: '13644724291@imust.com', password: '13644724291', role: 'member', name: '张铭月' },
      { email: '18686170502@imust.com', password: '18686170502', role: 'member', name: '杜政达' },
      { email: '15024942562@imust.com', password: '15024942562', role: 'member', name: '王颖' },
      { email: '18310976961@imust.com', password: '18310976961', role: 'member', name: '罗旭诚' },
      { email: '15354885785@imust.com', password: '15354885785', role: 'member', name: '范骁腾' },
      { email: '15047362557@imust.com', password: '15047362557', role: 'member', name: '董昊轩' },
      { email: '13664024369@imust.com', password: '13664024369', role: 'member', name: '靳秀兰' },
      { email: '15540889736@imust.com', password: '15540889736', role: 'member', name: '马明哲' }
    ];

    // 测试登录功能
    const loginTests = [];
    
    for (const account of testAccounts) {
      try {
        // 尝试登录
        const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: account.email,
            password: account.password
          })
        });

        const loginData = await loginResponse.json();
        
        if (loginResponse.ok && loginData.access_token) {
          // 登录成功
          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${loginData.user.id}&select=*`, {
            headers: {
              'Authorization': `Bearer ${loginData.access_token}`,
              'apikey': supabaseAnonKey,
              'Content-Type': 'application/json'
            }
          });

          const profiles = await profileResponse.json();
          const profile = profiles[0];

          loginTests.push({
            success: true,
            email: account.email,
            name: account.name,
            role: account.role,
            user_id: loginData.user.id,
            profile_found: !!profile,
            profile_role: profile?.role || 'unknown',
            message: '登录成功'
          });
        } else {
          // 登录失败
          loginTests.push({
            success: false,
            email: account.email,
            name: account.name,
            role: account.role,
            error: loginData.error_description || loginData.msg || '登录失败',
            message: '登录失败'
          });
        }
      } catch (error) {
        loginTests.push({
          success: false,
          email: account.email,
          name: account.name,
          role: account.role,
          error: error.message,
          message: '测试出错'
        });
      }
    }

    // 计算统计信息
    const stats = {
      total: loginTests.length,
      successful: loginTests.filter(t => t.success).length,
      failed: loginTests.filter(t => !t.success).length,
      by_role: {
        super_admin: { total: 0, successful: 0, failed: 0 },
        admin: { total: 0, successful: 0, failed: 0 },
        member: { total: 0, successful: 0, failed: 0 }
      }
    };

    for (const test of loginTests) {
      if (test.role && stats.by_role[test.role]) {
        stats.by_role[test.role].total++;
        if (test.success) {
          stats.by_role[test.role].successful++;
        } else {
          stats.by_role[test.role].failed++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      tests: loginTests
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login test error:', error);
    
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