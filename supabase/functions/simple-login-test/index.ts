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

    // 测试一个超级管理员账号登录
    const testAccount = {
      email: 'wang_lai@imust.com',
      password: 'wang_lai123'
    };

    // 尝试登录
    const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testAccount.email,
        password: testAccount.password
      })
    });

    const loginData = await loginResponse.json();
    
    let result = {
      login_success: loginResponse.ok,
      status_code: loginResponse.status,
      response_data: loginData
    };

    if (loginResponse.ok && loginData.access_token) {
      // 登录成功，获取用户信息
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'apikey': supabaseAnonKey
        }
      });

      const userData = await userResponse.json();
      
      result.user_info = userData;

      // 获取用户资料
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${loginData.user.id}&select=*`, {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });

      const profiles = await profileResponse.json();
      result.profile_info = profiles[0] || null;
    }

    // 同时测试其他几个关键账号
    const additionalTests = [
      { email: 'li_huijuan@imust.com', password: 'li_huijuan123' },
      { email: 'admin@test.com', password: 'admin123' },
      { email: '15560405231@imust.com', password: '15560405231' }
    ];

    const additionalResults = [];

    for (const account of additionalTests) {
      try {
        const testResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
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

        const testData = await testResponse.json();
        
        additionalResults.push({
          email: account.email,
          success: testResponse.ok,
          status_code: testResponse.status,
          response: testData
        });
      } catch (error) {
        additionalResults.push({
          email: account.email,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      main_test: result,
      additional_tests: additionalResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Simple login test error:', error);
    
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