'use client';

import { Alert, Text, Group, Button } from '@mantine/core';
import { IconRobot, IconArrowRight } from '@tabler/icons-react';
import type { FinancialSnapshot } from '../financial-actions';
import { formatCurrency } from '@/app/_shared/utils/format';

export function FinancialBriefing({ data }: { data: FinancialSnapshot }) {
    const isProfitPositive = data.netProfit >= 0;

    // Simple Rule-based Insight Generation
    let insight = '';
    if (data.revenue === 0) {
        insight = "아직 오늘 매출이 없습니다. 힘찬 하루 시작해보세요!";
    } else if (data.netProfit < 0) {
        insight = `현재 ${formatCurrency(Math.abs(data.netProfit))} 적자 상태입니다. `;
        if (data.laborCost > data.revenue * 0.4) {
            insight += "인건비 비중이 40%를 넘었습니다. 근무 일정을 조정해보세요.";
        } else if (data.expenseCost > data.revenue * 0.5) {
            insight += "재료비 및 지출이 매출의 50%를 넘었습니다.";
        } else {
            insight += "고정비와 지출이 현재 매출보다 높습니다.";
        }
    } else {
        insight = `좋습니다! 현재 순수익은 ${formatCurrency(data.netProfit)} (마진율 ${data.profitMargin.toFixed(0)}%) 입니다. `;
        if (data.laborCost < data.revenue * 0.2) {
            insight += "인건비 관리가 아주 효율적입니다.";
        } else {
            insight += "안정적으로 운영되고 있습니다.";
        }
    }

    return (
        <Alert
            variant="light"
            color={isProfitPositive ? "teal" : "red"}
            title={
                <Group>
                    <IconRobot size={18} />
                    <Text fw={700} c={isProfitPositive ? 'teal.2' : 'red.2'}>AI 금융 브리핑</Text>
                </Group>
            }
            icon={null}
            styles={{
                message: { color: 'white' }
            }}
        >
            <Text size="sm" mb="xs" c="white">{insight}</Text>
        </Alert>
    );
}
