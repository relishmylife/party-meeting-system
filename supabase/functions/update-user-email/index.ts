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

    const newUserId = '672166d6-06b5-4fa1-a68a-ddfaf26535bd';
    const targetEmail = 'wang_lai@imust.com';
    const targetPassword = 'wang_lai123';

    // 使用Admin API更新用户邮箱
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true
      })
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(`更新失败: ${updateData.error || updateResponse.statusText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: '用户邮箱和密码更新成功',
      user_id: newUserId,
      new_email: targetEmail,
      update_response: updateData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User email update error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});