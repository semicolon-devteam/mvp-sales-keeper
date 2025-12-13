'use client';

import { Paper, Title, Text, Button, Group, Stack, Avatar, Badge, ActionIcon, Grid, Modal, TextInput, NumberInput, ColorInput } from '@mantine/core';
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react';
import { useStore } from '../../_contexts/store-context';
import { useEffect, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { getStoreMembers } from '../../store/members/actions';
import { updateMemberDetails } from '../actions';
import { createInvite } from '../../store/members/actions'; // Re-use invite logic

export function StaffList() {
    const { currentStore } = useStore();
    const [members, setMembers] = useState<any[]>([]);

    // Edit Modal State
    const [opened, { open, close }] = useDisclosure(false);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [editingMember, setEditingMember] = useState<any>(null);

    // Form State
    const [alias, setAlias] = useState('');
    const [hourlyWage, setHourlyWage] = useState<string | number>(9860);
    const [color, setColor] = useState('teal');

    useEffect(() => {
        if (currentStore) {
            refreshMembers();
        }
    }, [currentStore]);

    const refreshMembers = () => {
        if (currentStore) getStoreMembers(currentStore.id).then(setMembers);
    }

    const handleInvite = async () => {
        if (!currentStore) return;
        const code = await createInvite(currentStore.id);
        setInviteCode(code);
    };

    const handleEdit = (member: any) => {
        setEditingMember(member);
        setAlias(member.alias || '');
        setHourlyWage(member.hourly_wage || 9860);
        setColor(member.color || 'teal');
        open();
    };

    const handleSave = async () => {
        if (!editingMember) return;

        try {
            await updateMemberDetails(editingMember.id, alias, Number(hourlyWage), color);
            close();
            refreshMembers();
            setEditingMember(null);
        } catch (e: any) {
            console.error(e);
            alert('업데이트 실패: ' + e.message);
        }
    };

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Text size="lg" fw={700} c="white">직원 현황 ({members.length}명)</Text>
                {inviteCode ? (
                    <Button variant="light" color="yellow" onClick={() => setInviteCode(null)}>
                        초대코드: {inviteCode} (클릭하여 닫기)
                    </Button>
                ) : (
                    <Button leftSection={<IconPlus size={16} />} color="teal" variant="light" onClick={handleInvite}>
                        직원 초대하기
                    </Button>
                )}
            </Group>

            <Grid>
                {members.map((member) => (
                    <Grid.Col key={member.id} span={{ base: 12, md: 6, lg: 4 }}>
                        <Paper p="md" radius="md" bg="#1F2937" style={{ border: '1px solid #374151' }}>
                            <Group justify="space-between" align="flex-start">
                                <Group>
                                    <Avatar color={member.color || 'blue'} radius="xl" size="lg">
                                        {member.user_id ? (member.alias?.[0] || 'U') : 'E'}
                                    </Avatar>
                                    <Stack gap={0}>
                                        <Text fw={700} c="white">{member.alias || '직원 ' + member.user_id.slice(0, 4)}</Text>
                                        <Group gap={6}>
                                            <Badge size="xs" color={member.role === 'owner' ? 'grape' : 'blue'}>
                                                {member.role === 'owner' ? '사장님' : '매니저'}
                                            </Badge>
                                            <Text size="xs" c="dimmed">시급: {member.hourly_wage?.toLocaleString() || '9,860'}원</Text>
                                        </Group>
                                    </Stack>
                                </Group>
                                <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(member)}>
                                    <IconPencil size={18} />
                                </ActionIcon>
                            </Group>
                        </Paper>
                    </Grid.Col>
                ))}
            </Grid>

            <Modal opened={opened} onClose={close} title="직원 정보 수정" centered
                styles={{ header: { backgroundColor: '#1F2937', color: 'white' }, body: { backgroundColor: '#1F2937' } }}>
                <Stack>
                    <TextInput
                        label={<Text c="gray.3" size="sm">별칭 (이름)</Text>}
                        value={alias} onChange={(e) => setAlias(e.target.value)}
                        styles={{ input: { backgroundColor: '#374151', color: 'white', borderColor: '#4B5563' } }}
                    />
                    <NumberInput
                        label={<Text c="gray.3" size="sm">시급</Text>}
                        value={hourlyWage} onChange={setHourlyWage}
                        step={10} min={0}
                        styles={{ input: { backgroundColor: '#374151', color: 'white', borderColor: '#4B5563' } }}
                    />
                    <ColorInput
                        label={<Text c="gray.3" size="sm">캘린더 표시 색상</Text>}
                        value={color} onChange={setColor}
                        disallowInput
                        withPicker={false}
                        swatches={['#20c997', '#339af0', '#7950f2', '#f06595', '#ff922b', '#fa5252']}
                        styles={{ input: { backgroundColor: '#374151', color: 'white', borderColor: '#4B5563' } }}
                    />
                    <Button fullWidth color="teal" onClick={handleSave} mt="md">
                        저장하기
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
