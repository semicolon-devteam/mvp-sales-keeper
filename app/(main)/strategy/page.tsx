'use client';

import { Title, Text, SimpleGrid, Paper, Stack, Group, ThemeIcon, Badge, Slider, Button, RingProgress, Center } from '@mantine/core';
import { IconBulb, IconTrendingUp, IconAlertTriangle, IconRocket, IconChefHat } from '@tabler/icons-react';
import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, Label } from 'recharts';

// Mock Data (To be replaced by real DB data later)
const MOCK_MENU_ITEMS = [
    { id: 1, name: '치즈볼', quantity: 120, profit: 80000, price: 5000, type: 'star' }, // High Vol, High Profit
    { id: 2, name: '김치찌개', quantity: 85, profit: 60000, price: 8000, type: 'cashcow' }, // High Vol, Low Margin
    { id: 3, name: '트러플 감자튀김', quantity: 15, profit: 45000, price: 12000, type: 'gem' }, // Low Vol, High Margin
    { id: 4, name: '계란말이', quantity: 20, profit: 5000, price: 6000, type: 'dog' }, // Low Vol, Low Profit
    { id: 5, name: '매운 닭발', quantity: 45, profit: 90000, price: 18000, type: 'star' },
    { id: 6, name: '공기밥', quantity: 150, profit: 15000, price: 1000, type: 'cashcow' },
    { id: 7, name: '먹태', quantity: 10, profit: 2000, price: 15000, type: 'dog' },
];

const COLORS = {
    star: '#FFD700', // Gold
    cashcow: '#40C057', // Green
    gem: '#BE4BDB', // Grape/Purple
    dog: '#868E96' // Gray
};

