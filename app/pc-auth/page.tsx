'use client';

import { Container, Paper, Title, Text, Button, PinInput, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PCAuthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        setLoading(true);
        // Simulation of token verification
        setTimeout(() => {
            router.push('/sales/upload');
        }, 1000);
    };

    return (
        <Container size="xs" mt={100}>
            <Paper withBorder p="xl" radius="md">
                <Stack align="center">
                    <Title order={3}>PC 엑셀 업로드</Title>
                    <Text c="dimmed" size="sm" ta="center">
                        전달받은 공유 코드를 입력하세요.
                        (MVP: 아무 코드나 입력하면 이동합니다)
                    </Text>

                    <PinInput length={4} size="lg" onComplete={handleAuth} />

                    <Button fullWidth onClick={handleAuth} loading={loading}>
                        확인
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
