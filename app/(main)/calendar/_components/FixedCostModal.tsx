'use client';

import { Modal, Stack, TextInput, NumberInput, Button, Group, Text, ActionIcon, Table, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { addFixedCost, deleteFixedCost } from '../actions';
import { notifications } from '@mantine/notifications';

interface FixedCostModalProps {
    opened: boolean;
    onClose: () => void;
    storeId: string;
    existingCosts: any[];
    onUpdate: () => void;
}

export function FixedCostModal({ opened, onClose, storeId, existingCosts, onUpdate }: FixedCostModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            name: '',
            amount: 0,
            day_of_month: 25, // Default payday
        },
        validate: {
            name: (val) => val.length < 1 ? '이름을 입력하세요' : null,
            amount: (val) => val <= 0 ? '금액을 입력하세요' : null,
            day_of_month: (val) => (val < 1 || val > 31) ? '올바른 날짜를 입력하세요' : null,
        }
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (!storeId || storeId === 'all') {
            notifications.show({ title: '매장 선택 필요', message: '특정 매장을 선택해주세요.', color: 'red' });
            return;
        }

        setLoading(true);
        try {
            await addFixedCost({
                store_id: storeId,
                name: values.name,
                amount: values.amount,
                day_of_month: values.day_of_month,
                category: '고정비'
            });
            notifications.show({ title: '등록 완료', message: '고정지출이 등록되었습니다.', color: 'teal' });
            form.reset();
            onUpdate();
        } catch (error) {
            console.error(error);
            notifications.show({ title: '오류', message: '등록 중 오류가 발생했습니다.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        setLoading(true);
        try {
            await deleteFixedCost(id);
            notifications.show({ title: '삭제 완료', message: '삭제되었습니다.', color: 'gray' });
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="⚙️ 고정지출 관리"
            centered
            styles={{
                header: { backgroundColor: '#1F2937', color: 'white' },
                content: { backgroundColor: '#1F2937', border: '1px solid #374151' },
                close: { color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }
            }}
        >
            <Stack gap="lg">
                <LoadingOverlay visible={loading} />

                {/* Input Form */}
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="sm" p="sm" bg="rgba(0,0,0,0.2)" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} c="dimmed">새로운 고정지출 추가</Text>
                        <TextInput
                            placeholder="항목명 (예: 월세, 알바비)"
                            {...form.getInputProps('name')}
                        />
                        <Group grow>
                            <NumberInput
                                placeholder="금액"
                                thousandSeparator
                                suffix="원"
                                {...form.getInputProps('amount')}
                            />
                            <NumberInput
                                placeholder="매월 일자"
                                min={1} max={31}
                                suffix="일"
                                {...form.getInputProps('day_of_month')}
                            />
                        </Group>
                        <Button type="submit" variant="light" color="teal" leftSection={<IconPlus size={16} />}>
                            추가하기
                        </Button>
                    </Stack>
                </form>

                {/* List */}
                <Stack gap="xs">
                    <Text size="sm" fw={700} c="dimmed">등록된 리스트 ({existingCosts.length})</Text>
                    {existingCosts.length === 0 ? (
                        <Text size="sm" ta="center" c="dimmed" py="md">등록된 고정지출이 없습니다.</Text>
                    ) : (
                        <Stack gap="xs">
                            {existingCosts.map((cost) => (
                                <Group key={cost.id} justify="space-between" p="xs" bg="#1F2937" style={{ borderRadius: 8, border: '1px solid #374151' }}>
                                    <Stack gap={0}>
                                        <Group gap="xs">
                                            <Text fw={700} c="white">{cost.name}</Text>
                                            <Text size="xs" c="teal.4">매월 {cost.day_of_month}일</Text>
                                        </Group>
                                        <Text size="sm" c="gray.4">{cost.amount.toLocaleString()}원</Text>
                                    </Stack>
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(cost.id)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Modal>
    );
}
