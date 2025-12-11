'use client';

import {
    TextInput,
    PasswordInput,
    Paper,
    Title,
    Text,
    Container,
    Button,
    Anchor,
    Alert
} from '@mantine/core';
import Link from 'next/link';
import { signup } from '../actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button fullWidth mt="xl" type="submit" loading={pending}>
            가입하기
        </Button>
    )
}

const initialState = {
    error: '',
};

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, initialState);

    return (
        <Container size={420} my={40}>
            <Title ta="center">
                회원가입
            </Title>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Sales Keeper와 함께 매출 관리를 시작하세요
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
                    <SubmitButton />
                </form>
            </Paper>

            <Text ta="center" mt="md">
                이미 계정이 있으신가요?{' '}
                <Anchor component={Link} href="/login" fw={700}>
                    로그인
                </Anchor>
            </Text>
        </Container>
    );
}
