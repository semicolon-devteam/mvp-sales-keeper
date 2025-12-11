'use client';

import { useEffect, useState } from 'react';
import { Title, Text, Button, Paper, Stack, Center, Loader, ThemeIcon } from '@mantine/core';
import { useParams, useRouter } from 'next/navigation';
import { verifyInvite, joinStore } from '../../(main)/store/members/actions';
import { IconBuildingStore, IconMail, IconCheck, IconAlertCircle } from '@tabler/icons-react';

export default function JoinPage() {
    const params = useParams();
    const router = useRouter();
    const code = params.code as string;

    const [inviteData, setInviteData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (code) {
            checkInvite();
        }
    }, [code]);

    const checkInvite = async () => {
        try {
            const data = await verifyInvite(code);
            if (!data) {
                setError('유효하지 않거나 만료된 초대 코드입니다.');
            } else {
                setInviteData(data);
            }
        } catch (e) {
            setError('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            const result = await joinStore(code);
            alert('가게에 성공적으로 합류했습니다!');
            window.location.href = '/dashboard';
        } catch (e) {
            alert('합류 실패: ' + e);
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <Center h="100vh"><Loader /></Center>;

    return (
        <Center h="100vh" bg="gray.0" p="md">
            <Paper p="xl" radius="xl" shadow="xl" style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
                <Stack gap="lg" align="center">
                    {error ? (
                        <>
                            <ThemeIcon size={80} radius="100%" color="red" variant="light">
                                <IconAlertCircle size={40} />
                            </ThemeIcon>
                            <Title order={3}>오류 발생</Title>
                            <Text c="dimmed">{error}</Text>
                            <Button variant="light" onClick={() => router.push('/')}>홈으로 돌아가기</Button>
                        </>
                    ) : (
                        <>
                            <ThemeIcon size={80} radius="100%" color="teal" variant="light">
                                <IconMail size={40} />
                            </ThemeIcon>

                            <Stack gap={0}>
                                <Title order={2} style={{ fontFamily: 'Pretendard Variable' }}>
                                    초대장이 도착했습니다
                                </Title>
                                <Text c="dimmed" mt="xs">
                                    <Text span fw={700} c="teal">{inviteData?.stores?.name || '가게'}</Text>
                                    <span>의 직원으로 초대받으셨습니다.</span>
                                </Text>
                            </Stack>

                            <Button
                                size="xl"
                                radius="xl"
                                color="teal"
                                onClick={handleJoin}
                                loading={joining}
                                leftSection={<IconCheck />}
                                fullWidth
                            >
                                지금 합류하기
                            </Button>
                        </>
                    )}
                </Stack>
            </Paper>
        </Center>
    );
}
