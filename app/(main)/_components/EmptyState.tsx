'use client';

import { Stack, Text, ThemeIcon, Button, Paper } from '@mantine/core';
import { IconInbox, IconPlus } from '@tabler/icons-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    compact?: boolean; // For inline/small areas
}

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    compact = false
}: EmptyStateProps) {
    if (compact) {
        return (
            <Stack align="center" justify="center" gap="xs" py="xl" opacity={0.6}>
                {icon || <IconInbox size={32} stroke={1.5} />}
                <Text c="dimmed" size="sm" ta="center">
                    {title}
                </Text>
            </Stack>
        );
    }

    return (
        <Paper p="xl" radius="lg" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
            <Stack align="center" gap="lg" py="md">
                <ThemeIcon size={72} radius="xl" variant="light" color="gray">
                    {icon || <IconInbox size={36} stroke={1.5} />}
                </ThemeIcon>
                <Stack align="center" gap={4}>
                    <Text fw={700} size="lg" c="white">{title}</Text>
                    {description && (
                        <Text c="dimmed" size="sm" ta="center" maw={280}>
                            {description}
                        </Text>
                    )}
                </Stack>
                {actionLabel && onAction && (
                    <Button
                        variant="light"
                        color="teal"
                        leftSection={<IconPlus size={16} />}
                        onClick={onAction}
                    >
                        {actionLabel}
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
