// 会议文件上传Edge Function
// 支持图片和PDF文件上传到Supabase Storage

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
        const { fileData, fileName, fileType, meetingId, description } = await req.json();

        if (!fileData || !fileName || !meetingId) {
            throw new Error('文件数据、文件名和会议ID是必需的');
        }

        // 验证文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(fileType)) {
            throw new Error('不支持的文件类型，仅支持JPEG、PNG和PDF');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 从data URL提取base64数据
        const base64Data = fileData.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // 生成存储路径
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `meetings/${meetingId}/${timestamp}-${sanitizedFileName}`;

        // 上传到Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/meeting-files/${storagePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': fileType,
                'x-upsert': 'true'
            },
            body: binaryData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`上传失败: ${errorText}`);
        }

        // 获取公共URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/meeting-files/${storagePath}`;

        // 获取用户信息
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('缺少授权头');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('无效的令牌');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // 保存文件元数据到数据库
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/meeting_files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                meeting_id: meetingId,
                file_name: fileName,
                file_type: fileType,
                file_url: publicUrl,
                file_size: binaryData.length,
                description: description || '',
                uploaded_by: userId
            })
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`数据库插入失败: ${errorText}`);
        }

        const fileRecord = await insertResponse.json();

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                fileRecord: fileRecord[0]
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('文件上传错误:', error);

        const errorResponse = {
            error: {
                code: 'FILE_UPLOAD_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
