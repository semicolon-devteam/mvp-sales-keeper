'use client';

import { Stack, Text, UnstyledButton, Group, ThemeIcon, Select } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    IconChartPie,
    IconPlus,
    IconReceipt,
    IconCalendarStats,
    IconMessageCircle,
    IconBuildingStore,
    IconLogout,
    IconUsers
} from '@tabler/icons-react';
import { useStore } from '../_contexts/store-context';

export function DesktopSidebar() {
    const pathname = usePathname();
    const { role, myStores, currentStore, setCurrentStore } = useStore();
    const router = useRouter();

    // Define menus based on role
    const getMenuItems = () => {
        if (role === 'staff') {
            return [
                { icon: IconMessageCircle, label: '타임라인', href: '/timeline' },
                { icon: IconReceipt, label: '지출관리', href: '/expenses' },
            ];
        }

        // Owner / Manager
        return [
            { icon: IconChartPie, label: '대시보드', href: '/dashboard' },
            { icon: IconPlus, label: '매출입력', href: '/sales' },
            { icon: IconReceipt, label: '지출관리', href: '/expenses' },
            { icon: IconCalendarStats, label: '캘린더', href: '/calendar' },
            { icon: IconMessageCircle, label: '타임라인', href: '/timeline' },
            { icon: IconUsers, label: '직원관리', href: '/staff' },
        ];
    };

    const items = getMenuItems();

    return (
        <Stack h="100%" p="md" bg="#111827" style={{ borderRight: '1px solid #374151' }} justify="space-between">
            <Stack gap="xl">
                <Stack gap="xs">
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase">Current Store</Text>
                    <Select
                        data={[
                            { value: 'ALL', label: '🏪 전체 매장 통합' },
                            ...myStores.map(s => ({ value: s.id, label: s.name }))
                        ]}
                        value={currentStore?.id}
                        onChange={(val) => {
                            if (val === 'ALL') {
                                // Virtual Store for "All Stores"
                                const allStoreMock = {
                                    id: 'ALL',
                                    name: '전체 매장 통합',
                                    owner_id: 'me',
                                    created_at: new Date().toISOString()
                                };
                                setCurrentStore(allStoreMock);
                            } else {
                                const store = myStores.find(s => s.id === val);
                                if (store) setCurrentStore(store);
                            }
                        }}
                        allowDeselect={false}
                        leftSection={<IconBuildingStore size={16} />}
                        styles={{
                            input: {
                                backgroundColor: '#1F2937',
                                borderColor: '#374151',
                                color: 'white',
                                fontWeight: 600
                            },
                            dropdown: {
                                backgroundColor: '#1F2937',
                                borderColor: '#374151',
                                color: 'white'
                            },
                            option: {
                                color: 'white',
                                // '&:hover': { backgroundColor: '#374151' }, // Causing crash
                                // '&[data-checked]': { backgroundColor: '#2563eb', color: 'white' } // Causing crash
                            }
                        }}
                    />
                </Stack>

                {/* Navigation Links */}
                <Stack gap="xs">
                    {items.map((item) => (
                        <SidebarLink
                            key={item.href}
                            {...item}
                            active={pathname === item.href}
                        />
                    ))}
                </Stack>
            </Stack>

            {/* Footer Area */}
            <Group>
                {/* User Profile or Logout could go here */}
            </Group>
        </Stack>
    );
}

function SidebarLink({ icon: Icon, label, href, active }: { icon: any, label: string, href: string, active: boolean }) {
    return (
        <UnstyledButton
            component={Link}
            href={href}
            style={{
                display: 'block',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: active ? '#1F2937' : 'transparent',
                color: active ? '#60A5FA' : '#9CA3AF',
                transition: 'all 0.2s ease',
            }}
        >
            <Group>
                <ThemeIcon variant="light" color={active ? 'blue' : 'gray'} size="md" bg="transparent">
                    <Icon size={20} />
                </ThemeIcon>
                <Text size="sm" fw={active ? 600 : 500}>{label}</Text>
            </Group>
        </UnstyledButton>
    );
}
