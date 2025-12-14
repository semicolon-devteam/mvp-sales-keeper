'use server';

import { revalidatePath } from 'next/cache';
import { getMenuAnalysis, updateMenuCost } from './_repositories/strategy-repository';

export async function fetchStrategyData(storeId: string) {
    try {
        const data = await getMenuAnalysis(storeId);
        return { success: true, data };
    } catch (e: any) {
        console.error("Strategy Data Error Details:", JSON.stringify(e, null, 2));
        console.error("Strategy Data Error Message:", e.message);
        console.error("Strategy Data Error Hint:", e.hint);
        return { success: false, error: e.message || 'Unknown error' };
    }
}

export async function saveItemCost(storeId: string, name: string, cost: number, price: number) {
    try {
        await updateMenuCost(storeId, name, cost, price);
        revalidatePath('/strategy');
        return { success: true };
    } catch (e: any) {
        console.error("Save Cost Error:", e);
        return { success: false, error: e.message };
    }
}

// =============================================================================
// AI 원가 추정
// =============================================================================

export interface CostEstimation {
    estimatedCost: number;
    ingredients: { name: string; amount: string; estimatedPrice: number }[];
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    industryAvgMargin: number;
    recommendedPrice: number;
}

export async function estimateMenuCost(
    menuName: string,
    sellingPrice: number
): Promise<{ success: boolean; data?: CostEstimation; error?: string }> {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            // API 키 없으면 규칙 기반 추정
            return { success: true, data: generateRuleBasedEstimation(menuName, sellingPrice) };
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                system: `당신은 한국 요식업 원가 분석 전문가입니다.
메뉴 이름과 판매가격을 보고 예상 원가를 추정해주세요.

규칙:
1. 한국 식자재 시장 가격 기준 (2024년 기준)
2. 1인분 기준으로 재료와 양을 추정
3. 재료비만 계산 (인건비, 임대료 제외)
4. 보수적으로 추정 (실제보다 약간 높게)

응답 형식 (JSON만, 다른 텍스트 없이):
{
  "estimatedCost": 3500,
  "ingredients": [
    {"name": "돼지고기 목살", "amount": "200g", "estimatedPrice": 2400},
    {"name": "양배추", "amount": "100g", "estimatedPrice": 300}
  ],
  "confidence": "medium",
  "reasoning": "일반적인 냉제육 레시피 기준 추정",
  "industryAvgMargin": 35,
  "recommendedPrice": 5400
}`,
                messages: [{
                    role: 'user',
                    content: `메뉴: ${menuName}\n현재 판매가: ${sellingPrice.toLocaleString()}원\n\n이 메뉴의 예상 원가를 분석해주세요.`
                }]
            })
        });

        if (!response.ok) {
            console.error('Claude API error:', response.status);
            return { success: true, data: generateRuleBasedEstimation(menuName, sellingPrice) };
        }

        const result = await response.json();
        const content = result.content?.[0]?.text;

        if (!content) {
            return { success: true, data: generateRuleBasedEstimation(menuName, sellingPrice) };
        }

        try {
            // JSON 추출
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    data: {
                        estimatedCost: parsed.estimatedCost,
                        ingredients: parsed.ingredients || [],
                        confidence: parsed.confidence || 'medium',
                        reasoning: parsed.reasoning || 'AI 분석 기반 추정',
                        industryAvgMargin: parsed.industryAvgMargin || 35,
                        recommendedPrice: parsed.recommendedPrice || Math.round(parsed.estimatedCost / 0.65)
                    }
                };
            }
        } catch {
            // 파싱 실패 시 규칙 기반
        }

        return { success: true, data: generateRuleBasedEstimation(menuName, sellingPrice) };

    } catch (error: any) {
        console.error('estimateMenuCost error:', error);
        return { success: true, data: generateRuleBasedEstimation(menuName, sellingPrice) };
    }
}

