import { Paper, Group, Stack, Text, ThemeIcon, Badge, Box } from '@mantine/core';
import Image from 'next/image';
import { IconMessageCircle, IconAlertTriangle, IconBoxSeam, IconCheck, IconInfoCircle } from '@tabler/icons-react';

interface TimelineItemProps {
    post: any;
}

export function TimelineItem({ post }: TimelineItemProps) {
    // Auto-Tagging Logic
    const content = post.content;
    let tag = { label: '일반', color: 'gray', icon: IconInfoCircle };

    if (content.match(/고장|불만|사고|파손|문제|부서|부셨|깨짐|깨졌|망가|박살|컴플레인|항의/)) {
        tag = { label: '이슈', color: 'red', icon: IconAlertTriangle };
    } else if (content.match(/부족|주문|재고|도착|없음|떨어|모자|비품/)) {
        tag = { label: '물품', color: 'orange', icon: IconBoxSeam };
    } else if (content.match(/완료|청소|마감|체크|정산|오픈|준비/)) {
        tag = { label: '업무', color: 'blue', icon: IconCheck };
    }

    const TagIcon = tag.icon;

    return (
        <Paper shadow="sm" radius="lg" p="md" bg="#1F2937" style={{ border: '1px solid #374151' }}>
            <Group align="flex-start" gap="sm">
                <ThemeIcon variant="light" color={tag.color} radius="xl" size="lg">
                    <TagIcon size={20} />
                </ThemeIcon>
                <Stack gap={4} style={{ flex: 1 }}>
                    <Group justify="space-between">
                        <Badge variant="dot" color={tag.color} size="sm">{tag.label}</Badge>
                        <Text size="xs" c="dimmed">
                            {/* Time formatting if available, currently just mock or date */}
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </Group>

                    <Text size="sm" c="gray.3" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</Text>

                    {post.image_url && (
                        <Box mt="xs" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative', width: '100%', height: 200 }}>
                            <Image src={post.image_url} alt="attached" fill style={{ objectFit: 'cover' }} />
                        </Box>
                    )}
                </Stack>
            </Group>
        </Paper>
    );
}
