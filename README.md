# 매출지킴이 (Sales Guardian)

> 자영업자의 실제 순이익을 지키는 스마트 솔루션

포스·배달앱·프랜차이즈 API와 AI OCR 기술로 매출과 지출을 자동 집계하고, 누락 없는 손익 관리를 실현합니다.

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 📷 지출 인식 | 영수증 카메라 촬영 → AI OCR로 자동 분류 |
| 📁 매출 업로드 | 배민·요기요 정산서 엑셀 업로드 → 자동 파싱 |
| 📊 순이익 브리핑 | 오늘 벌고 쓴 금액, 전일 대비 %, 누락 지출 경고 |
| 🧠 누락 알림 | 지출 패턴 학습 → 미등록 감지 시 알림 발송 |
| 📋 다점포 요약 | 여러 매장 손익 집계 + 개별 매장 drill-down |
| 📎 월말 리포트 | 매출/지출/영수증 포함 PDF 자동 생성 |

## 기술 스택

| Layer | Technology |
|-------|------------|
| **Mobile App** | React Native |
| **Web Admin** | React.js |
| **Backend** | Node.js (Express) + FastAPI |
| **OCR Engine** | Google Vision + Naver Clova |
| **Database** | PostgreSQL (정형) + MongoDB (비정형) |
| **Auth** | JWT |

## 프로젝트 구조

```
sales-guardian/
├── apps/
│   ├── mobile/          # React Native 앱
│   ├── web-admin/       # React.js 관리자
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

## 라이선스

© 2025 Semicolon. All Rights Reserved.
