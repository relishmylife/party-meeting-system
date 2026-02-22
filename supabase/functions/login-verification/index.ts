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

    // 测试已创建的邮箱格式账号的登录
    const testAccounts = [
      { email: '15024942562@gmail.com', password: '15024942562', role: 'member', name: '王颖' },
      { email: '15504890027@gmail.com', password: '15504890027', role: 'member', name: '李惠娟' },
      { email: '18435224981@gmail.com', password: '18435224981', role: 'member', name: '王来' },
      { email: 'admin@test.com', password: '13800000001', role: 'admin', name: '测试管理员' },
      { email: 'user@test.com', password: '13800000002', role: 'member', name: '测试用户' }
    ];

    const results = [];

    for (const account of testAccounts) {
      try {
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
        
        results.push({
          email: account.email,
          role: account.role,
          success: loginResponse.ok,
          status_code: loginResponse.status,
          has_token: !!loginData.access_token,
          error: loginData.error_description || loginData.msg || null
        });

      } catch (error) {
        results.push({
          email: account.email,
          role: account.role,
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
    console.error('Login verification error:', error);
    
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