import { Modal, Stack, TextInput, NumberInput, Select, Button, Group } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { submitManualExpense } from '../actions';
import { IconCheck, IconCalendar, IconCurrencyWon } from '@tabler/icons-react';

interface ManualExpenseModalProps {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ManualExpenseModal({ opened, onClose, onSuccess }: ManualExpenseModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            date: new Date(),
            merchant_name: '',
            amount: '' as number | string, // Handle as string initially for better UX or empty state
            category: '식자재'
        },
        validate: {
            merchant_name: (val) => val.length < 1 ? '사용처를 입력해주세요' : null,
            amount: (val) => Number(val) > 0 ? null : '금액을 입력해주세요'
        }
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('date', values.date.toISOString().split('T')[0]);
        formData.append('merchant_name', values.merchant_name);
        formData.append('amount', String(values.amount));
        formData.append('category', values.category);

        const result = await submitManualExpense(formData);
        setLoading(false);

        if (result.success) {
            notifications.show({
                title: '지출 등록 완료',
                message: '성공적으로 저장되었습니다.',
                color: 'teal',
                icon: <IconCheck size={16} />
            });
            form.reset();
            onSuccess();
            onClose();
        } else {
            notifications.show({
                title: '저장 실패',
                message: result.error,
                color: 'red'
            });
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="지출 직접 입력"
            centered
            size="lg"
            radius="md"
            styles={{
                header: { backgroundColor: '#1F2937', color: 'white' },
                content: { backgroundColor: '#1F2937', border: '1px solid #374151' },
                title: { fontWeight: 700 },
                body: { backgroundColor: '#1F2937' }
            }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <DateInput
                        label="날짜"
                        placeholder="날짜 선택"
                        leftSection={<IconCalendar size={16} />}
                        {...form.getInputProps('date')}
                        locale="ko"
                        valueFormat="YYYY년 M월 D일"
                    />

                    <Select
                        label="카테고리"
                        data={['식자재', '배달비', '인건비', '임대료', '공과금', '마케팅', '기타']}
                        {...form.getInputProps('category')}
                        allowDeselect={false}
                    />

                    <TextInput
                        label="사용처"
                        placeholder="예: 식자재 마트, 편의점"
                        data-autofocus
                        {...form.getInputProps('merchant_name')}
                    />

                    <NumberInput
                        label="금액"
                        placeholder="0"
                        leftSection={<IconCurrencyWon size={16} />}
                        thousandSeparator
                        hideControls
                        size="lg"
                        styles={{ input: { fontSize: 24, fontWeight: 700 } }}
                        {...form.getInputProps('amount')}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        mt="md"
                        loading={loading}
                        color="indigo"
                    >
                        등록하기
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
