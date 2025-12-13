'use client';

import {
    Paper, Stack, Text, Group, ThemeIcon, Badge, Button,
    Skeleton, Collapse, ActionIcon, Tooltip
} from '@mantine/core';
import {
    IconBrain, IconBulb, IconTrendingUp, IconTrendingDown,
    IconRefresh, IconChevronDown, IconChevronUp, IconCoin,
    IconTarget, IconAlertTriangle, IconSparkles
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { generateMenuStrategy, type MenuStrategyAdvice } from '../live-cost-actions';

interface AiStrategyCoachProps {
    menu: {
        id: string;
        name: string;
        price: number;
        cost: number;
        margin: number;
        quantity: number;
        totalProfit: number;
        type: string; // BCG type: star, cashcow, gem, dog
    };
    storeId?: string;
}

export function AiStrategyCoach({ menu, storeId }: AiStrategyCoachProps) {
    const [advice, setAdvice] = useState<MenuStrategyAdvice | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAdvice = async () => {
        if (!menu) return;

        setLoading(true);
        setError(null);

        try {
            const response = await generateMenuStrategy({
                menuName: menu.name,
                sellingPrice: menu.price,
                currentCost: menu.cost,
                marginPercent: menu.margin,
                salesQuantity: menu.quantity,
                totalProfit: menu.totalProfit,
                bcgType: menu.type,
                storeId
            });

            if (response.success && response.data) {
                setAdvice(response.data);
            } else {
                setError(response.error || 'AI 분석에 실패했습니다.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (menu && menu.cost > 0) {
            loadAdvice();
        }
    }, [menu?.id]);

    // 원가 미입력 시
    if (menu.cost === 0) {
        return (
            <Paper p="md" radius="md" bg="rgba(255, 107, 107, 0.1)" style={{ border: '1px solid #fa5252' }}>
                <Group>
                    <IconAlertTriangle color="#fa5252" />
                    <Stack gap={2}>
                        <Text c="red.3" size="sm" fw={600}>AI 분석 불가</Text>
                        <Text c="dimmed" size="xs">
                            정확한 분석을 위해 원가를 먼저 입력해주세요.
                        </Text>
                    </Stack>
                </Group>
            </Paper>
        );
    }

    // 로딩 중
    if (loading) {
        return (
            <Paper p="md" radius="md" bg="rgba(79, 70, 229, 0.1)" style={{ border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                <Stack gap="sm">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color="indigo" size="sm" className="animate-pulse">
                            <IconBrain size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="indigo.3" fw={600}>AI 전략 코치 분석 중...</Text>
                    </Group>
                    <Skeleton height={16} radius="md" />
                    <Skeleton height={16} width="80%" radius="md" />
                    <Skeleton height={16} width="60%" radius="md" />
                </Stack>
            </Paper>
        );
    }

    // 에러
    if (error) {
        return (
            <Paper p="md" radius="md" bg="rgba(255, 107, 107, 0.1)" style={{ border: '1px solid #fa525280' }}>
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconAlertTriangle size={16} color="#fa5252" />
                        <Text size="sm" c="red.3">{error}</Text>
                    </Group>
                    <Button variant="subtle" color="red" size="xs" onClick={loadAdvice}>
                        다시 시도
                    </Button>
                </Group>
            </Paper>
        );
    }

    // 결과 없음
    if (!advice) {
        return (
            <Paper p="md" radius="md" bg="rgba(79, 70, 229, 0.1)" style={{ border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                <Group justify="space-between">
                    <Group gap="xs">
                        <ThemeIcon variant="light" color="indigo" size="sm">
                            <IconBrain size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="white" fw={500}>AI 전략 코치</Text>
                    </Group>
                    <Button
                        variant="light"
                        color="indigo"
                        size="xs"
                        leftSection={<IconSparkles size={14} />}
                        onClick={loadAdvice}
                    >
                        분석 시작
                    </Button>
                </Group>
            </Paper>
        );
    }

    // 성공
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'danger': return 'red';
            case 'warning': return 'yellow';
            case 'good': return 'teal';
            default: return 'blue';
        }
    };

    return (
        <Paper
            p="md"
            radius="md"
            bg="rgba(79, 70, 229, 0.1)"
            style={{ border: '1px solid rgba(79, 70, 229, 0.3)' }}
        >
            <Stack gap="md">
                {/* Header */}
                <Group justify="space-between">
                    <Group gap="xs">
                        <ThemeIcon variant="gradient" gradient={{ from: 'indigo', to: 'grape' }} size="sm">
                            <IconBrain size={14} />
                        </ThemeIcon>
                        <Text size="sm" c="white" fw={600}>AI 전략 코치</Text>
                        <Badge size="xs" color={getSeverityColor(advice.severity)} variant="light">
                            {advice.severity === 'danger' ? '위험' :
                             advice.severity === 'warning' ? '주의' :
                             advice.severity === 'good' ? '양호' : '분석'}
                        </Badge>
                    </Group>
                    <Group gap={4}>
                        <Tooltip label="다시 분석">
                            <ActionIcon variant="subtle" color="gray" size="sm" onClick={loadAdvice}>
                                <IconRefresh size={14} />
                            </ActionIcon>
                        </Tooltip>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                        </ActionIcon>
                    </Group>
                </Group>

                {/* Main Advice */}
                <Paper p="sm" radius="md" bg="rgba(0,0,0,0.2)">
                    <Group align="flex-start" gap="sm">
                        <IconBulb size={20} color="#FFD700" style={{ flexShrink: 0, marginTop: 2 }} />
                        <Text size="sm" c="white" style={{ lineHeight: 1.6 }}>
                            {advice.summary}
                        </Text>
                    </Group>
                </Paper>

                <Collapse in={expanded}>
                    <Stack gap="sm">
                        {/* Price Recommendation */}
                        {advice.priceRecommendation && (
                            <Paper p="sm" radius="md" bg="rgba(32, 201, 151, 0.1)">
                                <Group gap="xs" mb={4}>
                                    <IconCoin size={14} color="#20c997" />
                                    <Text size="xs" c="teal" fw={600}>가격 조정 제안</Text>
                                </Group>
                                <Group justify="space-between" align="center">
                                    <Text size="sm" c="white">
                                        {menu.price.toLocaleString()}원 → {advice.priceRecommendation.suggestedPrice.toLocaleString()}원
                                    </Text>
                                    <Badge
                                        color={advice.priceRecommendation.expectedProfitChange >= 0 ? 'teal' : 'red'}
                                        variant="light"
                                    >
                                        {advice.priceRecommendation.expectedProfitChange >= 0 ? '+' : ''}
                                        {advice.priceRecommendation.expectedProfitChange.toLocaleString()}원/월
                                    </Badge>
                                </Group>
                                <Text size="xs" c="dimmed" mt={4}>
                                    {advice.priceRecommendation.reasoning}
                                </Text>
                            </Paper>
                        )}

                        {/* Action Items */}
                        {advice.actionItems && advice.actionItems.length > 0 && (
                            <Paper p="sm" radius="md" bg="rgba(0,0,0,0.2)">
                                <Group gap="xs" mb="xs">
                                    <IconTarget size={14} color="#be4bdb" />
                                    <Text size="xs" c="grape" fw={600}>추천 액션</Text>
                                </Group>
                                <Stack gap={4}>
                                    {advice.actionItems.map((item, idx) => (
                                        <Group key={idx} gap={6} align="flex-start">
                                            <Text size="xs" c="dimmed">{idx + 1}.</Text>
                                            <Text size="xs" c="gray.3">{item}</Text>
                                        </Group>
                                    ))}
                                </Stack>
                            </Paper>
                        )}

                        {/* Trend Insight */}
                        {advice.trendInsight && (
                            <Group gap="xs">
                                {advice.trendInsight.direction === 'up' ? (
                                    <IconTrendingUp size={14} color="#20c997" />
                                ) : (
                                    <IconTrendingDown size={14} color="#fa5252" />
                                )}
                                <Text size="xs" c="dimmed">
                                    {advice.trendInsight.message}
                                </Text>
                            </Group>
                        )}
                    </Stack>
                </Collapse>
            </Stack>
        </Paper>
    );
}
