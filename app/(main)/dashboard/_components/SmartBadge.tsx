'use client';

import { Badge, Group, Text } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';

type SmartBadgeProps = {
    value: number; // e.g. 12 for 12%
    label?: string; // e.g. "vs Last Week"
    inverse?: boolean; // If true, positive is bad (e.g. expenses)
};

export function SmartBadge({ value, label = '지난주 대비', inverse = false }: SmartBadgeProps) {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    // Logic: 
    // Normal (Sales): Up = Good (Blue), Down = Bad (Red)
    // Inverse (Cost): Up = Bad (Red), Down = Good (Blue)

    let color = 'gray'; // Neutral
    let Icon = IconMinus;

    if (!isNeutral) {
        if (inverse) {
            color = isPositive ? 'red' : 'blue';
        } else {
            color = isPositive ? 'blue' : 'red';
        }
        Icon = isPositive ? IconTrendingUp : IconTrendingDown;
    }

    return (
        <Badge
            variant="light"
            bg={`var(--mantine-color-${color}-9)`} // Use dark shade for bg opacity if needed, or rely on variant
            color={color}
            size="sm"
            radius="xl"
            style={{
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: `rgba(var(--mantine-color-${color}-text), 0.1)`
            }}
        >
            <Group gap={4}>
                <Icon size={12} stroke={2} />
                <Text span size="xs">{Math.abs(value)}% {label}</Text>
            </Group>
        </Badge>
    );
}
