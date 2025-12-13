// 로컬 푸시 알림 유틸리티 (MVP 버전)

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export async function checkNotificationPermission(): Promise<NotificationPermissionStatus> {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
    if (!('Notification' in window)) {
        return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
}

export interface LocalNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    onClick?: () => void;
}

export function showLocalNotification(options: LocalNotificationOptions): Notification | null {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.warn('Notification not available or permission denied');
        return null;
    }

    const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
    });

    if (options.onClick) {
        notification.onclick = () => {
            window.focus();
            options.onClick?.();
            notification.close();
        };
    }

    return notification;
}

// 매출 입력 리마인더 알림
export function scheduleDailyReminder() {
    // 로컬 스토리지에서 설정 확인
    const settings = localStorage.getItem('notification_settings');
    if (!settings) return;

    const { enabled, reminderTime } = JSON.parse(settings);
    if (!enabled || !reminderTime) return;

    // 다음 알림 시간 계산
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    // 이미 지난 시간이면 내일로 설정
    if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const delay = nextReminder.getTime() - now.getTime();

    // setTimeout 설정 (브라우저가 열려있을 때만 동작)
    setTimeout(() => {
        showLocalNotification({
            title: '매출 입력 알림',
            body: '오늘 매출을 입력할 시간입니다!',
            tag: 'daily-reminder',
            onClick: () => {
                window.location.href = '/sales';
            }
        });
        // 다음 날 알림 재설정
        scheduleDailyReminder();
    }, delay);
}

// 정산일 알림
export function checkSettlementReminder() {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const settlements: string[] = [];

    // 배민: 목요일(4)
    if (dayOfWeek === 4) settlements.push('배달의민족');
    // 요기요: 화요일(2)
    if (dayOfWeek === 2) settlements.push('요기요');
    // 쿠팡: 평일
    if (dayOfWeek >= 1 && dayOfWeek <= 5) settlements.push('쿠팡이츠');

    if (settlements.length > 0) {
        const settings = localStorage.getItem('notification_settings');
        if (settings) {
            const { settlementAlert } = JSON.parse(settings);
            if (settlementAlert) {
                showLocalNotification({
                    title: '오늘 정산일입니다!',
                    body: `${settlements.join(', ')} 정산이 예정되어 있습니다.`,
                    tag: 'settlement-reminder',
                    onClick: () => {
                        window.location.href = '/calendar';
                    }
                });
            }
        }
    }
}
