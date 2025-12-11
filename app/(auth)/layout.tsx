import { Center, Container } from '@mantine/core';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <Container size="xs" h="100vh">
            <Center h="100%">{children}</Center>
        </Container>
    );
}
