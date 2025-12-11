'use client';

import { useEffect, useState } from 'react';
import { Card, Group, Avatar, Text, Stack, ActionIcon, Badge, Loader, Center, Image, Box, ThemeIcon } from '@mantine/core';
import { IconHeart, IconMessageCircle, IconDotsVertical, IconAlertTriangle, IconBoxSeam, IconCheck } from '@tabler/icons-react';
import { useStore } from '../_contexts/store-context';
import { createClient } from '@/app/_shared/utils/supabase/client';
import { TimelineSummaryCard } from '../calendar/_components/TimelineSummaryCard';

type Post = {
    id: string;
    content: string;
    image_url: string | null;
    post_type: string;
    created_at: string;
    author_id: string;
};

export function TimelineFeed({ keyTrigger }: { keyTrigger: number }) {
    const { currentStore } = useStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchPosts = async () => {
        if (!currentStore) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('timeline_posts')
                .select('*')
                .eq('store_id', currentStore.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [currentStore, keyTrigger]);

    if (!currentStore) return null;
    if (loading && posts.length === 0) return <Center p="xl"><Loader size="sm" color="teal" /></Center>;

    // Filter posts for today for the AI Summary
    const todaysPosts = posts.filter(p => {
        const today = new Date();
        const postDate = new Date(p.created_at);
        return postDate.getDate() === today.getDate() &&
            postDate.getMonth() === today.getMonth() &&
            postDate.getFullYear() === today.getFullYear();
    });

    return (
        <Stack gap="lg" pb={100}>
            {/* AI Summary Card - Only for Today */}
            <TimelineSummaryCard date={new Date()} posts={todaysPosts} />

            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
                <Stack align="center" gap="xs" py="xl" opacity={0.6}>
                    <Text size="xl">📭</Text>
                    <Text c="dimmed" size="sm" ta="center">
                        아직 소식이 없습니다.<br />첫 글을 남겨보세요!
                    </Text>
                </Stack>
            )}
        </Stack>
    );
}

function PostCard({ post }: { post: Post }) {
    // Mock for nicer UI
    const isNotice = post.post_type === 'notice';
    const dateStr = new Date(post.created_at).toLocaleString('ko-KR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const [liked, setLiked] = useState(false);

    // AI Tagging Logic
    const content = post.content || '';
    let tag = null;

    if (content.match(/고장|불만|사고|파손|문제|부서|부셨|깨짐|깨졌|망가|박살|컴플레인|항의/)) {
        tag = { label: '이슈', color: 'red', icon: IconAlertTriangle };
    } else if (content.match(/부족|주문|재고|도착|없음|떨어|모자|비품/)) {
        tag = { label: '물품', color: 'orange', icon: IconBoxSeam };
    } else if (content.match(/완료|청소|마감|체크|정산|오픈|준비/)) {
        tag = { label: '업무', color: 'blue', icon: IconCheck };
    }

    const TagIcon = tag?.icon;

    return (
        <Card shadow="md" radius="lg" p="md" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <Group justify="space-between" mb="sm" align="flex-start">
                <Group gap="sm">
                    <Avatar radius="xl" size="md" color="teal" variant="light">
                        직
                    </Avatar>
                    <Stack gap={0}>
                        <Group gap={6} align="center">
                            <Text size="sm" fw={700} c="white">직원</Text>
                            <Badge size="xs" variant="light" color="gray" circle>N</Badge>
                        </Group>
                        <Text size="xs" c="dimmed">{dateStr}</Text>
                    </Stack>
                </Group>

                <Group gap={4}>
                    {tag && TagIcon && (
                        <Badge variant="light" color={tag.color} leftSection={<TagIcon size={12} />}>
                            {tag.label}
                        </Badge>
                    )}
                    {isNotice ? (
                        <Badge color="red" variant="light">공지</Badge>
                    ) : (
                        <ActionIcon variant="transparent" color="gray" size="sm">
                            <IconDotsVertical size={16} />
                        </ActionIcon>
                    )}
                </Group>
            </Group>

            {/* Content */}
            <Text
                size="md"
                c="white"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                mb={post.image_url ? 'md' : 'xs'}
            >
                {post.content}
            </Text>

            {/* Image */}
            {post.image_url && (
                <Box mb="sm" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
                    <Image
                        src={post.image_url}
                        w="100%"
                        fit="cover"
                        alt="Attached image"
                    />
                </Box>
            )}

            {/* Footer / Actions */}
            <Group gap="lg" mt="xs" pt="sm" style={{ borderTop: '1px solid #374151' }}>
                <Group
                    gap={6}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setLiked(!liked)}
                >
                    <IconHeart
                        size={20}
                        stroke={1.5}
                        color={liked ? '#fa5252' : 'gray'}
                        fill={liked ? '#fa5252' : 'none'}
                    />
                    <Text size="sm" c={liked ? 'red.5' : 'dimmed'} fw={500}>좋아요</Text>
                </Group>
                <Group gap={6} style={{ cursor: 'pointer' }}>
                    <IconMessageCircle size={20} stroke={1.5} color="gray" />
                    <Text size="sm" c="dimmed" fw={500}>댓글</Text>
                </Group>
            </Group>
        </Card>
    );
}
