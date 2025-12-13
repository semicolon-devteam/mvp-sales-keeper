import { createClient } from './_shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Button, Container, Title, Text, Stack, Group } from '@mantine/core';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <Container size="xs" h="100vh">
      <Stack align="center" justify="center" h="100%" gap="xl">
        <Stack align="center" gap="md">
          <Image src="/logo.png" alt="Sales Keeper Logo" width={180} height={180} style={{ marginBottom: 10, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }} />
          <Title order={1} size={40}>Sales Keeper</Title>
          <Text c="dimmed" size="lg" ta="center">
            소상공인을 위한 간편 매출 관리 서비스
          </Text>
        </Stack>

        <Group w="100%">
          <Button component={Link} href="/login" fullWidth size="lg" variant="filled">
            로그인
          </Button>
          <Button component={Link} href="/signup" fullWidth size="lg" variant="outline">
            회원가입
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