// 규칙 기반 원가 추정 (API 없을 때 폴백)
function generateRuleBasedEstimation(menuName: string, sellingPrice: number): CostEstimation {
    // 메뉴 이름 기반 카테고리 추정
    const lowerName = menuName.toLowerCase();

    let estimatedMargin = 35; // 기본 마진율
    let ingredients: { name: string; amount: string; estimatedPrice: number }[] = [];

    // 고기류 (마진 낮음)
    if (lowerName.includes('삼겹') || lowerName.includes('목살') || lowerName.includes('갈비') || lowerName.includes('스테이크')) {
        estimatedMargin = 28;
        ingredients = [
            { name: '육류', amount: '200g', estimatedPrice: Math.round(sellingPrice * 0.45) },
            { name: '야채/반찬', amount: '1세트', estimatedPrice: Math.round(sellingPrice * 0.1) },
            { name: '소스/양념', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.05) }
        ];
    }
    // 치킨류 (마진 중간)
    else if (lowerName.includes('치킨') || lowerName.includes('닭') || lowerName.includes('후라이드') || lowerName.includes('양념')) {
        estimatedMargin = 32;
        ingredients = [
            { name: '닭고기', amount: '1마리(약 900g)', estimatedPrice: Math.round(sellingPrice * 0.35) },
            { name: '튀김가루/기름', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.1) },
            { name: '소스/무', amount: '1세트', estimatedPrice: Math.round(sellingPrice * 0.08) }
        ];
    }
    // 면류 (마진 높음)
    else if (lowerName.includes('라면') || lowerName.includes('국수') || lowerName.includes('파스타') || lowerName.includes('우동')) {
        estimatedMargin = 45;
        ingredients = [
            { name: '면', amount: '1인분', estimatedPrice: Math.round(sellingPrice * 0.15) },
            { name: '육수/소스', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.2) },
            { name: '토핑/야채', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.1) }
        ];
    }
    // 밥류 (마진 중상)
    else if (lowerName.includes('밥') || lowerName.includes('덮밥') || lowerName.includes('볶음밥') || lowerName.includes('비빔')) {
        estimatedMargin = 40;
        ingredients = [
            { name: '쌀밥', amount: '1공기', estimatedPrice: Math.round(sellingPrice * 0.08) },
            { name: '주재료', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.3) },
            { name: '반찬/소스', amount: '1세트', estimatedPrice: Math.round(sellingPrice * 0.1) }
        ];
    }
    // 찌개/탕류
    else if (lowerName.includes('찌개') || lowerName.includes('탕') || lowerName.includes('전골') || lowerName.includes('국')) {
        estimatedMargin = 42;
        ingredients = [
            { name: '주재료', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.25) },
            { name: '두부/야채', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.1) },
            { name: '양념/육수', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.08) }
        ];
    }
    // 기본값
    else {
        estimatedMargin = 35;
        ingredients = [
            { name: '주재료', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.35) },
            { name: '부재료', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.15) },
            { name: '기타', amount: '적정량', estimatedPrice: Math.round(sellingPrice * 0.05) }
        ];
    }

    const estimatedCost = Math.round(sellingPrice * (1 - estimatedMargin / 100));
    const totalIngredientCost = ingredients.reduce((sum, i) => sum + i.estimatedPrice, 0);

    // 재료비 합계와 추정 원가 맞추기
    if (totalIngredientCost !== estimatedCost && ingredients.length > 0) {
        const ratio = estimatedCost / totalIngredientCost;
        ingredients = ingredients.map(i => ({
            ...i,
            estimatedPrice: Math.round(i.estimatedPrice * ratio)
        }));
    }

    return {
        estimatedCost,
        ingredients,
        confidence: 'low',
        reasoning: `'${menuName}' 유형의 업종 평균 마진율(${estimatedMargin}%) 기준 추정입니다. 실제 원가는 다를 수 있으니 참고용으로만 사용해주세요.`,
        industryAvgMargin: estimatedMargin,
        recommendedPrice: sellingPrice
    };
}
