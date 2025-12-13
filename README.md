# 🦅 매출지킴이 (Sales Keeper)
> **"사장님의 든든한 AI 금융 파트너"**  
> 복잡한 숫자는 AI에게 맡기고, 사장님은 '장사'와 '손님'에만 집중하세요.

![Dashboard Preview](/public/dashboard-preview.png)

## 📖 프로젝트 소개
**매출지킴이**는 요식업 사장님들을 위한 **All-in-One 매장 관리 플랫폼**입니다.  
단순한 장부 정리를 넘어, **AI가 데이터를 분석하고 행동 전략을 제안**합니다.  
매출, 지출, 인건비, 메뉴 효율성까지 한 눈에 파악하고, **Claude AI**가 탑재된 비서와 대화하며 매장 운영의 정답을 찾아가세요.

---

## ✨ 핵심 기능 (Key Features)

### 🤖 1. AI Command Center (AI 커맨드 센터)
- **"오늘 매출 어때?"**, **"재료비가 왜 이렇게 많이 나왔어?"**라고 물어보면 AI가 답변합니다.
- 내 매장의 실제 데이터(매출, 순수익, 최근 추세)를 기반으로 **Claude AI**가 맥락 있는 조언을 제공합니다.
- 단순 챗봇이 아닌, 매장 상황을 꿰뚫고 있는 **유능한 점장님**을 고용하는 효과를 누리세요.

### 📊 2. 프리미엄 대시보드 (The Cockpit)
- **매장 건강도(Store Health)**: 매출, 리뷰, 지출 효율성을 종합하여 100점 만점의 점수로 보여줍니다.
- **수익 폭포(Profit Waterfall)**: 매출에서 재료비, 인건비가 빠져나가고 최종 순수익이 남는 과정을 직관적으로 시각화합니다.
- **주간 브리핑**: "이번 주는 지난주보다 15% 성장했습니다!" 중요한 변화를 AI가 요약해 드립니다.

### 🥩 3. 메뉴 전략가 (Profit Architect)
- **BCG 매트릭스 분석**: 내 메뉴를 **스타(효자), 캐시카우, 골칫덩이**로 자동 분류합니다.
- **가격 시뮬레이터**: "가격 500원 올리면 이익이 얼마나 변할까?" 미리 실험해보고 결정하세요.
- 원가 입력만 하면 마진율과 이익 기여도를 자동으로 계산해줍니다.

### 🧾 4. 스마트 입출금 관리
- **영수증 OCR**: 종이 영수증을 찍기만 하세요. 상호명, 금액, 날짜를 자동으로 인식해 장부에 기록합니다.
- **엑셀 대량 등록**: 배민, 쿠팡이츠, 요기요 엑셀 파일을 그대로 업로드하면 플랫폼별 수수료까지 계산해 정리해줍니다.
- **자금 흐름 캘린더**: 월세, 급여일, 정산 예정일을 달력에서 한눈에 확인하고 미리 대비하세요.

### 👥 5. 인텔리전스 스태프 관리
- 복잡한 아르바이트 스케줄링부터 급여 예상액 계산까지 자동으로 처리합니다.
- 인건비율(RPH)을 분석하여 최적의 인력 배치를 돕습니다.

---

## 🛠 기술 스택 (Tech Stack)
- **Core**: Next.js 15 (App Router), TypeScript
- **Design System**: Mantine UI, Tailwind CSS, Recharts (Data Viz)
- **Backend & DB**: Supabase (PostgreSQL, Auth, Storage)
- **AI & Logic**: Anthropic Claude API, Tesseract.js (Client-side OCR)

## 🚀 시작하기 (Getting Started)
1. **Repository Clone**
   ```bash
   git clone https://github.com/semicolon-devteam/mvp-sales-keeper.git
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Environment Setup** (`.env.local`)
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ANTHROPIC_API_KEY=...
   ```
4. **Run Server**
   ```bash
   npm run dev
   ```

---

## 💎 Design Philosophy
> **"압도적인 가독성과 프로페셔널한 미학"**
*   **Emerald & Glass**: 신뢰감을 주는 딥 그린과 현대적인 글래스모피즘 디자인.
*   **Information Density**: 필요한 정보는 확실하게, 불필요한 장식은 과감하게 제거.
*   **Dynamic Interaction**: 살아있는 듯한 반응형 차트와 부드러운 애니메이션.

---
**Sales Keeper Team** | 2025 Semicolon MVP Project
