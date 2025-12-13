'use server';

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function askAiAssistant(message: string, contextData: any) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            text: "죄송합니다. AI 서비스 키가 설정되지 않았습니다. 관리자에게 문의해주세요. 😓",
            role: 'ai'
        };
    }

    try {
        const systemPrompt = `
You are 'Sales Keeper', a smart and friendly restaurant financial manager AI.
Your goal is to help the store owner (User) understand their financial data and make better decisions.

**Context Data (Current Store Status):**
${JSON.stringify(contextData, null, 2)}

**Rules:**
1. **Language**: Always speak in Korean (Polite, friendly tone like "사장님, ~입니다").
2. **Data-Driven**: Use the provided context data to back up your answers. If data is missing, say so politely.
3. **Consistency**: You are an expert. Don't be vague. Give specific numbers if available.
4. **Length**: Keep answers concise (max 3-4 sentences) unless asked for a detailed report.
5. **Role**: Encouraging but realistic. Celebrate high sales, warn about high costs.

**User Query**:
${message}
`;

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Fast & Good enough for this. Use Sonnet/Opus if requested.
            max_tokens: 300,
            messages: [
                { role: "user", content: message } // System prompt is better set as 'system' param if supported, but Haiku supports system param.
            ],
            system: systemPrompt // Correct way to pass system prompt in new SDK
        });

        // Safe extraction of text content
        const contentBlock = response.content[0];
        const replyText = contentBlock.type === 'text' ? contentBlock.text : "죄송합니다. 답변을 생성하지 못했습니다.";

        return { text: replyText, role: 'ai' };

    } catch (error: any) {
        console.error("Claude API Error:", error);
        return {
            text: `AI 연결 중 오류가 발생했습니다. (${error.message})`,
            role: 'ai'
        };
    }
}
