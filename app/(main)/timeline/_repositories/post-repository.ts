import { createClient } from '@/app/_shared/utils/supabase/server';

export type TimelinePost = {
    id: string;
    store_id: string;
    author_id: string;
    content: string;
    image_url?: string;
    type: 'notice' | 'general' | 'order';
    created_at: string;
    author_name?: string; // Joined
    author_role?: string; // Joined
};

export async function getDailyPosts(storeId: string, date: string) {
    const supabase = await createClient();

    // Start and end of the day in local time (or just date match if stored as date)
    // Assuming created_at is timestamptz, checking date part
    // Supabase filtering on timestamp columns with just date string yyyy-mm-dd works if using correct filter
    // Best practice: gte start of day, lte end of day

    // Fix timezone issue: User is in KST (+09:00). 
    // We need to match the KST day, so we specify the offset.
    const start = `${date}T00:00:00+09:00`;
    const end = `${date}T23:59:59+09:00`;

    let query = supabase
        .from('timeline_posts')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

    if (storeId !== 'all') {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TimelinePost[];
}
