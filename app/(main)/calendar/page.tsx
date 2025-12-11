'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Group, Paper, Stack, Indicator, Loader, ThemeIcon, Badge, Avatar, Tabs, ScrollArea, Box, Divider, Select, Center } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { getMonthlyData, getDailyDetails } from './actions';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { IconCoin, IconMessageCircle, IconBuildingStore } from '@tabler/icons-react';
import { useStore } from '../_contexts/store-context';
import { AIDailyBriefing } from './_components/AIDailyBriefing';
import { TimelineSummaryCard } from './_components/TimelineSummaryCard';
import { TimelineItem } from './_components/TimelineItem';

export default function CalendarPage() {
    const { currentStore, myStores } = useStore();

    // UI State: 'all' or specific store ID
    const [viewScope, setViewScope] = useState<string>('all');

    const [date, setDate] = useState<Date | null>(new Date());
    const [month, setMonth] = useState<Date>(new Date());
    const [data, setData] = useState<Record<string, { sales: number; expense: number }>>({});

    // Detailed Data
    const [details, setDetails] = useState<{ sales: any[], expenses: any[], posts: any[] }>({ sales: [], expenses: [], posts: [] });
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentStore) {
            setViewScope(currentStore.id);
        }
    }, [currentStore?.id]);

    const fetchData = async (targetMonth: Date, scope: string) => {
        setLoading(true);
        try {
            const result = await getMonthlyData(targetMonth, scope);
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (targetDate: Date, scope: string) => {
        setLoadingDetails(true);
        try {
            const dateStr = dayjs(targetDate).format('YYYY-MM-DD');
            const result = await getDailyDetails(dateStr, scope);
            setDetails(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        fetchData(month, viewScope);
    }, [month, viewScope]);

    useEffect(() => {
        if (date) {
            fetchDetails(date, viewScope);
        }
    }, [date, viewScope]);

    const handleMonthChange = (newMonth: Date) => {
        setMonth(newMonth);
    };

    const getDayProps = (date: Date) => ({
        selected: dayjs(date).isSame(date, 'date'),
        onClick: () => setDate(date),
    });

    // Helper: Get Day Status Color
    const getDayStatus = (date: Date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        const dayData = data[dateStr];
        if (!dayData) return null;

        const profit = dayData.sales - dayData.expense;
        if (dayData.sales === 0 && dayData.expense === 0) return null;

        if (profit > 0) return { bg: 'rgba(20, 184, 166, 0.15)', c: 'teal.4', border: '1px solid rgba(20, 184, 166, 0.3)' }; // Profit
        if (profit < 0) return { bg: 'rgba(239, 68, 68, 0.15)', c: 'red.4', border: '1px solid rgba(239, 68, 68, 0.3)' }; // Loss
        return { bg: 'rgba(255, 255, 255, 0.05)', c: 'gray.5', border: '1px solid rgba(255, 255, 255, 0.1)' }; // Break-even
    };

    const renderDay = (dayDate: Date) => {
        const status = getDayStatus(dayDate);
        const dateStr = dayjs(dayDate).format('YYYY-MM-DD');
        const dayData = data[dateStr];

        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: status?.bg || 'transparent',
                    border: status?.border || 'none',
                    borderRadius: 8,
                    position: 'relative'
                }}
            >
                <Text size="sm" c={status?.c || 'gray.4'}>{dayjs(dayDate).date()}</Text>

                {/* Desktop: Show Amount */}
                <Box visibleFrom="xs" style={{ fontSize: '10px', color: status?.c }}>
                    {dayData && (dayData.sales - dayData.expense > 0 ? '+' : '')}
                    {dayData && Math.round((dayData.sales - dayData.expense) / 10000) + '만'}
                </Box>
            </div>
        );
    };

    const selectedData = date ? data[dayjs(date).format('YYYY-MM-DD')] : null;

    // Monthly Totals Calculation
    const monthlyTotalSales = Object.values(data).reduce((acc, curr) => acc + curr.sales, 0);
    const monthlyTotalExpense = Object.values(data).reduce((acc, curr) => acc + curr.expense, 0);
    const monthlyProfit = monthlyTotalSales - monthlyTotalExpense;

    // Dropdown Data
    const selectData = [
        { value: 'all', label: '전체 매장 합계' },
        ...myStores.map(s => ({ value: s.id, label: s.name }))
    ];

    if (loading && Object.keys(data).length === 0) {
        return <Center h="50vh"><Loader color="teal" /></Center>;
    }

    return (
        <Stack gap="lg" pb={100}>
            {/* Header with Selector & Monthly Summary */}
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Select
                        variant="unstyled"
                        size="md"
                        styles={{
                            input: { fontSize: 22, fontWeight: 800, color: 'white' },
                            dropdown: { color: 'black' }
                        }}
                        value={viewScope}
                        onChange={(val) => val && setViewScope(val)}
                        data={selectData}
                        allowDeselect={false}
                        leftSection={<IconBuildingStore size={22} color="white" />}
                    />
                    <Text size="sm" c="dimmed" fw={600}>
                        {dayjs(month).format('YYYY년 M월')}
                    </Text>
                </Group>

                {/* Monthly Summary Card */}
                <Paper p="md" radius="lg" bg="#111C44" style={{ border: '1px solid #2C2E33' }}>
                    <Group grow>
                        <Stack gap={0} align="center">
                            <Text size="xs" c="gray.5">총 매출</Text>
                            <Text fw={700} c="white" size="md">{monthlyTotalSales.toLocaleString()}</Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack gap={0} align="center">
                            <Text size="xs" c="gray.5">순수익</Text>
                            <Text fw={800} c={monthlyProfit >= 0 ? 'teal.4' : 'red.4'} size="lg">
                                {monthlyProfit.toLocaleString()}
                            </Text>
                        </Stack>
                        <Divider orientation="vertical" />
                        <Stack gap={0} align="center">
                            <Text size="xs" c="gray.5">마진율</Text>
                            <Text fw={700} c="blue.4" size="md">
                                {monthlyTotalSales > 0 ? Math.round((monthlyProfit / monthlyTotalSales) * 100) : 0}%
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            </Stack>

            {/* Calendar Card */}
            <Paper radius="xl" p="xs" shadow="sm" bg="#1F2937" style={{ border: '1px solid #374151' }}>
                <Calendar
                    static
                    value={date}
                    onChange={setDate}
                    onDateChange={handleMonthChange}
                    getDayProps={getDayProps}
                    renderDay={renderDay}
                    styles={{
                        calendarHeader: { color: 'white', maxWidth: '100%' },
                        day: { height: 56, borderRadius: 8, fontSize: 14, color: 'white' },
                        cell: { padding: 2 },
                        calendarHeaderLevel: { color: 'white', fontWeight: 700 },
                        calendarHeaderControl: { color: 'gray' }
                    }}
                    locale="ko"
                />
            </Paper>

            {/* Daily Summary & Details */}
            {date && (
                <Stack gap="md" className="fade-in">
                    <Group align="center" gap="xs">
                        <Text size="lg" fw={800} c="white">
                            {dayjs(date).format('M월 D일 dddd')}
                        </Text>
                        <Badge variant="light" color={selectedData && selectedData.sales - selectedData.expense >= 0 ? 'teal' : 'red'}>
                            {selectedData ? (selectedData.sales - selectedData.expense >= 0 ? '흑자 😊' : '적자 😓') : '데이터 없음'}
                        </Badge>
                    </Group>

                    {/* AI Briefing Component */}
                    {selectedData && (
                        <AIDailyBriefing
                            date={date}
                            sales={selectedData.sales}
                            expense={selectedData.expense}
                        />
                    )}

                    {/* Tabs for Details vs Timeline */}
                    <Tabs defaultValue="sales" variant="pills" radius="xl" color="teal">
                        <Tabs.List grow mb="md">
                            <Tabs.Tab value="sales" c="white">매출</Tabs.Tab>
                            <Tabs.Tab value="expenses" c="white">지출</Tabs.Tab>
                            <Tabs.Tab value="timeline" disabled={viewScope === 'all'} c="white">
                                타임라인 {viewScope === 'all' && '(개별 매장 전용)'}
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="sales">
                            <Stack gap="sm">
                                <Text fw={700} size="md" c="gray.3">매출 ({details.sales.length})</Text>
                                {loadingDetails ? <Loader size="sm" mx="auto" color="teal" /> :
                                    details.sales.length > 0 ? (
                                        details.sales.map((sale: any) => (
                                            <Paper key={sale.id} shadow="sm" radius="lg" p="md" bg="#1F2937" style={{ border: '1px solid #374151' }}>
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <ThemeIcon color="teal" variant="light" radius="xl" size="md">
                                                            <IconCoin size={16} />
                                                        </ThemeIcon>
                                                        <Text size="sm" fw={600} c="white">{sale.type === 'manual' ? '직접 입력' : '엑셀 업로드'}</Text>
                                                    </Group>
                                                    <Text fw={700} c="teal.4">+{sale.amount.toLocaleString()}원</Text>
                                                </Group>
                                            </Paper>
                                        ))
                                    ) : <Text c="dimmed" size="sm" ta="center">내역 없음</Text>}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="expenses">
                            <Stack gap="sm">
                                <Text fw={700} size="md" c="gray.3">지출 ({details.expenses.length})</Text>
                                {loadingDetails ? <Loader size="sm" mx="auto" color="teal" /> :
                                    details.expenses.length > 0 ? (
                                        details.expenses.map((expense: any) => (
                                            <Paper key={expense.id} shadow="sm" radius="lg" p="md" bg="#1F2937" style={{ border: '1px solid #374151' }}>
                                                <Group justify="space-between">
                                                    <Group gap="sm">
                                                        <Avatar radius="xl" size="md" color="red" variant="light">
                                                            {expense.merchant_name?.[0]}
                                                        </Avatar>
                                                        <Stack gap={2}>
                                                            <Text size="sm" fw={600} c="white">{expense.merchant_name}</Text>
                                                            <Text size="xs" c="gray.4">{expense.category}</Text>
                                                        </Stack>
                                                    </Group>
                                                    <Text fw={700} c="red.4">-{expense.amount.toLocaleString()}원</Text>
                                                </Group>
                                            </Paper>
                                        ))
                                    ) : <Text c="dimmed" size="sm" ta="center">내역 없음</Text>}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="timeline">
                            <Stack gap="sm">
                                <TimelineSummaryCard date={date || new Date()} posts={details.posts} />

                                <Text size="sm" c="dimmed" px="xs">그날의 특이사항이나 기록을 확인하세요.</Text>
                                {loadingDetails ? <Loader size="sm" mx="auto" color="teal" /> :
                                    details.posts.length > 0 ? (
                                        details.posts.map((post: any) => (
                                            <TimelineItem key={post.id} post={post} />
                                        ))
                                    ) : (
                                        <Paper radius="lg" p="xl" bg="rgba(255,255,255,0.05)" withBorder={false}>
                                            <Text ta="center" c="dimmed">작성된 기록이 없습니다.</Text>
                                        </Paper>
                                    )}
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>
                </Stack>
            )}
        </Stack>
    );
}
