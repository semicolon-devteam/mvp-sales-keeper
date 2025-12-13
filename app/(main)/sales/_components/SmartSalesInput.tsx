'use client';

import { useState, useEffect } from 'react';
import { Text, Group, Transition, ThemeIcon, Stack, Paper, Box } from '@mantine/core';
import { IconRobot, IconAlertTriangle, IconTrophy } from '@tabler/icons-react';
import { getSalesStats, type SalesStats } from '../sales-stats-action';
import { formatCurrency } from '@/app/_shared/utils/format';
// CalculatorInput is in the same folder? Yes: sales/_components/CalculatorInput.tsx
import { CalculatorInput as InnerCalculatorInput } from './CalculatorInput';

type Props = {
    storeId: string | undefined;
    date: Date;
    value: string | number;
    onChange: (value: string | number) => void;
    onSubmit?: (value: string | number) => void;
};

export function SmartSalesInput({ storeId, date, value, onChange, onSubmit }: Props) {
    const [stats, setStats] = useState<SalesStats | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'warning' | 'celebrate' | 'info' | null }>({ text: '', type: null });

    // Fetch stats on mount or date change
    useEffect(() => {
        if (!storeId) return;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        getSalesStats(storeId, dateStr).then(setStats);
    }, [storeId, date]);

    // Analyze Input
    useEffect(() => {
        const amount = Number(value);
        if (!amount || !stats) {
            setMessage({ text: '', type: null });
            return;
        }

        const { average, maxRecord, lastWeekSameDay } = stats;

        // 1. Typo Check (Extreme Outliers)
        // If > 3x average (and average is significant > 100k)
        if (average > 100000 && amount > average * 3) {
            setMessage({
                text: `평소보다 3배나 높아요! (${formatCurrency(average)}). 0을 하나 더 치셨나요?`,
                type: 'warning'
            });
            return;
        }

        // 2. Celebration (Records)
        if (maxRecord > 0 && amount > maxRecord) {
            setMessage({
                text: `와우! 역대 최고 매출 갱신입니다! 🎉 (${formatCurrency(maxRecord)} 돌파)`,
                type: 'celebrate'
            });
            return;
        }

        // 3. Motivation (vs Last Week)
        if (lastWeekSameDay > 0 && amount > lastWeekSameDay) {
            const diff = amount - lastWeekSameDay;
            const pct = Math.round((diff / lastWeekSameDay) * 100);
            setMessage({
                text: `지난주 같은 요일보다 ${pct}% 더 높아요! (+${formatCurrency(diff)})`,
                type: 'celebrate'
            });
            return;
        }

        // 4. Context (vs Average)
        if (average > 0 && amount > average) {
            setMessage({
                text: `평균(${formatCurrency(average)})을 넘겼습니다! 나이스! 👍`,
                type: 'info'
            });
            return;
        }

        // Reset if normal
        setMessage({ text: '', type: null });

    }, [value, stats]);

    return (
        <Stack gap={4} className="relative">
            {/* AI Bubble */}
            <Transition mounted={!!message.type} transition="slide-up" duration={200} timingFunction="ease">
                {(styles) => (
                    <Paper
                        shadow="md"
                        radius="md"
                        p="xs"
                        style={{ ...styles, position: 'absolute', top: -50, left: 0, right: 0, zIndex: 10 }}
                        bg={message.type === 'warning' ? 'red.9' : message.type === 'celebrate' ? 'teal.9' : 'blue.9'}
                    >
                        <Group gap="xs">
                            <ThemeIcon
                                size="sm"
                                color={message.type === 'warning' ? 'red' : message.type === 'celebrate' ? 'teal' : 'blue'}
                                variant="light"
                            >
                                {message.type === 'warning' ? <IconAlertTriangle size={14} /> :
                                    message.type === 'celebrate' ? <IconTrophy size={14} /> :
                                        <IconRobot size={14} />}
                            </ThemeIcon>
                            <Text size="xs" fw={700} c="white" style={{ flex: 1 }}>
                                {message.text}
                            </Text>
                        </Group>
                        {/* Little Triangle Pointer */}
                        <Box
                            style={{
                                position: 'absolute',
                                bottom: -6,
                                left: 24,
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: `6px solid ${message.type === 'warning' ? '#7f1d1d' : message.type === 'celebrate' ? '#134e4a' : '#1e3a8a'}` // Tailwind colors approx
                            }}
                        />
                    </Paper>
                )}
            </Transition>

            <InnerCalculatorInput
                value={Number(value)}
                onChange={(val) => onChange(val.toString())}
                onSubmit={(val) => onSubmit && onSubmit(val.toString())}
            />
        </Stack>
    );
}
