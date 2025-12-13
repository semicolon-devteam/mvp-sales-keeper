'use client';

import {
    Modal, Stack, Text, Button, Group, Paper, Table, NumberInput,
    TextInput, ActionIcon, Badge, LoadingOverlay, Progress, Alert,
    Select, Tooltip, RingProgress, ThemeIcon
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import {
    IconUpload, IconX, IconCheck, IconAlertCircle,
    IconReceipt, IconEdit, IconTrash, IconSparkles,
    IconLink, IconPlus, IconBrain, IconArrowRight
} from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import {
    extractIngredientsFromReceipt,
    smartMatchIngredients,
    processSmartMatchedItems,
    type SmartMatchedItem
} from '../live-cost-actions';

interface IngredientReceiptModalProps {
    opened: boolean;
    onClose: () => void;
    storeId?: string;
    onComplete?: (result: any) => void;
}

type ProcessingStep = 'upload' | 'extracting' | 'matching' | 'review' | 'processing' | 'complete';

export function IngredientReceiptModal({ opened, onClose, storeId, onComplete }: IngredientReceiptModalProps) {
    const [step, setStep] = useState<ProcessingStep>('upload');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [items, setItems] = useState<SmartMatchedItem[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const resetModal = useCallback(() => {
        setStep('upload');
        setImagePreview(null);
        setImageBase64(null);
        setItems([]);
        setResult(null);
        setError(null);
    }, []);

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleDrop = async (files: File[]) => {
        if (files.length === 0) return;

        const file = files[0];
        setError(null);

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setImagePreview(result);
            const base64 = result.split(',')[1];
            setImageBase64(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleExtract = async () => {
        if (!imageBase64) return;

        setStep('extracting');
        setError(null);

        try {
            // Step 1: AI로 영수증에서 식자재 추출
            const response = await extractIngredientsFromReceipt(imageBase64);

            if (response.success && response.data) {
                if (response.data.items.length === 0) {
                    setError('영수증에서 식자재를 찾지 못했습니다. 수동으로 입력해주세요.');
                    setStep('upload');
                    return;
                }

                // Step 2: 스마트 매칭 수행
                setStep('matching');
                const matchResponse = await smartMatchIngredients(response.data.items, storeId);

                if (matchResponse.success && matchResponse.data) {
                    setItems(matchResponse.data);
                    setStep('review');
                } else {
                    setError(matchResponse.error || '매칭에 실패했습니다.');
                    setStep('upload');
                }
            } else {
                setError(response.error || 'AI 분석에 실패했습니다.');
                setStep('upload');
            }
        } catch (err: any) {
            setError(err.message);
            setStep('upload');
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            if (field === 'matchType') {
                // 매칭 타입 변경 (기존 → 신규 또는 그 반대)
                newItems[index] = {
                    ...newItems[index],
                    matchResult: {
                        ...newItems[index].matchResult!,
                        matchType: value
                    }
                };
            } else if (field.startsWith('matchResult.')) {
                const subField = field.replace('matchResult.', '');
                newItems[index] = {
                    ...newItems[index],
                    matchResult: {
                        ...newItems[index].matchResult!,
                        [subField]: value
                    }
                };
            } else {
                newItems[index] = { ...newItems[index], [field]: value };
            }
            return newItems;
        });
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, {
            name: '',
            price: 0,
            quantity: 1,
            unit: 'kg',
            matchResult: {
                ingredientId: '',
                ingredientName: '',
                score: 0,
                matchType: 'new'
            },
            suggestedCategory: '기타',
            suggestedUnit: 'kg'
        }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (items.length === 0) {
            setError('처리할 식자재가 없습니다.');
            return;
        }

        setStep('processing');
        setError(null);

        try {
            const response = await processSmartMatchedItems(items, storeId);

            if (response.success && response.data) {
                setResult(response.data);
                setStep('complete');

                // 알림 표시
                const { updated, created, alerts } = response.data;

                if (alerts.length > 0) {
                    notifications.show({
                        title: '🔥 마진 위험 감지!',
                        message: `${alerts.length}개 메뉴의 마진이 위험 수준입니다.`,
                        color: 'red',
                        autoClose: 5000
                    });
                }

                if (created.length > 0) {
                    notifications.show({
                        title: '✨ 신규 식자재 등록',
                        message: `${created.length}개 식자재가 새로 등록되었습니다.`,
                        color: 'indigo',
                        autoClose: 3000
                    });
                }

                if (updated.length > 0) {
                    notifications.show({
                        title: '✅ 원가 업데이트 완료',
                        message: `${updated.length}개 식자재의 가격이 업데이트되었습니다.`,
                        color: 'teal',
                        autoClose: 3000
                    });
                }

                onComplete?.(response.data);
            } else {
                setError(response.error || '처리에 실패했습니다.');
                setStep('review');
            }
        } catch (err: any) {
            setError(err.message);
            setStep('review');
        }
    };

    // 매칭 스코어에 따른 색상
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'teal';
        if (score >= 70) return 'lime';
        if (score >= 60) return 'yellow';
        return 'red';
    };

    // 매칭 타입 라벨
    const getMatchTypeLabel = (type: string) => {
        switch (type) {
            case 'exact': return { label: '정확', color: 'teal' };
            case 'tag': return { label: '태그', color: 'cyan' };
            case 'fuzzy': return { label: 'AI추론', color: 'grape' };
            case 'new': return { label: '신규', color: 'pink' };
            default: return { label: '?', color: 'gray' };
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'upload':
                return (
                    <Stack gap="md">
                        <Text size="sm" c="dimmed" ta="center">
                            식자재 영수증을 업로드하면 AI가 자동으로 분석하여<br />
                            <Text component="span" c="teal" fw={600}>스마트 매칭</Text>으로 기존 식자재와 연결합니다.
                        </Text>

                        <Dropzone
                            onDrop={handleDrop}
                            accept={IMAGE_MIME_TYPE}
                            maxSize={10 * 1024 ** 2}
                            multiple={false}
                            styles={{
                                root: {
                                    backgroundColor: '#374151',
                                    borderColor: '#4B5563',
                                    minHeight: 200
                                }
                            }}
                        >
                            <Stack gap="md" align="center" justify="center" style={{ minHeight: 180 }}>
                                <Dropzone.Accept>
                                    <IconUpload size={50} color="teal" stroke={1.5} />
                                </Dropzone.Accept>
                                <Dropzone.Reject>
                                    <IconX size={50} color="red" stroke={1.5} />
                                </Dropzone.Reject>
                                <Dropzone.Idle>
                                    <IconReceipt size={50} color="gray" stroke={1.5} />
                                </Dropzone.Idle>

                                <div>
                                    <Text size="lg" ta="center" c="white" fw={500}>
                                        영수증 사진을 드래그하거나 클릭하세요
                                    </Text>
                                    <Text size="xs" c="dimmed" ta="center" mt={4}>
                                        JPG, PNG 파일 (최대 10MB)
                                    </Text>
                                </div>
                            </Stack>
                        </Dropzone>

                        {imagePreview && (
                            <Paper p="md" radius="md" bg="rgba(0,0,0,0.2)">
                                <Group justify="space-between" mb="sm">
                                    <Text size="sm" c="white" fw={500}>미리보기</Text>
                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setImageBase64(null);
                                        }}
                                    >
                                        <IconX size={16} />
                                    </ActionIcon>
                                </Group>
                                <img
                                    src={imagePreview}
                                    alt="Receipt preview"
                                    style={{
                                        width: '100%',
                                        maxHeight: 300,
                                        objectFit: 'contain',
                                        borderRadius: 8
                                    }}
                                />
                                <Button
                                    fullWidth
                                    mt="md"
                                    color="teal"
                                    leftSection={<IconBrain size={16} />}
                                    onClick={handleExtract}
                                >
                                    AI 스마트 분석
                                </Button>
                            </Paper>
                        )}

                        {error && (
                            <Alert color="red" icon={<IconAlertCircle size={16} />}>
                                {error}
                            </Alert>
                        )}
                    </Stack>
                );

            case 'extracting':
                return (
                    <Stack gap="md" align="center" py="xl">
                        <IconSparkles size={48} color="#20c997" className="animate-pulse" />
                        <Text size="lg" c="white" fw={500}>AI가 영수증을 분석하고 있습니다...</Text>
                        <Progress value={50} animated color="teal" w="100%" />
                        <Text size="xs" c="dimmed">식자재 항목 추출 중</Text>
                    </Stack>
                );

            case 'matching':
                return (
                    <Stack gap="md" align="center" py="xl">
                        <IconBrain size={48} color="#be4bdb" className="animate-pulse" />
                        <Text size="lg" c="white" fw={500}>스마트 매칭 중...</Text>
                        <Progress value={100} animated color="grape" w="100%" />
                        <Text size="xs" c="dimmed">기존 식자재와 연결하는 중</Text>
                    </Stack>
                );

            case 'review':
                const matchedCount = items.filter(i => i.matchResult?.matchType !== 'new').length;
                const newCount = items.filter(i => i.matchResult?.matchType === 'new').length;

                return (
                    <Stack gap="md">
                        {/* 매칭 요약 */}
                        <Paper p="md" radius="md" bg="rgba(79, 70, 229, 0.1)" style={{ border: '1px solid rgba(79, 70, 229, 0.3)' }}>
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <ThemeIcon variant="light" color="indigo" size="sm">
                                        <IconBrain size={14} />
                                    </ThemeIcon>
                                    <Text size="sm" c="white" fw={500}>스마트 매칭 결과</Text>
                                </Group>
                                <Group gap="xs">
                                    <Badge color="teal" variant="light">매칭 {matchedCount}개</Badge>
                                    <Badge color="pink" variant="light">신규 {newCount}개</Badge>
                                </Group>
                            </Group>
                        </Paper>

                        <Group justify="space-between">
                            <Text size="sm" c="white" fw={500}>
                                추출된 식자재 ({items.length}개)
                            </Text>
                            <Button
                                variant="subtle"
                                color="teal"
                                size="xs"
                                leftSection={<IconPlus size={14} />}
                                onClick={handleAddItem}
                            >
                                항목 추가
                            </Button>
                        </Group>

                        {error && (
                            <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
                                {error}
                            </Alert>
                        )}

                        <Paper p="xs" radius="md" bg="rgba(0,0,0,0.2)" style={{ maxHeight: 400, overflow: 'auto' }}>
                            <Table>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th style={{ color: '#9CA3AF', width: 100 }}>매칭</Table.Th>
                                        <Table.Th style={{ color: '#9CA3AF' }}>영수증 항목</Table.Th>
                                        <Table.Th style={{ color: '#9CA3AF' }}>→</Table.Th>
                                        <Table.Th style={{ color: '#9CA3AF' }}>연결 식자재</Table.Th>
                                        <Table.Th style={{ color: '#9CA3AF' }}>가격</Table.Th>
                                        <Table.Th style={{ width: 40 }}></Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {items.map((item, index) => {
                                        const matchType = getMatchTypeLabel(item.matchResult?.matchType || 'new');
                                        const score = item.matchResult?.score || 0;

                                        return (
                                            <Table.Tr key={index}>
                                                <Table.Td>
                                                    <Group gap={4}>
                                                        {item.matchResult?.matchType !== 'new' && (
                                                            <Tooltip label={`매칭 신뢰도 ${score}%`}>
                                                                <RingProgress
                                                                    size={28}
                                                                    thickness={3}
                                                                    sections={[{ value: score, color: getScoreColor(score) }]}
                                                                    label={
                                                                        <Text size="xs" ta="center" c="white" style={{ fontSize: 8 }}>
                                                                            {score}
                                                                        </Text>
                                                                    }
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        <Badge size="xs" color={matchType.color} variant="light">
                                                            {matchType.label}
                                                        </Badge>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <TextInput
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(index, 'name', e.currentTarget.value)}
                                                        size="xs"
                                                        styles={{ input: { backgroundColor: '#374151', color: 'white', border: 'none' } }}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    {item.matchResult?.matchType !== 'new' ? (
                                                        <IconLink size={14} color="#20c997" />
                                                    ) : (
                                                        <IconPlus size={14} color="#f06595" />
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {item.matchResult?.matchType !== 'new' ? (
                                                        <Text size="sm" c="teal.3">
                                                            {item.matchResult?.ingredientName}
                                                        </Text>
                                                    ) : (
                                                        <Group gap={4}>
                                                            <Text size="xs" c="pink.3">(신규 등록)</Text>
                                                            <Select
                                                                size="xs"
                                                                value={item.suggestedCategory || '기타'}
                                                                onChange={(v) => handleItemChange(index, 'suggestedCategory', v)}
                                                                data={['육류', '해산물', '채소', '과일', '양념/소스', '유제품', '곡류', '가공식품', '음료', '기타']}
                                                                styles={{ input: { backgroundColor: '#374151', color: 'white', border: 'none', width: 80 } }}
                                                            />
                                                        </Group>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    <NumberInput
                                                        value={item.price}
                                                        onChange={(v) => handleItemChange(index, 'price', v || 0)}
                                                        size="xs"
                                                        thousandSeparator
                                                        suffix="원"
                                                        styles={{ input: { backgroundColor: '#374151', color: 'white', border: 'none', width: 100 } }}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="red"
                                                        size="sm"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <IconTrash size={14} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Paper>

                        <Group justify="space-between" mt="md">
                            <Button variant="subtle" color="gray" onClick={() => setStep('upload')}>
                                다시 업로드
                            </Button>
                            <Button
                                color="teal"
                                leftSection={<IconArrowRight size={16} />}
                                onClick={handleProcess}
                                disabled={items.length === 0}
                            >
                                {newCount > 0 ? `등록 + 업데이트 (${items.length})` : `원가 업데이트 (${items.length})`}
                            </Button>
                        </Group>
                    </Stack>
                );

            case 'processing':
                return (
                    <Stack gap="md" align="center" py="xl">
                        <LoadingOverlay visible={true} />
                        <Text size="lg" c="white" fw={500}>원가를 업데이트하고 있습니다...</Text>
                        <Progress value={100} animated color="teal" w="100%" />
                    </Stack>
                );

            case 'complete':
                return (
                    <Stack gap="md">
                        <Paper p="lg" radius="md" bg="rgba(32, 201, 151, 0.1)" style={{ border: '1px solid #20c99740' }}>
                            <Stack gap="sm" align="center">
                                <IconCheck size={48} color="#20c997" />
                                <Text size="lg" c="white" fw={700}>처리 완료!</Text>
                            </Stack>
                        </Paper>

                        {result && (
                            <Stack gap="sm">
                                {/* 업데이트된 항목 */}
                                {result.updated?.length > 0 && (
                                    <Paper p="md" radius="md" bg="rgba(32, 201, 151, 0.1)">
                                        <Text size="sm" c="white" fw={500} mb="xs">
                                            ✅ 업데이트된 식자재 ({result.updated.length})
                                        </Text>
                                        <Stack gap={4}>
                                            {result.updated.map((m: any, i: number) => (
                                                <Group key={i} justify="space-between">
                                                    <Text size="sm" c="gray.3">{m.ingredient.name}</Text>
                                                    <Badge color="teal" variant="light">
                                                        {m.item.price.toLocaleString()}원
                                                    </Badge>
                                                </Group>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* 신규 등록된 항목 */}
                                {result.created?.length > 0 && (
                                    <Paper p="md" radius="md" bg="rgba(190, 75, 219, 0.1)">
                                        <Text size="sm" c="white" fw={500} mb="xs">
                                            ✨ 신규 등록된 식자재 ({result.created.length})
                                        </Text>
                                        <Stack gap={4}>
                                            {result.created.map((m: any, i: number) => (
                                                <Group key={i} justify="space-between">
                                                    <Group gap={4}>
                                                        <Text size="sm" c="gray.3">{m.ingredient.name}</Text>
                                                        <Badge size="xs" color="grape" variant="light">
                                                            {m.ingredient.category}
                                                        </Badge>
                                                    </Group>
                                                    <Badge color="grape" variant="light">
                                                        {m.item.price.toLocaleString()}원
                                                    </Badge>
                                                </Group>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* 마진 위험 알림 */}
                                {result.alerts?.length > 0 && (
                                    <Paper p="md" radius="md" bg="rgba(255, 107, 107, 0.1)" style={{ border: '1px solid #fa525280' }}>
                                        <Text size="sm" c="white" fw={500} mb="xs">
                                            🔥 마진 위험 메뉴 ({result.alerts.length})
                                        </Text>
                                        <Stack gap={4}>
                                            {result.alerts.map((alert: any, i: number) => (
                                                <Text key={i} size="sm" c="red.3">
                                                    • {alert.message}
                                                </Text>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}
                            </Stack>
                        )}

                        <Button fullWidth color="teal" onClick={handleClose}>
                            완료
                        </Button>
                    </Stack>
                );
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="xs">
                    <IconReceipt size={20} />
                    <Text fw={700}>라이브 원가 엔진</Text>
                    <Badge color="grape" variant="light" size="sm">스마트 매칭</Badge>
                </Group>
            }
            size="lg"
            centered
            styles={{
                header: { backgroundColor: '#1F2937', color: 'white' },
                body: { backgroundColor: '#1F2937' },
                close: { color: 'gray' }
            }}
        >
            {renderStep()}
        </Modal>
    );
}