export default function StrategyPage() {
    const [selectedItem, setSelectedItem] = useState<any>(MOCK_MENU_ITEMS[0]);
    const [priceAdjustment, setPriceAdjustment] = useState(0);

    // Simulation Calc
    const currentMargin = selectedItem.profit / selectedItem.quantity; // Approx per item profit
    const simulatedPrice = selectedItem.price + priceAdjustment;
    const simulatedProfitPerItem = currentMargin + priceAdjustment;
    // Assume 10% drop in qty for every 10% raise in price (Elasticity -1.0 mock)
    const priceChangePct = priceAdjustment / selectedItem.price;
    const qtyChangePct = -priceChangePct * 1.0;
    const simulatedQty = Math.round(selectedItem.quantity * (1 + qtyChangePct));
    const simulatedTotalProfit = simulatedQty * simulatedProfitPerItem;
    const profitDiff = simulatedTotalProfit - selectedItem.profit;

    return (
        <Stack gap="xl" pb={100}>
            <Stack gap={4}>
                <Group>
                    <Title order={2} c="white">수익 설계사</Title>
                    <Badge color="pink" variant="light" size="lg">BETA</Badge>
                </Group>
                <Text c="dimmed">내 메뉴의 수익성을 분석하고 최적의 가격을 찾아보세요.</Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {/* Zone A: Menu Nebula */}
                <Paper p="lg" radius="md" bg="#1B2136" withBorder style={{ borderColor: '#2C2E33', minHeight: 400 }}>
                    <Stack h="100%">
                        <Group justify="space-between">
                            <Title order={4} c="white">메뉴 MRI (BCG 매트릭스)</Title>
                            <ThemeIcon variant="light" color="gray" radius="xl">
                                <IconBulb size={18} />
                            </ThemeIcon>
                        </Group>
                        <Text size="xs" c="dimmed" mb="md">
                            X축: 인기도 (판매량) / Y축: 수익성 (이익총액)
                        </Text>

                        <div style={{ flex: 1, width: '100%', minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#373A40" />
                                    <XAxis type="number" dataKey="quantity" name="판매량" stroke="#868E96" unit="개">
                                        <Label value="판매량 (인기)" offset={-10} position="insideBottom" fill="#868E96" />
                                    </XAxis>
                                    <YAxis type="number" dataKey="profit" name="이익" stroke="#868E96" unit="원">
                                        <Label value="수익성 (마진)" angle={-90} position="insideLeft" fill="#868E96" />
                                    </YAxis>
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <Paper p="xs" bg="dark" withBorder>
                                                        <Text fw={700} c="white">{data.name}</Text>
                                                        <Text size="xs" c="dimmed">판매량: {data.quantity}개</Text>
                                                        <Text size="xs" c="profit">이익: {data.profit.toLocaleString()}원</Text>
                                                    </Paper>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {/* Quadrant Lines (Mock averages) */}
                                    <ReferenceLine x={50} stroke="#5c5f66" strokeDasharray="3 3" />
                                    <ReferenceLine y={40000} stroke="#5c5f66" strokeDasharray="3 3" />

                                    <Scatter name="Menu Items" data={MOCK_MENU_ITEMS} onClick={(node) => setSelectedItem(node.payload)}>
                                        {MOCK_MENU_ITEMS.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} cursor="pointer" />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <Group justify="center" gap="xs">
                            <Badge color="yellow" variant="dot">스타</Badge>
                            <Badge color="green" variant="dot">캐시카우</Badge>
                            <Badge color="grape" variant="dot">보석</Badge>
                            <Badge color="gray" variant="dot">골칫덩이</Badge>
                        </Group>
                    </Stack>
                </Paper>

                {/* Zone B: AI Price Simulator */}
                <Paper p="lg" radius="md" bg="#1B2136" withBorder style={{ borderColor: '#2C2E33' }}>
                    <Stack gap="lg">
                        <Group>
                            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                                <IconChefHat size={20} />
                            </ThemeIcon>
                            <div>
                                <Title order={4} c="white">AI 가격 시뮬레이터</Title>
                                <Text size="xs" c="dimmed">선택된 메뉴: <span style={{ color: 'white', fontWeight: 700 }}>{selectedItem.name}</span></Text>
                            </div>
                        </Group>

                        {/* Analysis Card */}
                        <Paper p="md" bg="rgba(0,0,0,0.2)" radius="md">
                            <Group align="flex-start">
                                <IconRocket size={24} color="#FFD700" />
                                <div>
                                    <Text size="sm" fw={700} c="white">AI 분석 리포트</Text>
                                    <Text size="sm" c="gray.4" mt={4}>
                                        이 메뉴는 <strong>{selectedItem.type === 'star' ? '스타(효자 상품)' : selectedItem.type === 'cashcow' ? '캐시카우(매출 지지대)' : '메뉴'}</strong>입니다.<br />
                                        현재 마진율이 <strong>약 {Math.round((selectedItem.profit / (selectedItem.price * selectedItem.quantity)) * 100)}%</strong>로 추정됩니다.
                                    </Text>
                                </div>
                            </Group>
                        </Paper>

                        {/* Simulator Controls */}
                        <Stack gap="xs">
                            <Text size="sm" fw={700} c="dimmed">가격 조정 시뮬레이션</Text>
                            <Group justify="space-between">
                                <Text size="xs">현재: {selectedItem.price.toLocaleString()}원</Text>
                                <Text size="md" fw={700} c="cyan">{simulatedPrice.toLocaleString()}원 ({priceAdjustment > 0 ? '+' : ''}{priceAdjustment})</Text>
                            </Group>
                            <Slider
                                min={-1000}
                                max={2000}
                                step={100}
                                value={priceAdjustment}
                                onChange={setPriceAdjustment}
                                marks={[
                                    { value: 0, label: '0' },
                                    { value: 500, label: '+500' },
                                    { value: 1000, label: '+1000' }
                                ]}
                                color="cyan"
                            />
                        </Stack>

                        {/* Result */}
                        <Paper p="md" radius="md" withBorder style={{ borderColor: profitDiff >= 0 ? '#20c997' : '#fa5252', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                            <Stack gap="xs" align="center">
                                <Text size="xs" c="dimmed">예상 월 수익 변화</Text>
                                <Group align="center" gap={4}>
                                    {profitDiff >= 0 ? <IconTrendingUp size={24} color="#20c997" /> : <IconAlertTriangle size={24} color="#fa5252" />}
                                    <Text size="xl" fw={800} c={profitDiff >= 0 ? 'teal' : 'red'}>
                                        {profitDiff > 0 ? '+' : ''}{profitDiff.toLocaleString()} 원
                                    </Text>
                                </Group>
                                <Text size="xs" ta="center" c="dimmed">
                                    가격 인상 시 판매량이 약 {Math.abs(Math.round(qtyChangePct * 100))}% {qtyChangePct < 0 ? '감소' : '증가'}한다고 가정했을 때의 결과입니다.
                                </Text>
                            </Stack>
                        </Paper>

                        <Button variant="light" color="cyan" fullWidth>
                            이 가격으로 메뉴판 업데이트 (예정)
                        </Button>
                    </Stack>
                </Paper>
            </SimpleGrid>
        </Stack>
    );
}
