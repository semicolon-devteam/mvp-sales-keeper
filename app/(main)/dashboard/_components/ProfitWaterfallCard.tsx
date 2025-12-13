'use client';

import { Paper, Text, Group, Stack, Progress, ThemeIcon, Grid, Tooltip } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconCoin, IconUsers, IconBuildingStore, IconReceipt } from '@tabler/icons-react';
import type { FinancialSnapshot } from '../financial-actions';
import { formatCurrency } from '@/app/_shared/utils/format';

export function ProfitWaterfallCard({ data }: { data: FinancialSnapshot }) {
    // Calculate percentages for the bar
    // Total Revenue is 100% reference
    const revenue = data.revenue || 1; // avoid divide by zero
    const expensePct = (data.expenseCost / revenue) * 100;
    const laborPct = (data.laborCost / revenue) * 100;
    const fixedPct = (data.fixedCostDaily / revenue) * 100;
    const profitPct = (data.netProfit / revenue) * 100;

    // Color logic
    const isProfitPositive = data.netProfit >= 0;

    return (
        <Paper withBorder p="lg" radius="md" bg="gray.9">
            <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <ThemeIcon color="teal" variant="light" size="lg">
                        <IconCoin size={20} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" c="dimmed">오늘의 순수익</Text>
                        <Text fz="xl" fw={700} c={isProfitPositive ? 'teal.4' : 'red.4'}>
                            {formatCurrency(data.netProfit)}
                        </Text>
                    </div>
                </Group>
                <Text size="sm" c={isProfitPositive ? 'teal.4' : 'red.4'} fw={700}>
                    마진율 {data.profitMargin.toFixed(1)}%
                </Text>
            </Group>

            {/* Visual Waterfall / Breakdown Bar */}
            <Stack gap="xs" mb="xl">
                <Text size="xs" c="dimmed">매출 구성 (비용 분석)</Text>
                <Progress.Root size={24} radius="xl">
                    <Tooltip label={`재료비/지출: ${formatCurrency(data.expenseCost)} (${expensePct.toFixed(1)}%)`}>
                        <Progress.Section value={expensePct} color="green.6">
                            <Progress.Label>재료</Progress.Label>
                        </Progress.Section>
                    </Tooltip>
                    <Tooltip label={`인건비: ${formatCurrency(data.laborCost)} (${laborPct.toFixed(1)}%)`}>
                        <Progress.Section value={laborPct} color="blue.6">
                            <Progress.Label>인건</Progress.Label>
                        </Progress.Section>
                    </Tooltip>
                    <Tooltip label={`고정비(예상): ${formatCurrency(data.fixedCostDaily)} (${fixedPct.toFixed(1)}%)`}>
                        <Progress.Section value={fixedPct} color="gray.6">
                            <Progress.Label>고정</Progress.Label>
                        </Progress.Section>
                    </Tooltip>
                    {isProfitPositive && (
                        <Tooltip label={`순수익: ${formatCurrency(data.netProfit)} (${profitPct.toFixed(1)}%)`}>
                            <Progress.Section value={profitPct} color="teal.6">
                                <Progress.Label>수익</Progress.Label>
                            </Progress.Section>
                        </Tooltip>
                    )}
                </Progress.Root>
            </Stack>

            {/* Detailed Grid */}
            <Grid>
                <Grid.Col span={6}>
                    <Stack gap={4}>
                        <Group gap={6}>
                            <IconTrendingUp size={14} className="text-gray-400" />
                            <Text size="xs" c="white">총 매출</Text>
                        </Group>
                        <Text size="sm" fw={600} c="white">{formatCurrency(data.revenue)}</Text>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Stack gap={4}>
                        <Group gap={6}>
                            <IconReceipt size={14} color="#4ade80" />
                            <Text size="xs" c="green.4">재료비/지출</Text>
                        </Group>
                        <Text size="sm" fw={600} c="green.4">{formatCurrency(data.expenseCost)}</Text>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Stack gap={4}>
                        <Group gap={6}>
                            <IconUsers size={14} color="#60a5fa" />
                            <Text size="xs" c="blue.4">인건비</Text>
                        </Group>
                        <Text size="sm" fw={600} c="blue.4">{formatCurrency(data.laborCost)}</Text>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                    <Stack gap={4}>
                        <Group gap={6}>
                            <IconBuildingStore size={14} className="text-gray-400" />
                            <Text size="xs" c="white">고정비(하루)</Text>
                        </Group>
                        <Text size="sm" fw={600} c="white">{formatCurrency(data.fixedCostDaily)}</Text>
                    </Stack>
                </Grid.Col>
            </Grid>
        </Paper>
    );
}
