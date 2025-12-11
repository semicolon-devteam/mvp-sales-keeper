import { Paper, Text, Group, Stack, RingProgress, Center, ThemeIcon, SimpleGrid } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconArrowDownRight, IconArrowUpRight, IconChartPie } from '@tabler/icons-react';
import { Expense } from '../_repositories/expenses-repository';

interface ExpenseAnalyticsProps {
    expenses: Expense[];
}

export function ExpenseAnalytics({ expenses }: ExpenseAnalyticsProps) {
    // 1. Calculate Total
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

    // 2. Group by Category
    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
        const cat = e.category || '미분류';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amount;
    });

    // 3. Format for Donut Chart
    const chartData = Object.entries(categoryMap)
        .map(([name, value], index) => ({
            name,
            value,
            color: ['indigo.6', 'blue.6', 'teal.6', 'grape.6', 'orange.6', 'gray.6'][index % 6]
        }))
        .sort((a, b) => b.value - a.value);

    // Mock Comparison (In real app, fetch last month's data)
    const lastMonthTotal = totalAmount * 1.15; // Simulate we saved 15%
    const diff = totalAmount - lastMonthTotal;
    const percent = Math.round((diff / lastMonthTotal) * 100);
    const isSaving = diff < 0;

    return (
        <Stack>
            {/* Summary Cards */}
            <SimpleGrid cols={2}>
                <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                    <Text size="xs" c="gray.5" fw={700}>총 지출</Text>
                    <Text size="xl" c="white" fw={800} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {totalAmount.toLocaleString()}원
                    </Text>
                    <Group gap={4} mt={4}>
                        <ThemeIcon size="xs" variant="transparent" color={isSaving ? 'teal' : 'red'}>
                            {isSaving ? <IconArrowDownRight /> : <IconArrowUpRight />}
                        </ThemeIcon>
                        <Text size="xs" c={isSaving ? 'teal' : 'red'} fw={600}>
                            {Math.abs(percent)}% {isSaving ? '절약' : '증가'}
                        </Text>
                        <Text size="xs" c="dimmed">vs 지난달</Text>
                    </Group>
                </Paper>

                <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                    <Text size="xs" c="gray.5" fw={700}>최다 지출</Text>
                    <Text size="xl" c="white" fw={800}>
                        {chartData[0]?.name || '-'}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {chartData[0] ? `${Math.round((chartData[0].value / totalAmount) * 100)}% 비중` : '내역 없음'}
                    </Text>
                </Paper>
            </SimpleGrid>

            {/* Chart Section */}
            {totalAmount > 0 && (
                <Paper p="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Group gap="xs">
                                <IconChartPie size={18} opacity={0.5} />
                                <Text size="sm" fw={700}>카테고리별 지출</Text>
                            </Group>
                        </Group>

                        <Group align="center" justify="center" gap="xl">
                            <DonutChart
                                data={chartData}
                                size={160}
                                thickness={20}
                                withTooltip
                                tooltipDataSource="segment"
                            />

                            {/* Legend */}
                            <Stack gap={4}>
                                {chartData.slice(0, 4).map((item) => (
                                    <Group key={item.name} gap="xs">
                                        <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: `var(--mantine-color-${item.color})` }} />
                                        <Text size="xs" c="dimmed" style={{ width: 60 }}>{item.name}</Text>
                                        <Text size="xs" fw={600}>{Math.round((item.value / totalAmount) * 100)}%</Text>
                                    </Group>
                                ))}
                            </Stack>
                        </Group>
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}
