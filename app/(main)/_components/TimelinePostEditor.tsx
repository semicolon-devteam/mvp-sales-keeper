'use client';

import { useState } from 'react';
import { Card, Group, Textarea, Button, FileButton, Image, ActionIcon, Stack, Text, Box } from '@mantine/core';
import { IconPhoto, IconSend, IconX } from '@tabler/icons-react';
import { useStore } from '../_contexts/store-context';
import { createClient } from '@/app/_shared/utils/supabase/client';

export function TimelinePostEditor({ onPostCreated }: { onPostCreated: () => void }) {
    const { currentStore } = useStore();
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        if (!content.trim() && !file) return;
        if (!currentStore) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Upload image if file exists
            let imageUrl = null;
            if (file) {
                const filename = `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('timeline')
                    .upload(filename, file);

                if (uploadError) {
                    console.error('Image upload failed:', uploadError);
                    alert('사진 업로드에 실패했습니다. (버킷이 없거나 권한 문제일 수 있습니다)');
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('timeline')
                    .getPublicUrl(data.path);

                imageUrl = publicUrl;
            }

            const { error } = await supabase.from('timeline_posts').insert({
                store_id: currentStore.id,
                author_id: user.id,
                content: content,
                image_url: imageUrl,
                post_type: 'general'
            });

            if (error) throw error;

            setContent('');
            setFile(null);
            onPostCreated();
        } catch (e) {
            console.error(e);
            alert('글 작성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (file: File | null) => {
        setFile(file);
    };

    return (
        <Card shadow="md" radius="lg" p="lg" style={{ overflow: 'visible' }}>
            <Stack gap="sm">
                <Group justify="space-between" mb={-4}>
                    <Text fw={700} size="sm" c="dimmed">새로운 소식 남기기</Text>
                </Group>

                <Box style={{ position: 'relative' }}>
                    <Textarea
                        placeholder={`오늘 매장에 무슨 일이 있었나요?`}
                        autosize
                        minRows={3}
                        variant="filled"
                        radius="md"
                        styles={{ input: { backgroundColor: 'var(--mantine-color-gray-0)', border: 'none' } }}
                        value={content}
                        onChange={(e) => setContent(e.currentTarget.value)}
                    />
                </Box>

                {file && (
                    <Box style={{ position: 'relative', width: 'fit-content' }}>
                        <Image
                            src={URL.createObjectURL(file)}
                            radius="md"
                            h={120}
                            w="auto"
                            fit="cover"
                        />
                        <ActionIcon
                            variant="filled"
                            color="dark"
                            size="sm"
                            radius="xl"
                            style={{ position: 'absolute', top: 5, right: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                            onClick={() => setFile(null)}
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    </Box>
                )}

                <Group justify="flex-end" align="center" mt="xs">
                    <FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
                        {(props) => (
                            <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" {...props}>
                                <IconPhoto size={22} />
                            </ActionIcon>
                        )}
                    </FileButton>

                    <Button
                        size="sm"
                        variant="gradient"
                        gradient={{ from: 'teal', to: 'emerald', deg: 105 }}
                        radius="xl"
                        pl="lg" pr="lg"
                        rightSection={<IconSend size={16} />}
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={!content.trim() && !file}
                    >
                        등록
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
