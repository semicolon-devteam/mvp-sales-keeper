'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Badge, Divider } from '@mantine/core';
import { IconCloudRain, IconMoped, IconArrowUpRight } from '@tabler/icons-react';

export function WeatherWidget() {
    return (
        <Paper
            radius="lg"
            p="md"
            withBorder
            style={{
                background: '#1F2937',
                borderColor: '#374151',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <ThemeIcon variant="light" color="orange" radius="md" size="sm">
                        <IconCloudRain size={14} />
                    </ThemeIcon>
                    <Text size="xs" fw={700} c="gray.3" tt="uppercase">내일 날씨 & 수요</Text>
                </Group>
                <Badge variant="dot" color="orange" size="xs">주의</Badge>
            </Group>

            <Stack gap="xs" style={{ flex: 1 }}>
                <Group align="center" gap="sm">
                    <IconCloudRain size={36} color="#60a5fa" />
                    <Stack gap={0}>
                        <Text size="lg" fw={800} c="white">오후 폭우 예상</Text>
                        <Text size="xs" c="dimmed">강수확률 90% (14:00~)</Text>
                    </Stack>
                </Group>

                <Divider color="gray.8" />

                <Group gap="sm" align="center">
                    <ThemeIcon variant="light" color="orange" radius="xl">
                        <IconMoped size={18} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text size="sm" c="gray.3" fw={600}>배달 주문 폭증 예고</Text>
                        <Group gap={4}>
                            <IconArrowUpRight size={14} color="#fbbf24" />
                            <Text size="xs" c="orange.4" fw={700}>평소 대비 +40% 예상</Text>
                        </Group>
                    </Stack>
                </Group>
            </Stack>
        </Paper>
    );
}
