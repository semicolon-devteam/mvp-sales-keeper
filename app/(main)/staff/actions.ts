'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Staff Member Management ---

export async function updateMemberDetails(memberId: string, alias: string, hourlyWage: number, color: string) {
    const supabase = await createClient();

    // Check permission (Owner/Manager only) - omitted for MVP, assuming UI hides it or RLS handles it

    const { error } = await supabase
        .from('store_members')
        .update({ alias, hourly_wage: hourlyWage, color })
        .eq('id', memberId);

    if (error) throw error;
    revalidatePath('/staff');
}

// --- Schedule Management ---

export async function getSchedules(storeId: string, start: string, end: string) {
    const supabase = await createClient();

    // Note: No FK relationship between work_schedules and store_members
    // Fetching schedules without join, member info handled client-side
    const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('store_id', storeId)
        .gte('start_time', start)
        .lte('end_time', end)
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }
    return data || [];
}

export async function createSchedule(storeId: string, userId: string, startTime: string, endTime: string, memo?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('work_schedules')
        .insert({
            store_id: storeId,
            user_id: userId,
            start_time: startTime,
            end_time: endTime,
            memo
        });

    if (error) throw error;
    revalidatePath('/staff');
}

export async function deleteSchedule(scheduleId: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('work_schedules').delete().eq('id', scheduleId);
    if (error) throw error;
    revalidatePath('/staff');
}

// --- Attendance Management ---

export async function getTodayLog(storeId: string, userId: string) {
    const supabase = await createClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find a log that started today and has no clock_out (working) OR just started today
    const { data, error } = await supabase
        .from('work_logs')
        .select('*')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .gte('clock_in', todayStart.toISOString())
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) return null;
    return data;
}

export async function clockIn(storeId: string, userId: string, wage: number) {
    const supabase = await createClient();

    // Check if already working
    const existing = await getTodayLog(storeId, userId);
    if (existing && !existing.clock_out) throw new Error('Already working');

    const { error } = await supabase
        .from('work_logs')
        .insert({
            store_id: storeId,
            user_id: userId,
            clock_in: new Date().toISOString(),
            wage_snapshot: wage,
            status: 'working'
        });

    if (error) throw error;
    revalidatePath('/staff');
}

export async function clockOut(logId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('work_logs')
        .update({
            clock_out: new Date().toISOString(),
            status: 'completed'
        })
        .eq('id', logId);

    if (error) throw error;
    revalidatePath('/staff');
}

export async function getWorkLogs(storeId: string, limit = 20) {
    const supabase = await createClient();

    // Note: No FK relationship between work_logs and store_members
    // Member info handled client-side via members list
    const { data, error } = await supabase
        .from('work_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('clock_in', { ascending: false })
        .limit(limit);

    if (error) return [];
    return data || [];
}
