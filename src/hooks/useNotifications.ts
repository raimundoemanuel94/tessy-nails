import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    () => typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const messaging = getMessaging();
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE'
        });

        if (currentToken && user) {
          setToken(currentToken);
          
          // Salvar token no Firestore
          await setDoc(doc(db, 'fcmTokens', user.uid), {
            token: currentToken,
            userId: user.uid,
            createdAt: new Date(),
            platform: 'web'
          });

          console.log('FCM Token saved:', currentToken);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    if (permission === 'granted' && typeof window !== 'undefined') {
      try {
        const messaging = getMessaging();
        
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message:', payload);
          
          // Mostrar notificação customizada quando app está aberto
          if (payload.notification) {
            new Notification(payload.notification.title || 'Nova notificação', {
              body: payload.notification.body,
              icon: '/brand/icons/icon-192.png',
              tag: payload.data?.tag || 'default'
            });
          }
        });

        return () => unsubscribe();
      } catch(e) {
        console.error("Firebase Messaging Error: ", e);
      }
    }
  }, [permission]);

  return {
    permission,
    token,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  };
}
