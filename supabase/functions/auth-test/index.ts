// 测试Supabase认证配置
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

        const testResults = [];

        // 测试不同的邮箱格式
        const testEmails = [
            { email: 'test@gmail.com', password: 'test123456', description: '标准Gmail邮箱' },
            { email: '15024942562@imust.com', password: '15024942562', description: '原格式邮箱' },
            { email: 'test-user@imust.com', password: 'test123456', description: '自定义域名邮箱' },
        ];

        for (const testEmail of testEmails) {
            try {
                console.log(`测试创建账号: ${testEmail.email}`);

                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: testEmail.email,
                    password: testEmail.password,
                    email_confirm: true,
                    user_metadata: {
                        test: true,
                        description: testEmail.description
                    }
                });

                if (createError) {
                    testResults.push({
                        email: testEmail.email,
                        description: testEmail.description,
                        status: 'failed',
                        error: createError.message
                    });
                    console.error(`创建失败: ${testEmail.email} - ${createError.message}`);
                } else {
                    testResults.push({
                        email: testEmail.email,
                        description: testEmail.description,
                        status: 'success',
                        user_id: newUser.user?.id
                    });
                    console.log(`创建成功: ${testEmail.email}`);

                    // 删除测试账号
                    if (newUser.user) {
                        await supabase.auth.admin.deleteUser(newUser.user.id);
                        console.log(`删除测试账号: ${newUser.user.id}`);
                    }
                }

            } catch (error) {
                testResults.push({
                    email: testEmail.email,
                    description: testEmail.description,
                    status: 'error',
                    error: error.message
                });
                console.error(`测试出错: ${testEmail.email} - ${error.message}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            test_results: testResults,
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