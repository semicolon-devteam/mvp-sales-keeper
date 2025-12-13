'use client';

import {
    Paper, Text, Stack, Group, ThemeIcon, Badge, Skeleton,
    RingProgress, SimpleGrid, Collapse, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconBrain, IconTrendingUp, IconTrendingDown, IconMinus,
    IconAlertTriangle, IconChevronDown, IconChevronUp,
    IconFlame, IconStar, IconCoin, IconRefresh
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { generateWeeklyInsight, type WeeklyInsight } from '../insight-actions';

interface WeeklyInsightCardProps {
    storeId?: string;
}

export function WeeklyInsightCard({ storeId }: WeeklyInsightCardProps) {
    const [insight, setInsight] = useState<WeeklyInsight | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadInsight = async () => {
        if (!storeId) {
            setLoading(false);
            setError('매장을 먼저 선택해주세요.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await generateWeeklyInsight(storeId);
            if (result.success && result.data) {
                setInsight(result.data);
            } else {
                setError(result.error || '인사이트 로딩 실패');
            }
        } catch (err: any) {
            console.error('WeeklyInsightCard error:', err);
            setError('일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInsight();
    }, [storeId]);

    if (loading) {
        return (
            <Paper p="md" radius="lg" bg="rgba(79, 70, 229, 0.08)" style={{ border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                <Stack gap="sm">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color="indigo" size="sm">
                            <IconBrain size={14} />
                        </ThemeIcon>
                        <Skeleton height={16} width={150} />
                    </Group>
                    <SimpleGrid cols={3}>
                        <Skeleton height={80} radius="md" />
                        <Skeleton height={80} radius="md" />
                        <Skeleton height={80} radius="md" />
                    </SimpleGrid>
                    <Skeleton height={60} radius="md" />
                </Stack>
            </Paper>
        );
    }

    if (error || !insight) {
        return (
            <Paper p="md" radius="lg" bg="rgba(255, 107, 107, 0.08)" style={{ border: '1px solid rgba(255, 107, 107, 0.2)' }}>
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconAlertTriangle size={16} color="#fa5252" />
                        <Text size="sm" c="red.3">{error || '데이터를 불러올 수 없습니다.'}</Text>
                    </Group>
                    <Tooltip label="다시 시도">
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={loadInsight}>
                            <IconRefresh size={14} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Paper>
        );
    }

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <IconTrendingUp size={14} color="#20c997" />;
            case 'down': return <IconTrendingDown size={14} color="#fa5252" />;
            default: return <IconMinus size={14} color="#868e96" />;
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'teal';
        if (score >= 60) return 'yellow';
        return 'red';
    };

    return (
        <Paper
            p="md"
            radius="lg"
            style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
                border: '1px solid rgba(79, 70, 229, 0.2)'
            }}
        >
            <Stack gap="md">
                {/* Header */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <ThemeIcon variant="gradient" gradient={{ from: 'indigo', to: 'grape' }} size="sm" radius="xl">
                            <IconBrain size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={700} c="white">주간 AI 인사이트</Text>
                        <Badge size="xs" variant="light" color="indigo">{insight.weekLabel}</Badge>
                    </Group>
                    <Group gap={4}>
                        <Tooltip label="새로고침">
                            <ActionIcon variant="subtle" color="gray" size="sm" onClick={loadInsight}>
                                <IconRefresh size={14} />
                            </ActionIcon>
                        </Tooltip>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                    </Group>
                </Group>

                {/* Quick Stats */}
                <SimpleGrid cols={3} spacing="sm">
                    {/* Sales Trend */}
                    <Paper p="sm" radius="md" bg="rgba(0,0,0,0.2)">
                        <Stack gap={4} align="center">
                            <Group gap={4}>
                                <IconCoin size={14} color="#ffd43b" />
                                <Text size="xs" c="dimmed">매출</Text>
                            </Group>
                            <Group gap={4} align="center">
                                {getTrendIcon(insight.salesTrend.direction)}
                                <Text size="sm" fw={700} c={insight.salesTrend.direction === 'up' ? 'teal' : insight.salesTrend.direction === 'down' ? 'red' : 'gray'}>
                                    {insight.salesTrend.changePercent > 0 ? '+' : ''}{insight.salesTrend.changePercent.toFixed(1)}%
                                </Text>
                            </Group>
                            <Text size="xs" c="dimmed">{insight.salesTrend.value.toLocaleString()}원</Text>
                        </Stack>
                    </Paper>

                    {/* Margin Health */}
                    <Paper p="sm" radius="md" bg="rgba(0,0,0,0.2)">
                        <Stack gap={4} align="center">
                            <Group gap={4}>
                                <IconFlame size={14} color="#fa5252" />
                                <Text size="xs" c="dimmed">마진 건강도</Text>
                            </Group>
                            <RingProgress
                                size={40}
                                thickness={4}
                                sections={[{ value: insight.marginHealth.score, color: getHealthColor(insight.marginHealth.score) }]}
                                label={
                                    <Text ta="center" size="xs" fw={700} c={getHealthColor(insight.marginHealth.score)}>
                                        {insight.marginHealth.score}
                                    </Text>
                                }
                            />
                            <Text size="xs" c="dimmed">{insight.marginHealth.dangerCount}개 위험</Text>
                        </Stack>
                    </Paper>

                    {/* Top Performer */}
                    <Paper p="sm" radius="md" bg="rgba(0,0,0,0.2)">
                        <Stack gap={4} align="center">
                            <Group gap={4}>
                                <IconStar size={14} color="#ffd43b" />
                                <Text size="xs" c="dimmed">이번주 효자</Text>
                            </Group>
                            <Text size="sm" fw={700} c="yellow" lineClamp={1} ta="center">
                                {insight.topPerformer.name || '-'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {insight.topPerformer.profit > 0 ? `+${insight.topPerformer.profit.toLocaleString()}원` : '-'}
                            </Text>
                        </Stack>
                    </Paper>
                </SimpleGrid>

                <Collapse in={expanded}>
                    <Stack gap="sm">
                        {/* AI Summary */}
                        <Paper p="sm" radius="md" bg="rgba(0,0,0,0.3)">
                            <Text size="sm" c="gray.3" style={{ lineHeight: 1.6 }}>
                                {insight.aiSummary}
                            </Text>
                        </Paper>

                        {/* Key Insights */}
                        {insight.keyInsights.length > 0 && (
                            <Stack gap={6}>
                                <Text size="xs" c="dimmed" fw={600}>핵심 인사이트:</Text>
                                {insight.keyInsights.map((item, idx) => (
                                    <Group key={idx} gap={6} align="flex-start">
                                        <Text size="xs" c="indigo.3">{item.icon}</Text>
                                        <Text size="xs" c="gray.4" style={{ flex: 1 }}>{item.text}</Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}

                        {/* Recommendations */}
                        {insight.recommendations.length > 0 && (
                            <Stack gap={6}>
                                <Text size="xs" c="dimmed" fw={600}>추천 액션:</Text>
                                {insight.recommendations.map((rec, idx) => (
                                    <Paper key={idx} p="xs" radius="sm" bg="rgba(79, 70, 229, 0.1)">
                                        <Group gap={6}>
                                            <Badge size="xs" color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'gray'}>
                                                {rec.priority === 'high' ? '긴급' : rec.priority === 'medium' ? '권장' : '참고'}
                                            </Badge>
                                            <Text size="xs" c="gray.3">{rec.action}</Text>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}
