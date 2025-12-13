'use client';

import { useEffect } from 'react';
import { Button, Stack, Text, Paper, Center, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconLogin } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // 에러 로깅 (프로덕션에서는 Sentry 등 사용)
        console.error('[Error Boundary]', error);
    }, [error]);

    // 인증 관련 에러 체크
    const isAuthError =
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('401') ||
        error.message?.toLowerCase().includes('로그인') ||
        error.message?.toLowerCase().includes('인증');

    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <Center mih="60vh" p="xl">
            <Paper
                p="xl"
                radius="lg"
                bg="#1B2136"
                style={{ border: '1px solid #2C2E33', maxWidth: 400 }}
            >
                <Stack align="center" gap="lg">
                    <ThemeIcon
                        size={60}
                        radius="xl"
                        color={isAuthError ? 'yellow' : 'red'}
                        variant="light"
                    >
                        {isAuthError ? <IconLogin size={30} /> : <IconAlertTriangle size={30} />}
                    </ThemeIcon>

                    <Stack align="center" gap="xs">
                        <Text size="xl" fw={700} c="white">
                            {isAuthError ? '로그인이 필요합니다' : '문제가 발생했습니다'}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                            {isAuthError
                                ? '이 페이지를 보려면 로그인해주세요.'
                                : '잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의하세요.'
                            }
                        </Text>
                    </Stack>

                    <Stack w="100%" gap="sm">
                        {isAuthError ? (
                            <Button
                                fullWidth
                                size="md"
                                color="teal"
                                leftSection={<IconLogin size={18} />}
                                onClick={handleLogin}
                            >
                                로그인하기
                            </Button>
                        ) : (
                            <Button
                                fullWidth
                                size="md"
                                color="teal"
                                leftSection={<IconRefresh size={18} />}
                                onClick={reset}
                            >
                                다시 시도
                            </Button>
                        )}

                        <Button
                            fullWidth
                            size="md"
                            variant="subtle"
                            color="gray"
                            onClick={() => router.push('/dashboard')}
                        >
                            대시보드로 이동
                        </Button>
                    </Stack>

                    {process.env.NODE_ENV === 'development' && (
                        <Text size="xs" c="red.4" ta="center" style={{ wordBreak: 'break-all' }}>
                            {error.message}
                        </Text>
                    )}
                </Stack>
            </Paper>
        </Center>
    );
}
