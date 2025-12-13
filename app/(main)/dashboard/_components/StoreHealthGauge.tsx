'use client';

import { RingProgress, Text, Center, Stack, ThemeIcon, Box } from '@mantine/core';
import { IconHeartRateMonitor } from '@tabler/icons-react';

type StoreHealthGaugeProps = {
    score: number; // 0-100
};

export function StoreHealthGauge({ score }: StoreHealthGaugeProps) {
    // Color Logic
    const color = score >= 80 ? 'teal' : score >= 60 ? 'yellow' : 'red';

    return (
        <Stack align="center" gap="xs" style={{ position: 'relative' }}>
            <Box style={{ position: 'relative' }}>
                {/* Pulse Animation Effect behind the ring */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        backgroundColor: `var(--mantine-color-${color}-9)`,
                        opacity: 0.2,
                        filter: 'blur(20px)',
                        zIndex: 0,
                        animation: 'pulse 3s infinite'
                    }}
                />

                <RingProgress
                    size={180}
                    thickness={16}
                    roundCaps
                    sections={[{ value: score, color: color }]}
                    label={
                        <Center>
                            <Stack gap={0} align="center">
                                <Text fw={900} size="3rem" c="white" style={{ lineHeight: 1 }}>
                                    {score}
                                </Text>
                                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                    건강 점수
                                </Text>
                            </Stack>
                        </Center>
                    }
                    style={{ zIndex: 1 }}
                />
            </Box>

            <Group gap="xs" bg="rgba(0,0,0,0.3)" px="md" py="xs" style={{ borderRadius: '20px' }}>
                <ThemeIcon variant="transparent" color={color} size="sm">
                    <IconHeartRateMonitor size={16} />
                </ThemeIcon>
                <Text size="sm" c="white">
                    {score >= 80 ? '아주 건강합니다! 💪' : score >= 60 ? '주의가 필요합니다. ⚠️' : '위험합니다! 🚨'}
                </Text>
            </Group>
            <style jsx>{`
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.2; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
                    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.2; }
                }
            `}</style>
        </Stack>
    );
}

import { Group } from '@mantine/core'; // Imported specifically for the usage above
