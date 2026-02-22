// 简化版账号迁移测试
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'

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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log('开始测试数据库连接...');

        // 测试查询user_profiles表
        const { data: profiles, error: profileQueryError } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, phone, role')
            .limit(5);

        if (profileQueryError) {
            throw new Error(`查询profile数据失败: ${profileQueryError.message}`);
        }

        console.log('查询成功，找到profiles数量:', profiles?.length || 0);

        // 过滤账号
        const accountsToMigrate = profiles?.filter(profile => {
            const phone = profile.phone;
            if (!phone) return false;
            
            const isTestAccount = ['admin@test.com', 'user@test.com', 'demo@test.com'].includes(phone);
            const isImustEmail = phone.match(/^\d{11}$/) && !['13800000001', '13800000002', '13800000003'].includes(phone);
            
            return isTestAccount || isImustEmail;
        }) || [];

        console.log('需要迁移的账号数量:', accountsToMigrate.length);

        // 返回基本信息
        return new Response(JSON.stringify({
            success: true,
            total_profiles: profiles?.length || 0,
            accounts_to_migrate: accountsToMigrate.length,
            sample_accounts: accountsToMigrate.slice(0, 3).map(account => ({
                phone: account.phone,
                full_name: account.full_name,
                role: account.role
            })),
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('测试失败:', error);
        
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