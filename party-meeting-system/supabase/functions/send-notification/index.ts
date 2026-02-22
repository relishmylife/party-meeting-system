// 会议通知发送Edge Function
// 支持邮件和短信通知

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { meetingId, notificationType, recipients } = await req.json();

        if (!meetingId || !notificationType || !recipients || recipients.length === 0) {
            throw new Error('会议ID、通知类型和收件人是必需的');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const emailApiKey = Deno.env.get('EMAIL_API_KEY'); // 需要配置邮件服务API密钥
        const smsApiKey = Deno.env.get('SMS_API_KEY'); // 需要配置短信服务API密钥

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 获取会议信息
        const meetingResponse = await fetch(
            `${supabaseUrl}/rest/v1/meetings?id=eq.${meetingId}&select=*,meeting_type:meeting_types(name)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!meetingResponse.ok) {
            throw new Error('获取会议信息失败');
        }

        const meetings = await meetingResponse.json();
        if (meetings.length === 0) {
            throw new Error('会议不存在');
        }

        const meeting = meetings[0];

        // 构建通知内容
        const notificationContent = {
            subject: `会议通知: ${meeting.title}`,
            message: `
会议类型: ${meeting.meeting_type?.name || '未分类'}
会议主题: ${meeting.title}
会议时间: ${meeting.meeting_date} ${meeting.start_time} - ${meeting.end_time}
会议地点: ${meeting.location}
会议内容: ${meeting.content || '无'}

请准时参加。
            `.trim()
        };

        const sentNotifications = [];

        // 发送通知给每个收件人
        for (const recipient of recipients) {
            try {
                let success = false;

                // 发送邮件通知
                if (notificationType === 'email' || notificationType === 'both') {
                    if (emailApiKey && recipient.email) {
                        // 这里使用实际的邮件服务API
                        // 示例使用SendGrid API格式
                        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${emailApiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                personalizations: [{
                                    to: [{ email: recipient.email }],
                                    subject: notificationContent.subject
                                }],
                                from: { email: 'noreply@party-meeting.com' },
                                content: [{
                                    type: 'text/plain',
                                    value: notificationContent.message
                                }]
                            })
                        });

                        success = emailResponse.ok;
                    }
                }

                // 发送短信通知
                if (notificationType === 'sms' || notificationType === 'both') {
                    if (smsApiKey && recipient.phone) {
                        // 这里使用实际的短信服务API
                        // 示例使用阿里云短信服务
                        const smsResponse = await fetch('https://dysmsapi.aliyuncs.com/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                PhoneNumbers: recipient.phone,
                                SignName: '党组织管理',
                                TemplateCode: 'SMS_123456',
                                TemplateParam: JSON.stringify({
                                    meeting: meeting.title,
                                    time: `${meeting.meeting_date} ${meeting.start_time}`,
                                    location: meeting.location
                                })
                            })
                        });

                        success = smsResponse.ok;
                    }
                }

                // 记录通知日志
                await fetch(`${supabaseUrl}/rest/v1/notification_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        notification_id: null,
                        recipient_id: recipient.userId,
                        sent_at: new Date().toISOString(),
                        status: success ? 'sent' : 'failed',
                        channel: notificationType,
                        error_message: success ? null : '发送失败'
                    })
                });

                sentNotifications.push({
                    userId: recipient.userId,
                    email: recipient.email,
                    phone: recipient.phone,
                    status: success ? 'sent' : 'failed'
                });

            } catch (error) {
                console.error(`发送通知给用户 ${recipient.userId} 失败:`, error);
                sentNotifications.push({
                    userId: recipient.userId,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return new Response(JSON.stringify({
            data: {
                meetingId,
                notificationType,
                totalRecipients: recipients.length,
                sentNotifications
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('发送通知错误:', error);

        const errorResponse = {
            error: {
                code: 'NOTIFICATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
