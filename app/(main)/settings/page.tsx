'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Stack, Paper, Group, ThemeIcon, Divider, Badge } from '@mantine/core';
import { IconSettings, IconBuildingStore, IconUser, IconLogout } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { NotificationSettings } from './_components/NotificationSettings';
import { useStore } from '../_contexts/store-context';
import { createClient } from '@/app/_shared/utils/supabase/client';

export default function SettingsPage() {
    const router = useRouter();
    const { currentStore } = useStore();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || null);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <Stack gap="xl" pb={100}>
            {/* Header */}
            <Stack gap={4}>
                <Group>
                    <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'gray', to: 'dark' }}>
                        <IconSettings size={20} />
                    </ThemeIcon>
                    <Title order={2} c="white">설정</Title>
                </Group>
                <Text c="dimmed" size="sm">앱 설정 및 알림을 관리합니다.</Text>
            </Stack>

            {/* 계정 정보 */}
            <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                <Group justify="space-between">
                    <Group>
                        <ThemeIcon size="lg" radius="xl" color="teal" variant="light">
                            <IconUser size={20} />
                        </ThemeIcon>
                        <div>
                            <Text fw={600} c="white">내 계정</Text>
                            <Text size="xs" c="dimmed">{userEmail || '로그인 필요'}</Text>
                        </div>
                    </Group>
                    {currentStore && (
                        <Badge color="teal" variant="light">{currentStore.name}</Badge>
                    )}
                </Group>
            </Paper>

            <Divider label="알림 설정" labelPosition="left" color="dark.4" />

            {/* 알림 설정 */}
            <NotificationSettings />

            <Divider label="기타" labelPosition="left" color="dark.4" />

            {/* 기타 설정 */}
            <Stack gap="sm">
                <Paper
                    p="md"
                    radius="md"
                    bg="#1B2136"
                    style={{ border: '1px solid #2C2E33', cursor: 'pointer' }}
                    onClick={() => router.push('/store/members')}
                >
                    <Group>
                        <IconBuildingStore size={20} color="#868E96" />
                        <Text c="white">매장 관리</Text>
                    </Group>
                </Paper>

                <Paper
                    p="md"
                    radius="md"
                    bg="rgba(239, 68, 68, 0.1)"
                    style={{ border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}
                    onClick={handleLogout}
                >
                    <Group>
                        <IconLogout size={20} color="#EF4444" />
                        <Text c="red.4">로그아웃</Text>
                    </Group>
                </Paper>
            </Stack>

            {/* 앱 정보 */}
            <Paper p="md" radius="md" bg="rgba(255,255,255,0.03)">
                <Stack align="center" gap={4}>
                    <Text size="xs" c="dimmed">매출지킴이 v1.0.0 (MVP)</Text>
                    <Text size="xs" c="dimmed">Made with Semicolon</Text>
                </Stack>
            </Paper>
        </Stack>
    );
}
