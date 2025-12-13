'use client';

import { useState, useEffect } from 'react';
import { Paper, Stack, Text, Switch, Group, Button, Select, ThemeIcon, Badge, Alert } from '@mantine/core';
import { IconBell, IconBellOff, IconClock, IconCalendarDollar, IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
    checkNotificationPermission,
    requestNotificationPermission,
    showLocalNotification,
    NotificationPermissionStatus
} from '@/app/_shared/utils/notifications';

interface NotificationSettingsState {
    enabled: boolean;
    reminderTime: string;
    settlementAlert: boolean;
}

const DEFAULT_SETTINGS: NotificationSettingsState = {
    enabled: false,
    reminderTime: '21:00',
    settlementAlert: true,
};

export function NotificationSettings() {
    const [permission, setPermission] = useState<NotificationPermissionStatus>('default');
    const [settings, setSettings] = useState<NotificationSettingsState>(DEFAULT_SETTINGS);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 권한 상태 확인
        checkNotificationPermission().then(setPermission);

        // 저장된 설정 로드
        const saved = localStorage.getItem('notification_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }

        // PWA 설치 여부 확인
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    const handleRequestPermission = async () => {
        const result = await requestNotificationPermission();
        setPermission(result);

        if (result === 'granted') {
            notifications.show({
                title: '알림 허용됨',
                message: '이제 알림을 받을 수 있습니다.',
                color: 'teal'
            });

            // 테스트 알림 발송
            showLocalNotification({
                title: '알림 설정 완료!',
                body: '매출지킴이 알림이 활성화되었습니다.',
            });
        } else if (result === 'denied') {
            notifications.show({
                title: '알림 거부됨',
                message: '브라우저 설정에서 알림을 허용해주세요.',
                color: 'red'
            });
        }
    };

    const handleToggle = (key: keyof NotificationSettingsState, value: boolean | string) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('notification_settings', JSON.stringify(newSettings));
    };

    const handleTestNotification = () => {
        showLocalNotification({
            title: '테스트 알림',
            body: '알림이 정상적으로 작동합니다!',
            tag: 'test'
        });
    };

    const timeOptions = [
        { value: '18:00', label: '오후 6시' },
        { value: '19:00', label: '오후 7시' },
        { value: '20:00', label: '오후 8시' },
        { value: '21:00', label: '오후 9시' },
        { value: '22:00', label: '오후 10시' },
    ];

    return (
        <Stack gap="md">
            {/* 권한 상태 */}
            <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                <Group justify="space-between" align="center">
                    <Group>
                        <ThemeIcon
                            size="lg"
                            radius="md"
                            color={permission === 'granted' ? 'teal' : 'gray'}
                            variant="light"
                        >
                            {permission === 'granted' ? <IconBell size={20} /> : <IconBellOff size={20} />}
                        </ThemeIcon>
                        <div>
                            <Text fw={600} c="white">알림 권한</Text>
                            <Text size="xs" c="dimmed">
                                {permission === 'granted' && '알림이 허용되었습니다'}
                                {permission === 'denied' && '알림이 차단되었습니다'}
                                {permission === 'default' && '알림 권한을 요청해주세요'}
                                {permission === 'unsupported' && '이 브라우저는 알림을 지원하지 않습니다'}
                            </Text>
                        </div>
                    </Group>
                    <Badge color={permission === 'granted' ? 'teal' : 'gray'}>
                        {permission === 'granted' ? '허용됨' : permission === 'denied' ? '차단됨' : '미설정'}
                    </Badge>
                </Group>

                {permission !== 'granted' && permission !== 'unsupported' && (
                    <Button
                        fullWidth
                        mt="md"
                        color="teal"
                        onClick={handleRequestPermission}
                        disabled={permission === 'denied'}
                    >
                        {permission === 'denied' ? '브라우저 설정에서 허용 필요' : '알림 허용하기'}
                    </Button>
                )}
            </Paper>

            {/* PWA 안내 */}
            {!isStandalone && (
                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                    <Text size="sm">
                        앱으로 설치하면 알림을 더 안정적으로 받을 수 있습니다!
                    </Text>
                </Alert>
            )}

            {/* 알림 설정 */}
            {permission === 'granted' && (
                <>
                    <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Group>
                                    <IconClock size={20} color="#868E96" />
                                    <div>
                                        <Text fw={600} c="white">매출 입력 리마인더</Text>
                                        <Text size="xs" c="dimmed">매일 지정한 시간에 알림</Text>
                                    </div>
                                </Group>
                                <Switch
                                    checked={settings.enabled}
                                    onChange={(e) => handleToggle('enabled', e.currentTarget.checked)}
                                    color="teal"
                                />
                            </Group>

                            {settings.enabled && (
                                <Select
                                    label="알림 시간"
                                    value={settings.reminderTime}
                                    onChange={(val) => val && handleToggle('reminderTime', val)}
                                    data={timeOptions}
                                    styles={{
                                        input: { backgroundColor: '#1F2937', color: 'white', borderColor: '#374151' },
                                        label: { color: '#9CA3AF' },
                                        dropdown: { backgroundColor: '#1F2937' },
                                        option: { color: 'white' }
                                    }}
                                />
                            )}
                        </Stack>
                    </Paper>

                    <Paper p="md" radius="md" bg="#1B2136" style={{ border: '1px solid #2C2E33' }}>
                        <Group justify="space-between">
                            <Group>
                                <IconCalendarDollar size={20} color="#868E96" />
                                <div>
                                    <Text fw={600} c="white">정산일 알림</Text>
                                    <Text size="xs" c="dimmed">배민/요기요/쿠팡 정산일에 알림</Text>
                                </div>
                            </Group>
                            <Switch
                                checked={settings.settlementAlert}
                                onChange={(e) => handleToggle('settlementAlert', e.currentTarget.checked)}
                                color="teal"
                            />
                        </Group>
                    </Paper>

                    <Button variant="light" color="gray" onClick={handleTestNotification}>
                        테스트 알림 보내기
                    </Button>
                </>
            )}
        </Stack>
    );
}
