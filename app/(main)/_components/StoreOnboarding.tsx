'use client';

import { useState } from 'react';
import { Container, Stack, Title, Text, TextInput, Button, Paper, Center } from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';
import { useStore } from '../_contexts/store-context';

export function StoreOnboarding() {
    const [storeName, setStoreName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { createStore } = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!storeName.trim()) {
            setError('가게 이름을 입력해주세요');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const errorMessage = await createStore(storeName.trim());
            if (errorMessage) {
                setError(errorMessage);
            }
            // Success case is handled by context - it will refresh stores automatically
        } catch (err) {
            setError('가게 생성 중 오류가 발생했습니다');
            console.error('Store creation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Center style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
            <Container size="xs">
                <Paper p="xl" radius="md" withBorder style={{ backgroundColor: '#1f2937', borderColor: '#374151' }}>
                    <Stack gap="lg">
                        <Stack gap="xs" align="center">
                            <IconBuildingStore size={48} color="#10b981" />
                            <Title order={2} c="white" ta="center">
                                첫 가게를 등록해주세요
                            </Title>
                            <Text size="sm" c="dimmed" ta="center">
                                매출과 지출을 관리할 가게 이름을 입력하세요
                            </Text>
                        </Stack>

                        <form onSubmit={handleSubmit}>
                            <Stack gap="md">
                                <TextInput
                                    label="가게 이름"
                                    placeholder="예: 월하화, 카페 세미콜론"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    error={error}
                                    required
                                    size="md"
                                    styles={{
                                        input: {
                                            backgroundColor: '#111827',
                                            borderColor: '#374151',
                                            color: 'white',
                                            '&:focus': {
                                                borderColor: '#10b981'
                                            }
                                        },
                                        label: {
                                            color: '#9ca3af',
                                            fontWeight: 500
                                        }
                                    }}
                                />

                                <Button
                                    type="submit"
                                    size="md"
                                    loading={isLoading}
                                    fullWidth
                                    style={{
                                        backgroundColor: '#10b981',
                                        '&:hover': {
                                            backgroundColor: '#059669'
                                        }
                                    }}
                                >
                                    가게 만들기
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Container>
        </Center>
    );
}
