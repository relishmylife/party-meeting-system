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

    // 使用Admin API重置密码的账号列表
    const accountsToReset = [
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
      { email: '15540889736@imust.com', password: '15540889736' },
      { email: '18847445527@imust.com', password: '18847445527' },
      { email: '15047445435@imust.com', password: '15047445435' },
      { email: '18697413351@imust.com', password: '18697413351' },
      { email: '15661105424@imust.com', password: '15661105424' },
      { email: '15647177995@imust.com', password: '15647177995' },
      { email: '15149237376@imust.com', password: '15149237376' },
      { email: '13384896554@imust.com', password: '13384896554' },
      { email: '13484749056@imust.com', password: '13484749056' },
      { email: '13614749935@imust.com', password: '13614749935' },
      { email: '15144841681@imust.com', password: '15144841681' },
      { email: '18435224981@imust.com', password: '18435224981' },
      { email: '15049309721@imust.com', password: '15049309721' },
      { email: '15048430379@imust.com', password: '15048430379' },
      { email: '19847730736@imust.com', password: '19847730736' },
      { email: '13214951334@imust.com', password: '13214951334' },
      { email: '17552735097@imust.com', password: '17552735097' },
      { email: '13948433895@imust.com', password: '13948433895' },
      { email: '15024978540@imust.com', password: '15024978540' },
      { email: '18647096683@imust.com', password: '18647096683' }
    ];

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const account of accountsToReset) {
      try {
        // 首先通过邮箱查找用户ID
        const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(account.email)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });

        if (!getUserResponse.ok) {
          const error = await getUserResponse.text();
          results.push({
            email: account.email,
            success: false,
            error: `获取用户失败: ${error}`
          });
          failCount++;
          continue;
        }

        const userData = await getUserResponse.json();
        const users = userData.users || [];
        
        if (users.length === 0) {
          results.push({
            email: account.email,
            success: false,
            error: '用户不存在'
          });
          failCount++;
          continue;
        }

        const userId = users[0].id;
        
        // 使用Admin API更新密码
        const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: account.password,
            email_confirm: true // 确保邮箱已确认
          })
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          results.push({
            email: account.email,
            success: true,
            message: '密码重置成功',
            user_id: userId
          });
          successCount++;
        } else {
          const error = await updateResponse.text();
          results.push({
            email: account.email,
            success: false,
            error: `密码更新失败: ${error}`
          });
          failCount++;
        }

      } catch (error) {
        results.push({
          email: account.email,
          success: false,
          error: error.message
        });
        failCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: accountsToReset.length,
        successful: successCount,
        failed: failCount
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin API password reset error:', error);
    
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