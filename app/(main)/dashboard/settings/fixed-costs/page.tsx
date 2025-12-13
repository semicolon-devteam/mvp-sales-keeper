'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Button, TextInput, NumberInput, Stack, Group, Card, ActionIcon, Alert, Container } from '@mantine/core';
import { IconTrash, IconInfoCircle, IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { submitFixedCost, removeFixedCost, getFixedCostList } from '../../actions'; // Import from dashboard actions
import { FixedCost } from '../../_repositories/fixed-cost-repository';

export default function FixedCostSettingsPage() {
    const router = useRouter();
    const [costs, setCosts] = useState<FixedCost[]>([]);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState<string | number>('');
    const [loading, setLoading] = useState(false);

    const fetchCosts = async () => {
        const result = await getFixedCostList();
        setCosts(result);
    };

    useEffect(() => {
        fetchCosts();
    }, []);

    const handleAdd = async () => {
        if (!name || !amount) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('amount', amount.toString());

        await submitFixedCost(formData);

        setName('');
        setAmount('');
        await fetchCosts();
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        await removeFixedCost(id);
        await fetchCosts();
    };

    const totalMonthly = costs.reduce((acc, curr) => acc + curr.amount, 0);
    const dailyAmortized = Math.floor(totalMonthly / 30);

    return (
        <Stack gap="lg">
            <Group>
                <ActionIcon variant="subtle" onClick={() => router.back()}>
                    <IconArrowLeft size={24} />
                </ActionIcon>
                <Title order={3}>고정비 관리</Title>
            </Group>

            <Alert icon={<IconInfoCircle size={16} />} title="고정비란?" color="blue">
                월세, 인건비, 보험료 등 매달 숨만 쉬어도 나가는 돈을 입력하세요.
                <br />
                <strong>총 금액을 30일로 나누어 매일의 순이익에서 차감합니다.</strong>
            </Alert>

            {/* Summary */}
            <Card withBorder radius="md" bg="gray.0">
                <Group justify="space-between">
                    <Text size="sm">월 합계</Text>
                    <Text fw={700}>{totalMonthly.toLocaleString()}원</Text>
                </Group>
                <Group justify="space-between" mt="xs">
                    <Text size="sm" c="red">하루 고정비 (÷30)</Text>
                    <Text fw={700} c="red">-{dailyAmortized.toLocaleString()}원</Text>
                </Group>
            </Card>

            {/* Input Form */}
            <Card withBorder radius="md">
                <Stack gap="md">
                    <TextInput
                        label="항목 이름"
                        placeholder="예: 월세"
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                    />
                    <NumberInput
                        label="월 금액"
                        placeholder="0"
                        suffix="원"
                        value={amount}
                        onChange={setAmount}
                    />
                    <Button onClick={handleAdd} loading={loading} disabled={!name || !amount}>
                        추가하기
                    </Button>
                </Stack>
            </Card>

            {/* List */}
            <Stack gap="sm">
                <Text size="sm" fw={700} c="dimmed">등록된 항목</Text>
                {costs.map((cost) => (
                    <Card key={cost.id} shadow="sm" radius="md" padding="sm" withBorder>
                        <Group justify="space-between">
                            <Stack gap={0}>
                                <Text fw={500}>{cost.name}</Text>
                                <Text size="sm" c="dimmed">{cost.amount.toLocaleString()}원</Text>
                            </Stack>
                            <ActionIcon color="red" variant="light" onClick={() => handleDelete(cost.id)}>
                                <IconTrash size={18} />
                            </ActionIcon>
                        </Group>
                    </Card>
                ))}
                {costs.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                        등록된 고정비가 없습니다.
                    </Text>
                )}
            </Stack>
        </Stack>
    );
}
