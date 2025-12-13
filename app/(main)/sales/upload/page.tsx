'use client';

import { Title, Text, Stack, Group, Card, Button, Tabs, Badge, Alert, LoadingOverlay, TextInput, NumberInput, Select, ActionIcon, Autocomplete } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useState, useEffect } from 'react';
import { IconPhoto, IconFileSpreadsheet, IconInfoCircle, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getRecentMenuItems } from '../actions';
import { useStore } from '../../_contexts/store-context';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('excel');
    const [recentItems, setRecentItems] = useState<{ name: string, price: number }[]>([]);

    useEffect(() => {
        getRecentMenuItems().then(setRecentItems);
    }, []);

    const handleDrop = async (files: File[]) => {
        setFiles(files);
        setLoading(true);
        try {
            const file = files[0];
            let data: any[] = [];

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const { parseExcel } = await import('../_utils/excel-parser');
                data = await parseExcel(file);
            } else if (file.type.startsWith('image/')) {
                const { parseReceipt } = await import('../_utils/ocr-parser');
                const result = await parseReceipt(file);
                // parseReceipt returns array or single object? We updated it to promise ParsedSaleData[]
                // Wait, check ocr-parser signature. The last edit made it return ParsedSaleData[]
                data = Array.isArray(result) ? result : [result];
            }

            if (data.length === 0) {
                throw new Error('데이터를 인식하지 못했습니다.');
            }

            setParsedData(data);
            setStep('preview');
            notifications.show({ title: '분석 성공', message: `${data.length}건의 데이터를 인식했습니다.`, color: 'teal' });

        } catch (e: any) {
            console.error(e);
            notifications.show({ title: '오류', message: e.message || '파일 분석 중 오류가 발생했습니다.', color: 'red' });
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const { currentStore } = useStore(); // Get context

    const handleSave = async () => {
        if (parsedData.length === 0) return;

        if (!currentStore) {
            notifications.show({ title: '오류', message: '선택된 매장이 없습니다.', color: 'red' });
            return;
        }

        setLoading(true);
        try {
            const { uploadExcelSales } = await import('../actions');
            const result = await uploadExcelSales(parsedData, currentStore.id); // Pass storeId
            if (result.success) {
                notifications.show({ title: '저장 완료', message: '데이터가 성공적으로 저장되었습니다.', color: 'teal' });
                window.location.href = '/sales';
            } else {
                notifications.show({ title: '저장 실패', message: result.error, color: 'red' });
            }
        } catch (e) {
            notifications.show({ title: '오류', message: '저장 중 시스템 오류가 발생했습니다.', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack gap="xl" pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />

            <Stack gap={4}>
                <Title order={3} c="white">매출 데이터 업로드</Title>
                <Text c="gray.4" size="sm">엑셀 파일이나 영수증/마감보고 사진을 올려주세요.</Text>
            </Stack>

            {step === 'upload' && (
                <Tabs value={activeTab} onChange={setActiveTab} variant="outline" color="teal" styles={{ tabLabel: { color: 'white' } }}>
                    <Tabs.List>
                        <Tabs.Tab value="excel" leftSection={<IconFileSpreadsheet size={16} />} style={{ color: 'white' }}>엑셀 업로드</Tabs.Tab>
                        <Tabs.Tab value="image" leftSection={<IconPhoto size={16} />} style={{ color: 'white' }}>영수증/마감 사진</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="excel" pt="xl">
                        <Dropzone
                            onDrop={handleDrop}
                            onReject={() => notifications.show({ title: '거절됨', message: '엑셀 파일만 가능합니다.', color: 'red' })}
                            maxSize={5 * 1024 ** 2}
                            accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                            bg="#1A1B1E"
                        >
                            <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                                <IconFileSpreadsheet size={50} color="teal" />
                                <Stack gap={0}>
                                    <Text size="xl" inline c="white">엑셀 파일을 여기로 드래그</Text>
                                    <Text size="sm" c="gray.5">배민/요기요 정산 내역 파일</Text>
                                </Stack>
                            </Group>
                        </Dropzone>
                    </Tabs.Panel>

                    <Tabs.Panel value="image" pt="xl">
                        <Stack>
                            <Alert icon={<IconInfoCircle size={16} />} title="베타 기능" color="yellow" variant="light" styles={{ title: { color: 'white' }, message: { color: '#e0e0e0' } }}>
                                손으로 쓴 마감일지나 영수증 사진을 올려보세요. <br />
                                <strong>Tip:</strong> 글자가 잘 보이게 밝은 곳에서 찍어주세요.
                            </Alert>
                            <Dropzone
                                onDrop={handleDrop}
                                onReject={() => notifications.show({ title: '거절됨', message: '이미지 파일만 가능합니다.', color: 'red' })}
                                maxSize={5 * 1024 ** 2}
                                accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.webp]}
                                bg="#1A1B1E"
                            >
                                <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                                    <IconPhoto size={50} color="orange" />
                                    <Stack gap={0}>
                                        <Text size="xl" inline c="white">영수증/마감보고 사진 드래그</Text>
                                        <Text size="sm" c="gray.5">카톡 마감보고 캡쳐도 가능합니다.</Text>
                                    </Stack>
                                </Group>
                            </Dropzone>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            )}

            {step === 'preview' && (
                <Stack>
                    <Card withBorder radius="md" bg="#1A1B1E">
                        <Group justify="space-between" mb="md">
                            <Title order={5} c="white">인식 결과 ({parsedData.length}건)</Title>
                            <Badge color={activeTab === 'image' ? 'orange' : 'teal'}>
                                {activeTab === 'image' ? 'AI OCR' : 'Excel Parser'}
                            </Badge>
                        </Group>
                        <Stack gap="sm">
                            {parsedData.map((item, idx) => (
                                <Card key={idx} withBorder p="sm" bg="#2C2E33" style={{ borderColor: '#373A40' }}>
                                    <Group justify="space-between" align="start" mb="xs">
                                        <Stack gap={4} style={{ flex: 1 }}>
                                            <TextInput
                                                label="날짜"
                                                value={item.date}
                                                onChange={(e) => {
                                                    const newData = [...parsedData];
                                                    newData[idx].date = e.currentTarget.value;
                                                    setParsedData(newData);
                                                }}
                                                styles={{ input: { color: 'white', backgroundColor: '#1F2937', borderColor: '#374151' }, label: { color: '#9CA3AF' } }}
                                            />
                                            <Select
                                                label="플랫폼"
                                                data={['HALL', 'BAEMIN', 'YOGIYO', 'COUPANG', 'ETC']}
                                                value={item.platform ? item.platform.toUpperCase() : 'HALL'}
                                                onChange={(val) => {
                                                    const newData = [...parsedData];
                                                    newData[idx].platform = val;
                                                    setParsedData(newData);
                                                }}
                                                styles={{ input: { color: 'white', backgroundColor: '#1F2937', borderColor: '#374151' }, label: { color: '#9CA3AF' }, dropdown: { backgroundColor: '#1F2937', color: 'white' }, option: { color: 'white' } }}
                                            />
                                        </Stack>
                                        <Stack gap={4} style={{ flex: 1 }}>
                                            <NumberInput
                                                label="총 매출액 (자동합계)"
                                                value={item.amount}
                                                thousandSeparator
                                                rightSection={<Text size="xs" c="dimmed">원</Text>}
                                                onChange={(val) => {
                                                    const newData = [...parsedData];
                                                    newData[idx].amount = Number(val);
                                                    setParsedData(newData);
                                                }}
                                                styles={{ input: { color: '#22d3ee', fontWeight: 700, backgroundColor: '#1F2937', borderColor: '#374151' }, label: { color: '#9CA3AF' } }}
                                                readOnly // Make it read-only if it's purely auto-calculated? Or allow override? User asked for "correction in real time", implying auto-calc. Let's keep it editable but auto-update on item change.
                                            />
                                            {item.items && (
                                                <Text size="xs" c="dimmed" ta="right">
                                                    총 수량: <Text span c="white" fw={700}>{item.items.reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0)}</Text>개
                                                </Text>
                                            )}
                                        </Stack>
                                        <ActionIcon color="red" variant="subtle" onClick={() => {
                                            const newData = parsedData.filter((_, i) => i !== idx);
                                            setParsedData(newData);
                                        }}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>

                                    {item.items && item.items.length > 0 && (
                                        <Stack gap={8} mt="sm" pl="md" style={{ borderLeft: '2px solid #555' }}>
                                            <Text size="xs" c="dimmed">상세 품목 (인식된 메뉴)</Text>
                                            {item.items.map((subItem: any, subIdx: number) => (
                                                <Group key={subIdx} justify="space-between" align="center">
                                                    <Autocomplete
                                                        size="xs"
                                                        value={subItem.name}
                                                        data={recentItems.map(i => i.name)}
                                                        onChange={(val) => {
                                                            const newData = [...parsedData];
                                                            newData[idx].items[subIdx].name = val;

                                                            // Auto-fill price if match found
                                                            const match = recentItems.find(i => i.name === val);
                                                            if (match) {
                                                                newData[idx].items[subIdx].price = match.price;
                                                                // Recalculate total immediately
                                                                const newTotal = newData[idx].items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                                                                newData[idx].amount = newTotal;
                                                            }

                                                            setParsedData(newData);
                                                        }}
                                                        styles={{ input: { color: 'white', backgroundColor: '#374151', borderColor: 'transparent', width: '120px' }, dropdown: { backgroundColor: '#1F2937' }, option: { color: 'white', '&:hover': { backgroundColor: '#374151' } } }}
                                                    />
                                                    <Group gap={4}>
                                                        <NumberInput
                                                            size="xs"
                                                            value={subItem.quantity}
                                                            onChange={(val) => {
                                                                const newData = [...parsedData];
                                                                const newQty = Number(val);
                                                                newData[idx].items[subIdx].quantity = newQty;

                                                                // Auto-calculate Total Amount
                                                                const newTotal = newData[idx].items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                                                                newData[idx].amount = newTotal;

                                                                setParsedData(newData);
                                                            }}
                                                            min={1}
                                                            styles={{ input: { color: 'white', backgroundColor: '#374151', borderColor: 'transparent', width: '50px', paddingRight: 0 } }}
                                                        />
                                                        <Text size="xs" c="dimmed">개</Text>
                                                    </Group>
                                                    <Group gap={4}>
                                                        {/* Unit Price Input */}
                                                        <NumberInput
                                                            size="xs"
                                                            value={subItem.price}
                                                            thousandSeparator
                                                            onChange={(val) => {
                                                                const newData = [...parsedData];
                                                                const newPrice = Number(val);
                                                                newData[idx].items[subIdx].price = newPrice;

                                                                // Auto-calculate Total Amount
                                                                const newTotal = newData[idx].items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                                                                newData[idx].amount = newTotal;

                                                                setParsedData(newData);
                                                            }}
                                                            styles={{ input: { color: 'white', backgroundColor: '#374151', borderColor: 'transparent', width: '70px', textAlign: 'right' } }}
                                                            hideControls
                                                        />
                                                        <Text size="xs" c="dimmed">원(단가)</Text>
                                                    </Group>

                                                    {/* Line Total Display */}
                                                    <Group gap={2} style={{ minWidth: '60px', justifyContent: 'flex-end' }}>
                                                        <Text size="sm" fw={700} c="cyan">
                                                            {(subItem.price * subItem.quantity).toLocaleString()}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">원</Text>
                                                    </Group>

                                                    <ActionIcon size="xs" color="red" variant="transparent" onClick={() => {
                                                        const newData = [...parsedData];
                                                        newData[idx].items = newData[idx].items.filter((_: any, i: number) => i !== subIdx);

                                                        // Auto-calculate Total Amount after delete
                                                        const newTotal = newData[idx].items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
                                                        newData[idx].amount = newTotal;

                                                        setParsedData(newData);
                                                    }}>
                                                        <IconX size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            ))}
                                            <Button
                                                size="xs"
                                                variant="light"
                                                color="gray"
                                                fullWidth
                                                onClick={() => {
                                                    const newData = [...parsedData];
                                                    newData[idx].items.push({ name: '메뉴 추가', quantity: 1, price: 0 });
                                                    setParsedData(newData);
                                                }}
                                            >
                                                + 메뉴 추가하기
                                            </Button>
                                        </Stack>
                                    )}
                                </Card>
                            ))}
                        </Stack>
                    </Card>

                    <Button size="xl" onClick={handleSave} loading={loading} color="teal">
                        이대로 저장하기
                    </Button>
                    <Button variant="default" onClick={() => { setStep('upload'); setFiles([]); }}>
                        취소하고 다시 올리기
                    </Button>
                </Stack>
            )}
        </Stack>
    );
}
