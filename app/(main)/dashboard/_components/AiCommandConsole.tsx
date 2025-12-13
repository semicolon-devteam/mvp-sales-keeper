'use client';

import { Paper, Text, Stack, Group, ThemeIcon, Button, ScrollArea, Avatar, Box } from '@mantine/core';
import { IconRobot, IconSparkles, IconSend } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { useTypewriter } from '@/app/_shared/hooks/useTypewriter';

type AiMessage = {
    id: string;
    role: 'ai' | 'user';
    text: string;
};

type ActionChip = {
    id: string;
    label: string;
    action: () => void;
};

interface AiCommandConsoleProps {
    initialAlerts?: { message: string, type: string }[];
}

export function AiCommandConsole({ initialAlerts = [] }: AiCommandConsoleProps) {
    const [messages, setMessages] = useState<AiMessage[]>([
        { id: 'init', role: 'ai', text: '사장님, 좋은 아침입니다. ☀️\n오늘 매장 건강 점수는 **87점**입니다.' }
    ]);

    useEffect(() => {
        if (initialAlerts.length > 0) {
            const alertText = initialAlerts.map(a => `🔔 [알림] ${a.message}`).join('\n');
            const newMsg: AiMessage = { id: 'alert', role: 'ai', text: `확인해야 할 사항이 있습니다:\n${alertText}` };
            setMessages(prev => [...prev, newMsg]);
        }
    }, [initialAlerts]);
    const [typingText, setTypingText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const viewport = useRef<HTMLDivElement>(null); // Ref for scrolling

    // Initial typewriter effect for the *last* AI message
    const { displayedText, isComplete } = useTypewriter(typingText, 20);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, displayedText]); // Also scroll as text types

    // Sync typing text when a new AI message is added
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'ai') {
            setTypingText(lastMsg.text);
            setIsTyping(true);
        } else {
            setIsTyping(false);
        }
    }, [messages]);

    const handleChipClick = (label: string, response: string) => {
        // 1. Add User Message
        const userMsg: AiMessage = { id: Date.now().toString(), role: 'user', text: label };
        setMessages(prev => [...prev, userMsg]);

        // 2. Simulate AI Thinking & Response
        setTimeout(() => {
            const aiMsg: AiMessage = { id: (Date.now() + 1).toString(), role: 'ai', text: response };
            setMessages(prev => [...prev, aiMsg]);
        }, 600);
    };


    const chips: ActionChip[] = [
        {
            id: 'cost',
            label: '식자재 비용 분석해줘 🥩',
            action: () => handleChipClick('식자재 비용 분석해줘', '최근 **돼지고기 가격이 15% 상승**한 것이 주원인입니다. \n다른 거래처와 비교해볼까요? [거래처 비교하기]')
        },
        {
            id: 'predict',
            label: '오늘 매출 예측해줘 🔮',
            action: () => handleChipClick('오늘 매출 예측해줘', '현재 추세라면 오늘 약 **150만원** 매출이 예상됩니다. \n저녁 7시에 피크가 올 것 같아요.')
        },
        {
            id: 'praise',
            label: '칭찬해줘 👏',
            action: () => handleChipClick('칭찬해줘', '정말 잘하고 계십니다! 🚀 \n지난주보다 **재방문율이 5%**나 올랐어요. 손님들이 사장님 친절함을 아나봐요.')
        }
    ];

    return (
        <Paper
            h="100%"
            radius="lg"
            p="md"
            style={{
                background: 'linear-gradient(145deg, #1f2937 0%, #111827 100%)',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <Group justify="space-between" mb="md" align="center">
                <Group gap="xs">
                    <ThemeIcon variant="light" color="indigo" radius="xl" size="sm">
                        <IconRobot size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={700} c="indigo.2" tt="uppercase" style={{ letterSpacing: '1px' }}>
                        AI Command Center
                    </Text>
                </Group>
                <ThemeIcon variant="subtle" color="gray" size="sm">
                    <IconSparkles size={14} />
                </ThemeIcon>
            </Group>

            {/* Chat Area */}
            <ScrollArea style={{ flex: 1 }} scrollbarSize={6} viewportRef={viewport}>
                <Stack gap="md" pb="xs">
                    {messages.map((msg, index) => {
                        const isLastAi = index === messages.length - 1 && msg.role === 'ai';
                        return (
                            <Group key={msg.id} align="flex-start" justify={msg.role === 'user' ? 'flex-end' : 'flex-start'} gap="xs">
                                {msg.role === 'ai' && (
                                    <Avatar size="sm" radius="xl" bg="indigo" color="white">AI</Avatar>
                                )}
                                <Box
                                    style={{
                                        maxWidth: '85%',
                                        padding: '10px 14px',
                                        borderRadius: '16px',
                                        borderTopLeftRadius: msg.role === 'ai' ? '2px' : '16px',
                                        borderTopRightRadius: msg.role === 'user' ? '2px' : '16px',
                                        backgroundColor: msg.role === 'user' ? '#4f46e5' : '#374151',
                                        color: 'white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <Text size="sm" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                                        {isLastAi ? displayedText : msg.text}
                                        {isLastAi && !isComplete && <span className="animate-pulse">|</span>}
                                    </Text>
                                </Box>
                            </Group>
                        );
                    })}
                </Stack>
            </ScrollArea>

            {/* Input / Chips Area */}
            <Box mt="md" pt="sm" style={{ borderTop: '1px solid #374151' }}>
                <Text size="xs" c="dimmed" mb="xs" fw={600}>사장님, 무엇을 도와드릴까요?</Text>
                <Group gap="xs">
                    {chips.map(chip => (
                        <Button
                            key={chip.id}
                            variant="light"
                            color="indigo"
                            size="compact-sm"
                            radius="xl"
                            onClick={chip.action}
                            disabled={!isComplete && messages[messages.length - 1].role === 'ai'} // Disable while typing
                            style={{ border: '1px solid rgba(79, 70, 229, 0.2)' }}
                        >
                            {chip.label}
                        </Button>
                    ))}
                </Group>
            </Box>
        </Paper>
    );
}
