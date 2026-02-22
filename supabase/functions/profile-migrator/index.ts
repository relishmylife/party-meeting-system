// Profile数据迁移功能
// 将旧账号的profile数据关联到新创建的user_id

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

        console.log('开始Profile数据迁移...');

        // 获取新创建的账号（邮箱以@gmail.com结尾且包含migrated标记）
        const { data: newUsers, error: userQueryError } = await supabase
            .auth.admin.listUsers();

        if (userQueryError) {
            throw new Error(`查询用户数据失败: ${userQueryError.message}`);
        }

        // 过滤出新创建的迁移账号
        const migratedUsers = newUsers.users.filter(user => 
            user.email?.endsWith('@gmail.com') && 
            user.user_metadata?.migrated === true
        );

        console.log(`找到 ${migratedUsers.length} 个需要迁移profile的用户`);

        const migrationResults = [];

        // 逐个迁移每个用户的profile
        for (const newUser of migratedUsers) {
            try {
                const oldUserId = newUser.user_metadata?.migrated_from;
                const originalPhone = newUser.user_metadata?.original_phone;
                
                if (!oldUserId) {
                    console.warn(`用户 ${newUser.email} 没有migrated_from信息，跳过`);
                    continue;
                }

                console.log(`迁移profile: ${oldUserId} -> ${newUser.id} (${newUser.email})`);

                // 获取旧的profile数据
                const { data: oldProfile, error: profileQueryError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', oldUserId)
                    .single();

                if (profileQueryError) {
                    throw new Error(`查询旧profile失败 (${oldUserId}): ${profileQueryError.message}`);
                }

                if (!oldProfile) {
                    throw new Error(`未找到旧profile (${oldUserId})`);
                }

                // 删除旧profile记录
                const { error: deleteError } = await supabase
                    .from('user_profiles')
                    .delete()
                    .eq('user_id', oldUserId);

                if (deleteError) {
                    console.warn(`删除旧profile失败: ${deleteError.message}`);
                }

                // 插入新的profile记录（使用新的user_id，保持所有数据）
                const { data: newProfile, error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: newUser.id, // 使用新的user_id
                        org_id: oldProfile.org_id,
                        employee_id: oldProfile.employee_id,
                        full_name: oldProfile.full_name,
                        nickname: oldProfile.nickname,
                        phone: originalPhone || oldProfile.phone, // 保持原始手机号
                        gender: oldProfile.gender,
                        birth_date: oldProfile.birth_date,
                        join_party_date: oldProfile.join_party_date,
                        party_branch: oldProfile.party_branch,
                        position: oldProfile.position,
                        role: newUser.user_metadata?.role || oldProfile.role, // 使用新账号的role
                        status: oldProfile.status,
                        created_at: oldProfile.created_at,
                        updated_at: new Date().toISOString(), // 更新时间
                        created_by: oldProfile.created_by,
                        updated_by: newUser.id, // 更新者设为新账号
                        is_deleted: oldProfile.is_deleted
                    })
                    .select()
                    .single();

                if (insertError) {
                    throw new Error(`插入新profile失败: ${insertError.message}`);
                }

                console.log(`成功迁移profile: ${oldProfile.full_name} (${newUser.email})`);

                migrationResults.push({
                    old_user_id: oldUserId,
                    new_user_id: newUser.id,
                    email: newUser.email,
                    full_name: oldProfile.full_name,
                    phone: originalPhone || oldProfile.phone,
                    role: newUser.user_metadata?.role,
                    status: 'success',
                    created_at: new Date().toISOString()
                });

            } catch (userError) {
                console.error(`迁移profile失败 (${newUser.email}):`, userError);
                migrationResults.push({
                    new_user_id: newUser.id,
                    email: newUser.email,
                    status: 'failed',
                    error: userError.message,
                    created_at: new Date().toISOString()
                });
            }
        }

        // 统计结果
        const successfulMigrations = migrationResults.filter(r => r.status === 'success').length;
        const failedMigrations = migrationResults.filter(r => r.status === 'failed').length;

        const result = {
            success: true,
            summary: {
                total_profiles: migratedUsers.length,
                successful_migrations: successfulMigrations,
                failed_migrations: failedMigrations
            },
            migration_results: migrationResults,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Profile迁移失败:', error);
        
        const errorResponse = {
            success: false,
            error: {
                code: 'PROFILE_MIGRATION_FAILED',
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