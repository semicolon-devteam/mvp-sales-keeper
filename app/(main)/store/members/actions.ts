'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Mock function until Supabase types are fully updated
export async function getStoreMembers(storeId: string) {
    const supabase = await createClient();

    // Join with auth.users is tricky in plain client query if Foreign Keys aren't perfect or RLS blocks.
    // Usually we store user 'profile' data in a public 'profiles' table.
    // Check if we have a profiles table? User didn't mention it.
    // If not, we might only get user_id.
    // For MVP, if we don't have public profiles, we can only show user_id or email if we use admin client (unsafe for client).
    // Let's assume there is a way or we just show 'User ID' for now, or fetch from a 'users' view if it exists.
    // Wait, `store_members` has `user_id`.

    // Workaround: We will just return the rows. If we can't get email, we show ID.
    // Or we rely on `store_members` having a joined view.

    const { data, error } = await supabase
        .from('store_members')
        .select('*')
        .eq('store_id', storeId);

    if (error) return [];

    // Return all member data including staff details
    return data.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        email: 'User ' + (m.user_id?.slice(0, 4) || 'N/A'),
        role: m.role,
        alias: m.alias,
        hourly_wage: m.hourly_wage,
        color: m.color
    }));
}

export async function createInvite(storeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Generate simple 6 char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const { error } = await supabase
        .from('store_invites')
        .insert({
            store_id: storeId,
            code: code,
            created_by: user.id,
            expires_at: expiresAt
        });

    if (error) throw error;
    return code;
}

export async function verifyInvite(code: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('store_invites')
        .select('*, stores(name)')
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !data) return null;
    return data;
}

export async function joinStore(code: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Login required');

    // 1. Verify again
    const invite = await verifyInvite(code);
    if (!invite) throw new Error('Invalid or expired invite');

    // 2. Check if already member
    const { data: existing } = await supabase
        .from('store_members')
        .select('id')
        .eq('store_id', invite.store_id)
        .eq('user_id', user.id)
        .single();

    if (existing) return { success: true, message: 'Already a member' };

    // 3. Add member
    const { error } = await supabase
        .from('store_members')
        .insert({
            store_id: invite.store_id,
            user_id: user.id,
            role: 'staff' // Default role
        });

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, storeId: invite.store_id };
}
