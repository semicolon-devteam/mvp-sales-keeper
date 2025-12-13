'use client';

import { Paper, Text, Group, RingProgress, Center, Stack } from '@mantine/core';
import { IconGauge, IconUserBolt } from '@tabler/icons-react';
import type { FinancialSnapshot } from '../financial-actions';
import { formatCurrency } from '@/app/_shared/utils/format';

export function EfficiencyGauge({ data }: { data: FinancialSnapshot }) {
    // RPH Target: 30,000 KRW/hr is "break even", 50,000 is good.
    // Let's normalize it to a 0-100 score where 50,000 is 100%.
    const target = 50000;
    const score = Math.min(100, Math.max(0, (data.rph / target) * 100));

    // Color logic
    let color = 'gray';
    if (data.rph > 40000) color = 'teal';
    else if (data.rph > 20000) color = 'yellow';
    else if (data.rph > 0) color = 'red';

    return (
        <Paper withBorder p="lg" radius="md" bg="gray.9">
            <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed" fw={600}>직원 효율성 (RPH)</Text>
                <IconUserBolt size={18} className="text-gray-500" />
            </Group>

            <Group align="center">
                <RingProgress
                    size={100}
                    thickness={10}
                    roundCaps
                    sections={[{ value: score, color }]}
                    label={
                        <Center>
                            <IconGauge size={24} style={{ opacity: 0.7 }} />
                        </Center>
                    }
                />
                <Stack gap={0}>
                    <Text size="xs" c="dimmed">시간당 매출 (효율)</Text>
                    <Text size="xl" fw={700} c={color}>
                        {formatCurrency(data.rph)}
                    </Text>
                    <Text size="xs" c="dimmed">
                        목표 달성률: {Math.round(score)}%
                    </Text>
                </Stack>
            </Group>
        </Paper>
    );
}
