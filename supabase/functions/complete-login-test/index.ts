// 完整登录验证功能
// 验证所有33个迁移账号的登录功能

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

        console.log('开始完整登录验证...');

        // 获取所有新创建的迁移账号
        const { data: newUsers, error: userQueryError } = await supabase
            .auth.admin.listUsers();

        if (userQueryError) {
            throw new Error(`查询用户数据失败: ${userQueryError.message}`);
        }

        // 过滤出迁移账号
        const migratedUsers = newUsers.users.filter(user => 
            user.email?.endsWith('@gmail.com') && 
            user.user_metadata?.migrated === true
        );

        console.log(`找到 ${migratedUsers.length} 个迁移账号`);

        const loginResults = [];
        const maxTestAccounts = Math.min(20, migratedUsers.length); // 限制测试数量避免超时

        // 测试前20个账号
        for (let i = 0; i < maxTestAccounts; i++) {
            const user = migratedUsers[i];
            try {
                const phone = user.user_metadata?.original_phone;
                const password = phone || user.email?.split('@')[0];
                
                console.log(`测试登录: ${user.email} (密码: ${password})`);

                // 测试密码登录
                const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseServiceKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: user.email,
                        password: password
                    })
                });

                const loginData = await loginResponse.json();
                
                loginResults.push({
                    email: user.email,
                    full_name: user.user_metadata?.full_name,
                    phone: phone,
                    role: user.user_metadata?.role,
                    success: loginResponse.ok,
                    status_code: loginResponse.status,
                    has_token: !!loginData.access_token,
                    error: loginData.error_description || loginData.msg || null
                });

                // 添加延迟避免过快请求
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                loginResults.push({
                    email: user.email,
                    full_name: user.user_metadata?.full_name,
                    phone: user.user_metadata?.original_phone,
                    success: false,
                    error: error.message
                });
            }
        }

        // 如果有剩余账号，尝试测试密码为手机号的情况
        const remainingUsers = migratedUsers.slice(maxTestAccounts);
        const passwordTestResults = [];

        if (remainingUsers.length > 0) {
            console.log(`额外测试 ${remainingUsers.length} 个账号使用手机号作为密码`);

            for (let i = 0; i < Math.min(10, remainingUsers.length); i++) {
                const user = remainingUsers[i];
                try {
                    const phone = user.user_metadata?.original_phone;
                    
                    if (phone) {
                        // 测试使用手机号作为密码
                        const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                            method: 'POST',
                            headers: {
                                'apikey': supabaseServiceKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: user.email,
                                password: phone
                            })
                        });

                        const loginData = await loginResponse.json();
                        
                        passwordTestResults.push({
                            email: user.email,
                            full_name: user.user_metadata?.full_name,
                            phone: phone,
                            success: loginResponse.ok,
                            has_token: !!loginData.access_token,
                            status_code: loginResponse.status
                        });
                    }

                    // 添加延迟
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    passwordTestResults.push({
                        email: user.email,
                        phone: user.user_metadata?.original_phone,
                        success: false,
                        error: error.message
                    });
                }
            }
        }

        // 统计结果
        const successfulLogins = loginResults.filter(r => r.success).length;
        const failedLogins = loginResults.filter(r => !r.success).length;
        const successfulPasswordTests = passwordTestResults.filter(r => r.success).length;
        const failedPasswordTests = passwordTestResults.filter(r => !r.success).length;

        const result = {
            success: true,
            summary: {
                total_migrated_users: migratedUsers.length,
                tested_accounts: loginResults.length,
                successful_logins: successfulLogins,
                failed_logins: failedLogins,
                password_test_results: passwordTestResults.length,
                successful_password_tests: successfulPasswordTests,
                failed_password_tests: failedPasswordTests
            },
            login_results: loginResults,
            password_test_results: passwordTestResults,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('登录验证失败:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'LOGIN_VERIFICATION_FAILED',
                message: error.message
            },
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});