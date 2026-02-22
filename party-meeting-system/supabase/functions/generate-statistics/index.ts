// 统计分析生成Edge Function
// 生成参会率统计和会议分析数据

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
        const { organizationId, startDate, endDate, userId } = await req.json();

        if (!organizationId) {
            throw new Error('组织ID是必需的');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 构建查询条件
        let meetingsQuery = `organization_id=eq.${organizationId}`;
        if (startDate) meetingsQuery += `&meeting_date=gte.${startDate}`;
        if (endDate) meetingsQuery += `&meeting_date=lte.${endDate}`;

        // 获取会议列表
        const meetingsResponse = await fetch(
            `${supabaseUrl}/rest/v1/meetings?${meetingsQuery}&select=*,meeting_type:meeting_types(name,code)`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!meetingsResponse.ok) {
            throw new Error('获取会议列表失败');
        }

        const meetings = await meetingsResponse.json();

        // 获取参会记录
        const meetingIds = meetings.map(m => m.id).join(',');
        const participantsResponse = await fetch(
            `${supabaseUrl}/rest/v1/meeting_participants?meeting_id=in.(${meetingIds})&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!participantsResponse.ok) {
            throw new Error('获取参会记录失败');
        }

        const participants = await participantsResponse.json();

        // 获取签到记录
        const signInsResponse = await fetch(
            `${supabaseUrl}/rest/v1/meeting_sign_ins?meeting_id=in.(${meetingIds})&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!signInsResponse.ok) {
            throw new Error('获取签到记录失败');
        }

        const signIns = await signInsResponse.json();

        // 统计分析
        const statistics = {
            totalMeetings: meetings.length,
            meetingsByType: {},
            meetingsByStatus: {
                planned: 0,
                in_progress: 0,
                completed: 0,
                cancelled: 0
            },
            attendanceStats: {
                totalParticipants: participants.length,
                totalSignIns: signIns.length,
                attendanceRate: 0
            },
            userAttendance: null
        };

        // 按会议类型统计
        meetings.forEach(meeting => {
            const typeName = meeting.meeting_type?.name || '未分类';
            if (!statistics.meetingsByType[typeName]) {
                statistics.meetingsByType[typeName] = 0;
            }
            statistics.meetingsByType[typeName]++;

            // 按状态统计
            if (statistics.meetingsByStatus.hasOwnProperty(meeting.status)) {
                statistics.meetingsByStatus[meeting.status]++;
            }
        });

        // 计算总体参会率
        if (participants.length > 0) {
            statistics.attendanceStats.attendanceRate = 
                (signIns.length / participants.length * 100).toFixed(2);
        }

        // 如果指定了用户ID，计算个人参会统计
        if (userId) {
            const userParticipants = participants.filter(p => p.user_id === userId);
            const userSignIns = signIns.filter(s => s.user_id === userId);

            statistics.userAttendance = {
                totalInvited: userParticipants.length,
                totalAttended: userSignIns.length,
                attendanceRate: userParticipants.length > 0
                    ? (userSignIns.length / userParticipants.length * 100).toFixed(2)
                    : 0,
                meetings: userParticipants.map(p => {
                    const meeting = meetings.find(m => m.id === p.meeting_id);
                    const signIn = userSignIns.find(s => s.meeting_id === p.meeting_id);
                    return {
                        meetingId: p.meeting_id,
                        meetingTitle: meeting?.title,
                        meetingDate: meeting?.meeting_date,
                        attended: !!signIn,
                        signInTime: signIn?.sign_in_time
                    };
                })
            };
        }

        // 按月份统计会议数量
        const monthlyStats = {};
        meetings.forEach(meeting => {
            const month = meeting.meeting_date.substring(0, 7); // YYYY-MM
            if (!monthlyStats[month]) {
                monthlyStats[month] = {
                    total: 0,
                    byType: {}
                };
            }
            monthlyStats[month].total++;
            
            const typeName = meeting.meeting_type?.name || '未分类';
            if (!monthlyStats[month].byType[typeName]) {
                monthlyStats[month].byType[typeName] = 0;
            }
            monthlyStats[month].byType[typeName]++;
        });

        statistics.monthlyStats = monthlyStats;

        // 保存统计结果到数据库
        const saveStatsResponse = await fetch(`${supabaseUrl}/rest/v1/attendance_statistics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                organization_id: organizationId,
                user_id: userId,
                period_start: startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                period_end: endDate || new Date().toISOString().split('T')[0],
                total_meetings: statistics.totalMeetings,
                attended_meetings: userId ? statistics.userAttendance.totalAttended : null,
                attendance_rate: userId ? parseFloat(statistics.userAttendance.attendanceRate) : parseFloat(statistics.attendanceStats.attendanceRate),
                statistics_data: statistics
            })
        });

        if (!saveStatsResponse.ok) {
            console.error('保存统计数据失败');
        }

        return new Response(JSON.stringify({
            data: statistics
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('生成统计分析错误:', error);

        const errorResponse = {
            error: {
                code: 'STATISTICS_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
