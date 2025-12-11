'use client';

import { Paper, Text, Button, Stack, Loader, Group, ThemeIcon, Transition } from '@mantine/core';
import { IconSparkles, IconRobot } from '@tabler/icons-react';
import { useState } from 'react';
import { generateDailyBriefing } from '../ai-actions';

interface AIDailyBriefingProps {
    date: Date;
    sales: number;
    expense: number;
}

export function AIDailyBriefing({ date, sales, expense }: AIDailyBriefingProps) {
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await generateDailyBriefing(date.toISOString(), sales, expense);
            setBriefing(result);
        } catch (error) {
            console.error(error);
            setBriefing("죄송합니다. AI 분석 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // If no sales data, don't show analysis button (unless we want to analyze why 0 sales?)
    if (sales === 0 && expense === 0) return null;

    return (
        <Paper
            radius="lg"
            p="md"
            bg="rgba(124, 58, 237, 0.1)" // Faint Violet
            style={{ border: '1px solid rgba(124, 58, 237, 0.3)' }}
        >
            {!briefing ? (
                <Stack align="center" gap="xs">
                    <Group>
                        <ThemeIcon variant="light" color="violet" radius="xl" size="lg">
                            <IconSparkles size={20} />
                        </ThemeIcon>
                        <Text fw={700} c="violet.2">AI 매니저의 하루 분석</Text>
                    </Group>
                    <Text size="sm" c="dimmed" ta="center">
                        오늘의 장부 내역을 분석하여<br />인사이트를 제공해드립니다.
                    </Text>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'indigo' }}
                        onClick={handleAnalyze}
                        loading={loading}
                        leftSection={<IconRobot size={18} />}
                        fullWidth
                        radius="md"
                    >
                        AI 분석 시작하기
                    </Button>
                </Stack>
            ) : (
                <Transition mounted={true} transition="fade" duration={400}>
                    {(styles) => (
                        <Stack style={styles} gap="sm">
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <IconRobot size={20} color="#a78bfa" />
                                    <Text fw={700} c="violet.2">AI 분석 리포트</Text>
                                </Group>
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    size="xs"
                                    onClick={() => setBriefing(null)}
                                >
                                    닫기
                                </Button>
                            </Group>
                            <Text size="sm" c="gray.3" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                {briefing}
                            </Text>
                        </Stack>
                    )}
                </Transition>
            )}
        </Paper>
    );
}
