import { Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconShare } from '@tabler/icons-react'; // Assuming tabler icons are available or I need to install/use text

export default function PCShareButton() {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/pc-auth` : '';

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '매출 지킴이 PC 버전',
                    text: 'PC에서 엑셀을 업로드하려면 아래 링크로 접속하세요.',
                    url: shareUrl,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('PC 접속 링크가 복사되었습니다!');
            }).catch(() => {
                alert('링크 복사에 실패했습니다.');
            });
        }
    };

    return (
        <Button variant="light" onClick={handleShare} leftSection={<IconShare size={16} />}>
            PC 링크 공유
        </Button>
    );
}
