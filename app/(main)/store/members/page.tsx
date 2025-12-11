'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Button, Group, Stack, Avatar, Paper, Badge, ActionIcon, CopyButton, Tooltip } from '@mantine/core';
import { IconUserPlus, IconTrash, IconCopy, IconMessageCircle } from '@tabler/icons-react';
import { useStore } from '../../_contexts/store-context';
import { getStoreMembers, createInvite } from './actions';
import { useRouter } from 'next/navigation';

export default function MembersPage() {
    const { currentStore } = useStore();
    const [members, setMembers] = useState<any[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentStore) {
            loadMembers();
        }
    }, [currentStore]);

    const loadMembers = async () => {
        if (!currentStore) return;
        const data = await getStoreMembers(currentStore.id);
        setMembers(data);
    };

    const handleCreateInvite = async () => {
        if (!currentStore) return;
        setLoading(true);
        try {
            const code = await createInvite(currentStore.id);
            setInviteCode(code);
        } catch (e) {
            alert('초대 코드 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    const inviteLink = typeof window !== 'undefined' && inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

    if (!currentStore) return <Text>가게를 선택해주세요.</Text>;

    return (
        <Stack gap="lg">
            <Group justify="space-between">
                <div>
                    <Title order={2}>팀원 관리</Title>
                    <Text c="dimmed" size="sm">함께 일하는 동료를 초대하세요.</Text>
                </div>
            </Group>

            {/* Invite Section */}
            <Paper p="lg" radius="md" shadow="xs" withBorder>
                <Stack gap="sm">
                    <Title order={4}>직원 초대하기</Title>
                    {inviteCode ? (
                        <Stack gap="xs">
                            <Text size="sm" c="dimmed">아래 링크를 복사해서 메신저로 전달하세요.</Text>
                            <Group>
                                <Paper p="xs" bg="gray.0" withBorder style={{ flex: 1, overflow: 'hidden' }}>
                                    <Text size="sm" truncate>{inviteLink}</Text>
                                </Paper>
                                <CopyButton value={inviteLink}>
                                    {({ copied, copy }) => (
                                        <Button color={copied ? 'gray' : 'brandBlue'} onClick={copy}>
                                            {copied ? '복사됨' : '복사'}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                            <Text size="xs" c="red.5">이 링크는 24시간 동안 유효합니다.</Text>
                        </Stack>
                    ) : (
                        <Button
                            leftSection={<IconUserPlus size={18} />}
                            onClick={handleCreateInvite}
                            loading={loading}
                            color="navy"
                        >
                            초대 링크 생성
                        </Button>
                    )}
                </Stack>
            </Paper>

            {/* Member List */}
            <Stack gap="sm">
                <Text fw={600}>멤버 목록 ({members.length})</Text>
                {members.map((member) => (
                    <Paper key={member.id} p="md" radius="md" shadow="xs" withBorder>
                        <Group justify="space-between">
                            <Group gap="sm">
                                <Avatar color="navy" radius="md">{member.email?.slice(0, 2).toUpperCase()}</Avatar>
                                <div>
                                    <Text fw={600}>{member.email}</Text>
                                    <Badge size="sm" variant="light" color={member.role === 'owner' ? 'brandBlue' : 'gray'}>
                                        {member.role === 'owner' ? '관리자' : '직원'}
                                    </Badge>
                                </div>
                            </Group>
                            {/* Only owner can delete? */}
                            {member.role !== 'owner' && (
                                <ActionIcon color="red" variant="subtle">
                                    <IconTrash size={18} />
                                </ActionIcon>
                            )}
                        </Group>
                    </Paper>
                ))}
            </Stack>
        </Stack>
    );
}
