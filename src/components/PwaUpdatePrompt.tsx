import { useRegisterSW } from 'virtual:pwa-register/react';
import { UpdateNotice } from './UpdateNotice';

export const PwaUpdatePrompt = () => {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
  });

  return <UpdateNotice visible={needRefresh} onDismiss={() => setNeedRefresh(false)} onUpdate={() => void updateServiceWorker(true)} />;
};
