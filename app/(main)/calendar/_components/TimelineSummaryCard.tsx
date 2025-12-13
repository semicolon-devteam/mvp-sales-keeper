import { Paper, Text, Group, Button, Stack, List, ThemeIcon, Collapse, Box, Divider } from '@mantine/core';
import { IconSparkles, IconAlertTriangle, IconCheck, IconBoxSeam } from '@tabler/icons-react';
import { useState } from 'react';

interface TimelineSummaryCardProps {
    date: Date;
    posts: any[];
}

export function TimelineSummaryCard({ date, posts }: TimelineSummaryCardProps) {
    const [opened, setOpened] = useState(false);

    // Mock AI Logic for Summary
    const issues = posts.filter(p => p.content.match(/고장|불만|사고|파손|문제|부서|부셨|깨짐|깨졌|망가|박살|컴플레인|항의/));
    const supplies = posts.filter(p => p.content.match(/부족|주문|재고|도착|없음|떨어|모자|비품/));
    const tasks = posts.filter(p => p.content.match(/완료|청소|마감|체크|정산|오픈|준비/));

    const hasEvents = issues.length > 0 || supplies.length > 0 || tasks.length > 0;

    // If posts.length === 0, we still want to show the card to indicate the feature exists,
    // just with a "No data" message.
    // if (posts.length === 0) return null;

    return (
        <Paper
            radius="lg"
            p="md"
            bg="rgba(17, 24, 39, 0.7)"
            style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}
            className="fade-in"
        >
            <Group justify="space-between" align="center" mb={opened || posts.length === 0 ? "md" : 0}>
                <Group gap="xs">
                    <ThemeIcon variant="light" color="teal" radius="xl" size="md">
                        <IconSparkles size={16} />
                    </ThemeIcon>
                    <Text fw={700} c="white" size="sm">AI 일일 브리핑</Text>
                </Group>
                <Button
                    variant="subtle"
                    color="teal"
                    size="xs"
                    onClick={() => setOpened(!opened)}
                    disabled={posts.length === 0}
                >
                    {posts.length === 0 ? '데이터 없음' : (opened ? '접기' : '요약 보기')}
                </Button>
            </Group>

            <Collapse in={opened || posts.length === 0}>
                <Stack gap="sm">
                    <Divider color="gray.8" />

                    {posts.length === 0 ? (
                        <Text c="gray.5" size="sm" ta="center" py="sm">
                            아직 작성된 타임라인 기록이 없습니다.
                            <br />
                            글을 남기시면 AI가 자동으로 정리해드립니다!
                        </Text>
                    ) : !hasEvents ? (
                        <Text c="gray.4" size="sm">
                            특이사항 없이 평온한 하루였습니다.
                        </Text>
                    ) : null}

                    {issues.length > 0 && (
                        <Group align="flex-start" gap="xs">
                            <ThemeIcon color="red" variant="light" size="sm" radius="md">
                                <IconAlertTriangle size={14} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                                <Text size="sm" fw={600} c="red.3">이슈 발생 {issues.length}건</Text>
                                <List size="xs" c="gray.4" withPadding spacing={2}>
                                    {issues.map(p => <List.Item key={p.id}>{p.content}</List.Item>)}
                                </List>
                            </Box>
                        </Group>
                    )}

                    {supplies.length > 0 && (
                        <Group align="flex-start" gap="xs">
                            <ThemeIcon color="orange" variant="light" size="sm" radius="md">
                                <IconBoxSeam size={14} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                                <Text size="sm" fw={600} c="orange.3">재고/물품 {supplies.length}건</Text>
                                <List size="xs" c="gray.4" withPadding spacing={2}>
                                    {supplies.map(p => <List.Item key={p.id}>{p.content}</List.Item>)}
                                </List>
                            </Box>
                        </Group>
                    )}

                    {tasks.length > 0 && (
                        <Group align="flex-start" gap="xs">
                            <ThemeIcon color="blue" variant="light" size="sm" radius="md">
                                <IconCheck size={14} />
                            </ThemeIcon>
                            <Box style={{ flex: 1 }}>
                                <Text size="sm" fw={600} c="blue.3">주요 업무 완료 {tasks.length}건</Text>
                                <List size="xs" c="gray.4" withPadding spacing={2}>
                                    {tasks.map(p => <List.Item key={p.id}>{p.content}</List.Item>)}
                                </List>
                            </Box>
                        </Group>
                    )}
                </Stack>
            </Collapse>
        </Paper>
    );
}
