# 매출지킴이 (Sales Guardian)

> 자영업자의 실제 순이익을 지키는 스마트 솔루션

포스·배달앱·프랜차이즈 API와 AI OCR 기술로 매출과 지출을 자동 집계하고, 누락 없는 손익 관리를 실현합니다.

## 플랫폼 전략

> **"오늘 추정은 모바일로, 정확한 정산은 PC로"**

| 플랫폼 | 역할 | 주요 기능 |
|--------|------|----------|
| 📱 **Mobile (PWA)** | 일일 간편 입력 | 오늘 매출 숫자 입력, 영수증 OCR, 3초 브리핑 |
| 💻 **PC (Web)** | 정확한 정산 | 엑셀 드래그앤드롭, 정산서 파싱, 월말 리포트 |

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 📷 지출 인식 | 영수증 카메라 촬영 → AI OCR로 자동 분류 |
| 📁 매출 관리 | 모바일: 숫자 간편 입력 / PC: 엑셀 업로드 |
| 📊 순이익 브리핑 | 오늘 벌고 쓴 금액, 전일 대비 %, 누락 지출 경고 |
| 🧠 누락 알림 | 지출 패턴 학습 → 카카오 알림톡 발송 |
| 📋 다점포 요약 | 여러 매장 손익 집계 + 개별 매장 drill-down |
| 📎 월말 리포트 | 매출/지출/영수증 포함 PDF 자동 생성 |

## 기술 스택

| Layer | Technology |
|-------|------------|
| **Web (PWA)** | Next.js 14 + TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Node.js (Express) + FastAPI |
| **OCR Engine** | Google Vision + Naver Clova |
| **Database** | PostgreSQL (정형) + MongoDB (비정형) |
| **Auth** | JWT + Cookie (세션 영구 유지) |
| **Notification** | 카카오 알림톡 (BizMessage) |

## PWA 특징

- ✅ 홈 화면 추가 (A2HS) - 앱처럼 설치
- ✅ 오프라인 캐싱 (Service Worker)
- ✅ 세션 영구 유지 (매번 로그인 불필요)
- ✅ Safe Area 대응 (아이폰 노치/하단 바)
- ✅ 터치 최적화 (버튼 높이 44px+)

## 프로젝트 구조

```
sales-guardian/
├── apps/
│   ├── web/             # Next.js PWA (모바일+PC 통합)
│   └── backend/         # Node.js + FastAPI
├── packages/
│   └── shared/          # 공통 타입, 유틸
├── docs/                # 문서
├── package.json
└── turbo.json
```

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

## 사용자 시나리오

1. **퇴근 (Mobile PWA)**: 앱 켜서 "오늘 포스기 매출 50만 원" 입력 → "예상 이익 15만 원" 확인
2. **주말 (PC)**: 집 PC에서 배민/요기요 엑셀 다운로드 → 드래그 한 번으로 정확한 정산
3. **알림**: 카카오톡으로 "이번 주 정확한 순이익 보고서가 생성되었습니다" 수신

## 라이선스

© 2025 Semicolon. All Rights Reserved.
