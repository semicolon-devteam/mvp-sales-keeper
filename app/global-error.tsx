'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Global Error]', error);
    }, [error]);

    return (
        <html lang="ko">
            <body style={{ backgroundColor: '#0F1218', color: 'white', fontFamily: 'Pretendard, sans-serif' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#1B2136',
                        padding: '40px',
                        borderRadius: '16px',
                        border: '1px solid #2C2E33',
                        maxWidth: '400px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>앗! 문제가 발생했어요</h1>
                        <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>
                            예기치 않은 오류가 발생했습니다.<br />
                            잠시 후 다시 시도해주세요.
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            다시 시도
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
