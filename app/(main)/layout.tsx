'use client';

import { AppShell, Box, Container, Center, Loader } from '@mantine/core';
import { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';

import { StoreProvider, useStore } from './_contexts/store-context';
import { MobileBottomNav } from './_components/MobileBottomNav';
import { DesktopSidebar } from './_components/DesktopSidebar';
import { StoreOnboarding } from './_components/StoreOnboarding';

function MainLayoutContent({ children }: { children: ReactNode }) {
    const { myStores, isLoading } = useStore();
    const [opened, { toggle }] = useDisclosure();

    // Loading state
    if (isLoading) {
        return (
            <Center style={{ minHeight: '100vh', backgroundColor: '#111827' }}>
                <Loader color="teal" size="lg" />
            </Center>
        );
    }

    // No stores - show onboarding
    if (myStores.length === 0) {
        return <StoreOnboarding />;
    }

    // Has stores - show normal layout
    return (
        <AppShell
                padding={0}
                navbar={{
                    width: 260,
                    breakpoint: 'sm',
                    collapsed: { mobile: true } // Hide sidebar on mobile
                }}
                layout="alt" // Alt layout keeps header above sidebar if we add one, or simply separates nav
                styles={{
                    main: {
                        backgroundColor: '#111827', // Dark Body
                        minHeight: '100vh',
                        paddingBottom: '80px', // Space for bottom nav on mobile
                    }
                }}
            >
                <AppShell.Navbar p={0} hiddenFrom="sm" style={{ borderRight: 'none' }}>
                    {/* Empty for mobile since we use specific components, 
                         or if we wanted a drawer we'd put it here.
                         But we use BottomNav for mobile. 
                         So Navbar only visibleFrom="sm" really.
                      */}
                </AppShell.Navbar>

                {/* Desktop Sidebar (Only visible on SM+) */}
                <AppShell.Navbar visibleFrom="sm" style={{ backgroundColor: '#111827', borderRight: '1px solid #374151' }}>
                    <DesktopSidebar />
                </AppShell.Navbar>

                <AppShell.Main>
                    <Container size="lg" h="100%" px="md" py="xl">
                        {children}
                    </Container>
                </AppShell.Main>

                {/* Mobile Bottom Navigation (Only visible on Mobile) */}
                <MobileBottomNav />
            </AppShell>
    );
}

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <StoreProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </StoreProvider>
    );
}
