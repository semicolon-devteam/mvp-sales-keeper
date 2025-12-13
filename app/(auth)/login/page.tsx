'use client';

import {
    TextInput,
    PasswordInput,
    Checkbox,
    Anchor,
    Paper,
    Title,
    Text,
    Container,
    Group,
    Button,
    Alert
} from '@mantine/core';
import Link from 'next/link';
import { login } from '../actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button fullWidth mt="xl" type="submit" loading={pending}>
            로그인
        </Button>
    )
}

const initialState = {
    error: '',
};

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState);

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                Sales Keeper
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                매출 관리의 시작
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <form action={formAction}>
                    {state?.error && (
                        <Alert variant="light" color="red" title="오류" mb="md">
                            {state.error}
                        </Alert>
                    )}
                    <TextInput label="이메일" placeholder="you@semicolon.com" required name="email" />
                    <PasswordInput label="비밀번호" placeholder="비밀번호" required mt="md" name="password" />
                    <Group justify="space-between" mt="lg">
                        <Checkbox label="로그인 상태 유지" />
                        <Anchor component="button" size="sm">
                            비밀번호 찾기
                        </Anchor>
                    </Group>
                    <SubmitButton />
                </form>
            </Paper>

            <Text ta="center" mt="md">
                계정이 없으신가요?{' '}
                <Anchor component={Link} href="/signup" fw={700}>
                    회원가입
                </Anchor>
            </Text>
        </Container>
    );
}
