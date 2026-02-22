// 改进的账号迁移功能 - 修复邮箱格式问题
// 将"手机号@imust.com"转换为标准邮箱格式

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

        console.log('开始改进的账号迁移...');

        // 查询所有需要迁移的profile
        const { data: profiles, error: profileQueryError } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, phone, role, party_branch, position, employee_id, status, org_id, nickname, avatar_url, gender, birth_date, join_party_date, last_login_at, created_at, updated_at, created_by, updated_by, is_deleted');

        if (profileQueryError) {
            throw new Error(`查询profile数据失败: ${profileQueryError.message}`);
        }

        if (!profiles || profiles.length === 0) {
            throw new Error('没有找到需要迁移的profile数据');
        }

        // 过滤出需要迁移的账号
        const accountsToMigrate = profiles.filter(profile => {
            const phone = profile.phone;
            if (!phone) return false;
            
            const isTestAccount = ['admin@test.com', 'user@test.com', 'demo@test.com'].includes(phone);
            const isImustEmail = phone.match(/^\d{11}$/) && !['13800000001', '13800000002', '13800000003'].includes(phone);
            
            return isTestAccount || isImustEmail;
        });

        console.log(`找到 ${accountsToMigrate.length} 个需要迁移的账号`);

        const migrationResults = [];
        const profileMigrations = [];

        // 逐个处理每个导入账号
        for (const profile of accountsToMigrate) {
            try {
                const phone = profile.phone;
                const isTestAccount = ['admin@test.com', 'user@test.com', 'demo@test.com'].includes(phone);
                
                // 修复邮箱格式问题
                let newEmail, password;
                if (isTestAccount) {
                    newEmail = phone; // 测试账号保持原格式
                    password = phone === 'admin@test.com' ? '13800000001' : 
                              phone === 'user@test.com' ? '13800000002' : '13800000003';
                } else {
                    // 将"手机号@imust.com"转换为"手机号@gmail.com"
                    newEmail = `${phone}@gmail.com`;
                    password = phone; // 使用手机号作为密码
                }

                const role = profile.role || 'member';
                const fullName = profile.full_name || '';

                console.log(`正在迁移账号: ${profile.phone} -> ${newEmail} (${role})`);

                // 使用Admin API创建新账号
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: newEmail,
                    password: password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: fullName,
                        role: role,
                        email_verified: true,
                        migrated: true,
                        migrated_from: profile.user_id,
                        original_phone: profile.phone,
                        migration_notes: isTestAccount ? '测试账号迁移' : '手机号格式邮箱迁移'
                    }
                });

                if (createError) {
                    throw new Error(`创建用户 ${newEmail} 失败: ${createError.message}`);
                }

                if (!newUser.user) {
                    throw new Error(`创建用户 ${newEmail} 失败：未返回用户信息`);
                }

                const newUserId = newUser.user.id;
                console.log(`成功创建账号: ${newEmail} -> ${newUserId}`);

                migrationResults.push({
                    old_user_id: profile.user_id,
                    new_user_id: newUserId,
                    original_email: `${phone}@imust.com`,
                    new_email: newEmail,
                    full_name: fullName,
                    role: role,
                    password_used: password,
                    migration_type: isTestAccount ? '测试账号' : '手机号格式迁移',
                    status: 'success',
                    created_at: new Date().toISOString()
                });

                // 准备profile迁移数据
                profileMigrations.push({
                    old_user_id: profile.user_id,
                    new_user_id: newUserId,
                    profile_data: profile
                });

            } catch (userError) {
                const phone = profile.phone;
                const isTestAccount = ['admin@test.com', 'user@test.com', 'demo@test.com'].includes(phone);
                const errorEmail = isTestAccount ? phone : `${phone}@gmail.com`;
                console.error(`迁移账号 ${errorEmail} 失败:`, userError);
                migrationResults.push({
                    old_user_id: profile.user_id,
                    original_email: isTestAccount ? profile.phone : `${profile.phone}@imust.com`,
                    new_email: errorEmail,
                    role: profile.role || 'unknown',
                    status: 'failed',
                    error: userError.message,
                    created_at: new Date().toISOString()
                });
            }
        }

        // 迁移user_profiles数据
        console.log('开始迁移user_profiles数据...');
        const profileMigrationResults = [];

        for (const profileMigration of profileMigrations) {
            try {
                const profile = profileMigration.profile_data;
                const { old_user_id, new_user_id } = profileMigration;

                // 删除旧profile（如果存在）
                await supabase
                    .from('user_profiles')
                    .delete()
                    .eq('user_id', new_user_id); // 确保没有冲突

                // 插入新profile
                const { data: newProfile, error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: new_user_id,
                        org_id: profile.org_id,
                        employee_id: profile.employee_id,
                        full_name: profile.full_name,
                        nickname: profile.nickname,
                        phone: profile.phone, // 保持原始手机号
                        gender: profile.gender,
                        birth_date: profile.birth_date,
                        join_party_date: profile.join_party_date,
                        party_branch: profile.party_branch,
                        position: profile.position,
                        role: profile.role,
                        status: profile.status,
                        created_at: profile.created_at,
                        updated_at: profile.updated_at,
                        created_by: profile.created_by,
                        updated_by: profile.updated_by,
                        is_deleted: profile.is_deleted
                    })
                    .select()
                    .single();

                if (profileError) {
                    throw new Error(`迁移profile失败 (${profile.full_name}): ${profileError.message}`);
                }

                console.log(`成功迁移profile: ${profile.full_name}`);

                profileMigrationResults.push({
                    old_user_id: old_user_id,
                    new_user_id: new_user_id,
                    full_name: profile.full_name,
                    status: 'success'
                });

            } catch (profileError) {
                console.error(`迁移profile失败:`, profileError);
                profileMigrationResults.push({
                    old_user_id: profileMigration.old_user_id,
                    new_user_id: profileMigration.new_user_id,
                    status: 'failed',
                    error: profileError.message
                });
            }
        }

        // 统计结果
        const successfulMigrations = migrationResults.filter(r => r.status === 'success').length;
        const failedMigrations = migrationResults.filter(r => r.status === 'failed').length;
        const successfulProfileMigrations = profileMigrationResults.filter(r => r.status === 'success').length;
        const failedProfileMigrations = profileMigrationResults.filter(r => r.status === 'failed').length;

        // 生成最终报告
        const result = {
            success: true,
            summary: {
                total_accounts: accountsToMigrate.length,
                successful_migrations: successfulMigrations,
                failed_migrations: failedMigrations,
                successful_profile_migrations: successfulProfileMigrations,
                failed_profile_migrations: failedProfileMigrations,
                migration_strategy: '邮箱格式修复：将手机号@imust.com转换为手机号@gmail.com'
            },
            successful_accounts: migrationResults.filter(r => r.status === 'success').map(r => ({
                full_name: r.full_name,
                role: r.role,
                original_email: r.original_email,
                new_email: r.new_email,
                password: r.password_used
            })),
            failed_accounts: migrationResults.filter(r => r.status === 'failed'),
            profile_migration_results: profileMigrationResults,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('账号迁移失败:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'MIGRATION_FAILED',
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