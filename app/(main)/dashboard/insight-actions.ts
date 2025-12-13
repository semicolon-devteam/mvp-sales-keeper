'use server';

import { createClient } from '@/app/_shared/utils/supabase/server';

// =============================================================================
// Weekly Insight Types
// =============================================================================

export interface WeeklyInsight {
    weekLabel: string;
    salesTrend: {
        value: number;
        changePercent: number;
        direction: 'up' | 'down' | 'stable';
    };
    marginHealth: {
        score: number; // 0-100
        avgMargin: number;
        dangerCount: number;
    };
    topPerformer: {
        name: string;
        profit: number;
    };
    aiSummary: string;
    keyInsights: { icon: string; text: string }[];
    recommendations: { action: string; priority: 'high' | 'medium' | 'low' }[];
}

// =============================================================================
// Generate Weekly Insight
// =============================================================================

export async function generateWeeklyInsight(
    storeId: string
): Promise<{ success: boolean; data?: WeeklyInsight; error?: string }> {
    try {
        const supabase = await createClient();

        // 현재 주 계산
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // 일요일 시작
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // 지난주 계산
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
        endOfLastWeek.setHours(23, 59, 59, 999);

        const weekLabel = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;

        // Safe date formatting helper
        const formatDate = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        // 1. 이번주 매출 조회
        const { data: thisWeekSales } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('store_id', storeId)
            .gte('date', formatDate(startOfWeek))
            .lte('date', formatDate(endOfWeek));

        const thisWeekTotal = thisWeekSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

        // 2. 지난주 매출 조회
        const { data: lastWeekSales } = await supabase
            .from('sales')
            .select('total_amount')
            .eq('store_id', storeId)
            .gte('date', formatDate(startOfLastWeek))
            .lte('date', formatDate(endOfLastWeek));

        const lastWeekTotal = lastWeekSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

        // 매출 트렌드 계산
        const salesChangePercent = lastWeekTotal > 0
            ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
            : 0;
        const salesDirection: 'up' | 'down' | 'stable' =
            salesChangePercent > 5 ? 'up' : salesChangePercent < -5 ? 'down' : 'stable';

        // 3. 메뉴별 마진 분석 (Live Cost Engine 데이터)
        const { data: menus } = await supabase
            .from('lc_menu_items')
            .select('name, selling_price, calculated_cost')
            .eq('store_id', storeId)
            .gt('calculated_cost', 0);

        let avgMargin = 0;
        let dangerCount = 0;
        let topMenu = { name: '', profit: 0 };

        if (menus && menus.length > 0) {
            const menuData = menus.map(m => {
                const margin = m.selling_price > 0
                    ? ((m.selling_price - (m.calculated_cost || 0)) / m.selling_price) * 100
                    : 0;
                const profit = m.selling_price - (m.calculated_cost || 0);
                return { name: m.name, margin, profit };
            });

            avgMargin = menuData.reduce((sum, m) => sum + m.margin, 0) / menuData.length;
            dangerCount = menuData.filter(m => m.margin < 30).length;

            // 가장 이익이 높은 메뉴 찾기
            const sorted = [...menuData].sort((a, b) => b.profit - a.profit);
            if (sorted.length > 0) {
                topMenu = { name: sorted[0].name, profit: sorted[0].profit };
            }
        }

        // 마진 건강도 점수 계산 (평균 마진 + 위험 메뉴 비율)
        const marginScore = Math.min(100, Math.max(0,
            (avgMargin * 2) - (dangerCount * 10)
        ));

        // 4. 최근 가격 변동 조회
        const { data: priceChanges } = await supabase
            .from('lc_ingredient_price_history')
            .select('old_price, new_price, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        const significantPriceUps = priceChanges?.filter(p =>
            p.old_price > 0 && ((p.new_price - p.old_price) / p.old_price) > 0.1
        ).length || 0;

        // 5. AI 요약 및 인사이트 생성
        const keyInsights: { icon: string; text: string }[] = [];
        const recommendations: { action: string; priority: 'high' | 'medium' | 'low' }[] = [];

        // 매출 관련 인사이트
        if (salesDirection === 'up') {
            keyInsights.push({ icon: '📈', text: `이번주 매출이 지난주 대비 ${salesChangePercent.toFixed(1)}% 상승했습니다.` });
        } else if (salesDirection === 'down') {
            keyInsights.push({ icon: '📉', text: `이번주 매출이 지난주 대비 ${Math.abs(salesChangePercent).toFixed(1)}% 하락했습니다.` });
            recommendations.push({ action: '프로모션이나 특가 메뉴를 고려해보세요.', priority: 'medium' });
        }

        // 마진 관련 인사이트
        if (dangerCount > 0) {
            keyInsights.push({ icon: '🔥', text: `${dangerCount}개 메뉴의 마진율이 30% 미만으로 위험합니다.` });
            recommendations.push({ action: `마진 위험 메뉴의 원가를 재검토하세요.`, priority: 'high' });
        }

        if (avgMargin >= 40) {
            keyInsights.push({ icon: '✨', text: `평균 마진율 ${avgMargin.toFixed(1)}%로 양호한 수준입니다.` });
        }

        // 가격 변동 인사이트
        if (significantPriceUps > 2) {
            keyInsights.push({ icon: '⚠️', text: `최근 ${significantPriceUps}개 식자재의 가격이 10% 이상 올랐습니다.` });
            recommendations.push({ action: '대체 식자재나 공급처 변경을 검토하세요.', priority: 'medium' });
        }

        // 효자 메뉴 인사이트
        if (topMenu.name) {
            keyInsights.push({ icon: '🌟', text: `${topMenu.name}이(가) 가장 높은 수익을 내고 있습니다.` });
        }

        // 기본 추천 추가
        if (recommendations.length === 0) {
            recommendations.push({ action: '현재 전략을 유지하면서 원가 변동을 모니터링하세요.', priority: 'low' });
        }

        // AI 요약 생성
        let aiSummary = '';
        if (thisWeekTotal === 0 && lastWeekTotal === 0) {
            aiSummary = '아직 이번주 매출 데이터가 없습니다. 매출을 입력하면 더 정확한 분석이 가능해요!';
        } else if (salesDirection === 'up' && marginScore >= 70) {
            aiSummary = `사장님, 이번주는 정말 좋은 한 주입니다! 매출도 상승하고 마진 건강도도 양호해요. ${topMenu.name ? `특히 ${topMenu.name}이(가) 효자 역할을 톡톡히 하고 있네요.` : ''} 현재 전략을 유지하세요!`;
        } else if (salesDirection === 'down' && dangerCount > 0) {
            aiSummary = `사장님, 이번주는 좀 어려운 한 주네요. 매출이 하락했고 ${dangerCount}개 메뉴의 마진도 위험합니다. 원가 절감과 프로모션을 함께 고려해보시는 게 좋겠어요.`;
        } else if (dangerCount > 0) {
            aiSummary = `매출은 안정적이지만 ${dangerCount}개 메뉴의 마진이 낮아요. 메뉴 전략가에서 해당 메뉴들을 확인해보세요!`;
        } else {
            aiSummary = `이번주 매장 상태는 전반적으로 안정적입니다. 평균 마진율 ${avgMargin.toFixed(1)}%를 유지하고 있어요.`;
        }

        const insight: WeeklyInsight = {
            weekLabel,
            salesTrend: {
                value: thisWeekTotal,
                changePercent: salesChangePercent,
                direction: salesDirection
            },
            marginHealth: {
                score: Math.round(marginScore),
                avgMargin: avgMargin,
                dangerCount
            },
            topPerformer: topMenu,
            aiSummary,
            keyInsights,
            recommendations
        };

        return { success: true, data: insight };

    } catch (error: any) {
        console.error('generateWeeklyInsight error:', error);
        return { success: false, error: error.message };
    }
}
