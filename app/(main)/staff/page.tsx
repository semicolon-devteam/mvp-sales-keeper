'use client';

import { Container, Stack, Title, Tabs, Paper, Text } from '@mantine/core';
import { IconUsers, IconCalendarTime, IconClockPlay } from '@tabler/icons-react';
import { StaffList } from './_components/StaffList';
import { ShiftScheduler } from './_components/ShiftScheduler';
import { AttendanceCard } from './_components/AttendanceCard';
import { useState } from 'react';

export default function StaffPage() {
    const [activeTab, setActiveTab] = useState<string | null>('list');

    return (
        <Container size="lg" py="xl">
            <Stack gap="lg">
                <Title order={2} c="white">직원 관리 시스템</Title>

                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md" color="teal">
                    <Tabs.List mb="md">
                        <Tabs.Tab value="list" leftSection={<IconUsers size={16} />} c="white">
                            직원 목록
                        </Tabs.Tab>
                        <Tabs.Tab value="schedule" leftSection={<IconCalendarTime size={16} />} c="white">
                            근무 일정표
                        </Tabs.Tab>
                        <Tabs.Tab value="attendance" leftSection={<IconClockPlay size={16} />} c="white">
                            출퇴근 기록
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="list">
                        <StaffList />
                    </Tabs.Panel>

                    <Tabs.Panel value="schedule">
                        <ShiftScheduler />
                    </Tabs.Panel>

                    <Tabs.Panel value="attendance">
                        <AttendanceCard />
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
