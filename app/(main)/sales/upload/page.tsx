'use client';

import { Title, Text, Stack, Group, Card, Button } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { useState } from 'react';

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [loading, setLoading] = useState(false);

    // Dynamic import to avoid SSR issues with xlsx potentially
    const handleDrop = async (files: File[]) => {
        setFiles(files);
        setLoading(true);
        try {
            const { parseExcel } = await import('../_utils/excel-parser');
            const data = await parseExcel(files[0]);
            setParsedData(data);
            setStep('preview');
        } catch (e: any) {
            alert(e.message);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (parsedData.length === 0) return;
        setLoading(true);
        try {
            const { uploadExcelSales } = await import('../actions');
            const result = await uploadExcelSales(parsedData);
            if (result.success) {
                alert('엑셀 데이터가 성공적으로 저장되었습니다.');
                window.location.href = '/sales'; // Redirect to list
            } else {
                alert(result.error);
            }
        } catch (e) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack>
            <Title order={3}>매출 엑셀 업로드</Title>

            {step === 'upload' && (
                <>
                    <Text size="sm" mb="md">배민/요기요 정산 내역 파일을 올려주세요.</Text>
                    <Dropzone
                        loading={loading}
                        onDrop={handleDrop}
                        onReject={(files) => alert('엑셀 파일만 업로드 가능합니다.')}
                        maxSize={5 * 1024 ** 2}
                        accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
                    >
                        <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                            <Dropzone.Accept>
                                <Text c="teal">놓아서 업로드</Text>
                            </Dropzone.Accept>
                            <Dropzone.Idle>
                                <Stack align="center">
                                    <Text size="xl" inline>엑셀 파일을 여기로 드래그</Text>
                                    <Text size="sm" c="dimmed">또는 클릭하여 선택</Text>
                                </Stack>
                            </Dropzone.Idle>
                        </Group>
                    </Dropzone>
                </>
            )}

            {step === 'preview' && (
                <Stack>
                    <Card withBorder radius="md">
                        <Title order={5} mb="md">인식된 데이터 ({parsedData.length}건)</Title>
                        <Stack gap="xs">
                            {parsedData.map((item, idx) => (
                                <Group key={idx} justify="space-between">
                                    <Text>{item.date}</Text>
                                    <Group>
                                        <Text fw={700}>{item.amount.toLocaleString()}원</Text>
                                        <Text size="xs" c="dimmed">({item.platform === 'baemin' ? '배민' : '요기요'})</Text>
                                    </Group>
                                </Group>
                            ))}
                        </Stack>
                    </Card>

                    <Button size="xl" onClick={handleSave} loading={loading}>
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
