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
    // 获取Supabase URL和密钥
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少Supabase配置');
    }

    // 根据请求方法处理不同功能
    const url = new URL(req.url);
    const path = url.pathname;

    // 发送聊天消息
    if (path.includes('/send') && req.method === 'POST') {
      const requestData = await req.json();
      const { sender_id, receiver_id, message_type, message_content, file_url, file_name, file_size } = requestData;

      if (!sender_id || !receiver_id || !message_content) {
        return new Response(JSON.stringify({ 
          error: { code: 'MISSING_PARAMS', message: '缺少必要参数' } 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 插入聊天消息到数据库
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          sender_id,
          receiver_id,
          message_type: message_type || 'text',
          message_content,
          file_url: file_url || null,
          file_name: file_name || null,
          file_size: file_size || null,
          is_read: false
        })
      });

      if (!insertResponse.ok) {
        const error = await insertResponse.text();
        throw new Error(`插入聊天消息失败: ${error}`);
      }

      const chatData = await insertResponse.json();

      return new Response(JSON.stringify({ 
        data: { 
          success: true, 
          message: '消息发送成功',
          chat: chatData[0] 
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取聊天历史记录
    if (path.includes('/history') && req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const otherUserId = url.searchParams.get('other_user_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!userId || !otherUserId) {
        return new Response(JSON.stringify({ 
          error: { code: 'MISSING_PARAMS', message: '缺少用户ID参数' } 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 获取聊天历史记录
      const historyResponse = await fetch(
        `${supabaseUrl}/rest/v1/chats?or=(and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId}))&order=created_at.desc&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!historyResponse.ok) {
        const error = await historyResponse.text();
        throw new Error(`获取聊天历史失败: ${error}`);
      }

      const chats = await historyResponse.json();

      return new Response(JSON.stringify({ 
        data: { 
          success: true, 
          chats: chats.reverse() // 按时间正序返回
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取未读消息
    if (path.includes('/unread') && req.method === 'GET') {
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');

      if (!userId) {
        return new Response(JSON.stringify({ 
          error: { code: 'MISSING_PARAMS', message: '缺少用户ID参数' } 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 获取未读消息
      const unreadResponse = await fetch(
        `${supabaseUrl}/rest/v1/chats?receiver_id=eq.${userId}&is_read=eq.false&order=created_at.desc`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!unreadResponse.ok) {
        const error = await unreadResponse.text();
        throw new Error(`获取未读消息失败: ${error}`);
      }

      const unreadChats = await unreadResponse.json();

      return new Response(JSON.stringify({ 
        data: { 
          success: true, 
          unread_count: unreadChats.length,
          chats: unreadChats 
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 标记消息为已读
    if (path.includes('/mark-read') && req.method === 'PATCH') {
      const requestData = await req.json();
      const { user_id, chat_ids } = requestData;

      if (!user_id || !chat_ids || !Array.isArray(chat_ids)) {
        return new Response(JSON.stringify({ 
          error: { code: 'MISSING_PARAMS', message: '缺少必要参数' } 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 批量更新消息为已读
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/chats?id=in.(${chat_ids.join(',')})&receiver_id=eq.${user_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ is_read: true })
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        throw new Error(`更新消息状态失败: ${error}`);
      }

      return new Response(JSON.stringify({ 
        data: { 
          success: true, 
          message: '消息已标记为已读' 
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 通用错误响应
    return new Response(JSON.stringify({ 
      error: { 
        code: 'NOT_FOUND', 
        message: '请求的端点不存在' 
      } 
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat storage error:', error);
    
    return new Response(JSON.stringify({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: error.message 
      } 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});