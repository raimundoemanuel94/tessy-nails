# 🔔 Firebase Cloud Messaging (FCM) - Guia de Implementação

## 📋 Visão Geral

Este guia explica como implementar notificações push usando Firebase Cloud Messaging (FCM) no sistema Tessy Nails.

## 🎯 Funcionalidades Planejadas

### Notificações para Admin
- ✅ **Novo Agendamento**: Quando um cliente faz um agendamento
- ✅ **Cancelamento**: Quando um agendamento é cancelado
- ✅ **Pagamento Recebido**: Confirmação de pagamentos
- ✅ **Lembrete**: 1 hora antes do atendimento

### Notificações para Cliente
- ✅ **Confirmação de Agendamento**: Após criar agendamento
- ✅ **Lembrete**: 1 hora antes do horário marcado
- ✅ **Status Atualizado**: Mudanças no status do agendamento
- ✅ **Promoções**: Ofertas especiais (opcional)

## 🔧 Configuração Inicial

### 1. Habilitar Firebase Cloud Messaging

No Firebase Console:
1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto **tessy-nails-b7c9d**
3. Vá em **Build** → **Cloud Messaging**
4. Clique em **Get Started** se ainda não estiver habilitado

### 2. Gerar Chave de Servidor (Server Key)

1. No Firebase Console, vá em **Project Settings** (⚙️)
2. Aba **Cloud Messaging**
3. Copie a **Server Key** (será usada no backend)
4. Copie o **Sender ID** (será usado no frontend)

### 3. Gerar Certificado Web Push

1. Ainda em **Cloud Messaging**
2. Seção **Web Push certificates**
3. Clique em **Generate key pair**
4. Copie o **Key pair** (VAPID key)

## 📦 Instalação de Dependências

```bash
npm install firebase-admin
```

## 🔨 Implementação

### 1. Criar Service Worker para PWA

Crie o arquivo `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDkBl3_Xp0Jk0Jk0Jk0Jk0Jk0Jk0Jk0Jk0",
  authDomain: "tessy-nails-b7c9d.firebaseapp.com",
  projectId: "tessy-nails-b7c9d",
  storageBucket: "tessy-nails-b7c9d.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "1:123456789:web:abcdef123456"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

### 2. Criar Hook para Gerenciar Notificações

Crie `src/hooks/useNotifications.ts`:

```typescript
import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const messaging = getMessaging();
        const currentToken = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_HERE'
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
      const messaging = getMessaging();
      
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message:', payload);
        
        // Mostrar notificação customizada quando app está aberto
        if (payload.notification) {
          new Notification(payload.notification.title || 'Nova notificação', {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            tag: payload.data?.tag || 'default'
          });
        }
      });

      return () => unsubscribe();
    }
  }, [permission]);

  return {
    permission,
    token,
    requestPermission,
    isSupported: typeof window !== 'undefined' && 'Notification' in window
  };
}
```

### 3. Criar Serviço de Notificações no Backend

Crie `src/services/notifications/index.ts`:

```typescript
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export const notificationService = {
  // Enviar notificação para um usuário específico
  async sendToUser(userId: string, payload: NotificationPayload) {
    try {
      // Buscar token FCM do usuário
      const tokensRef = collection(db, 'fcmTokens');
      const q = query(tokensRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('No FCM token found for user:', userId);
        return;
      }

      const tokens = snapshot.docs.map(doc => doc.data().token);

      // Enviar para Cloud Function ou API endpoint
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon-192x192.png'
          },
          data: {
            url: payload.url || '/dashboard',
            tag: payload.tag || 'default'
          }
        })
      });

      return response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Notificar admin sobre novo agendamento
  async notifyNewAppointment(appointmentData: any) {
    // Buscar todos os admins
    const admins = await this.getAdminUsers();
    
    for (const admin of admins) {
      await this.sendToUser(admin.uid, {
        title: '📅 Novo Agendamento',
        body: `${appointmentData.clientName} agendou ${appointmentData.serviceName}`,
        url: '/agendamentos',
        tag: 'new-appointment'
      });
    }
  },

  // Notificar cliente sobre confirmação
  async notifyAppointmentConfirmed(clientId: string, appointmentData: any) {
    await this.sendToUser(clientId, {
      title: '✅ Agendamento Confirmado',
      body: `Seu agendamento para ${appointmentData.serviceName} foi confirmado!`,
      url: '/cliente/agendamentos',
      tag: 'appointment-confirmed'
    });
  },

  // Lembrete de agendamento (1 hora antes)
  async sendAppointmentReminder(clientId: string, appointmentData: any) {
    await this.sendToUser(clientId, {
      title: '⏰ Lembrete de Agendamento',
      body: `Seu atendimento de ${appointmentData.serviceName} é em 1 hora!`,
      url: '/cliente/agendamentos',
      tag: 'appointment-reminder'
    });
  },

  // Helper: Buscar usuários admin
  async getAdminUsers() {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }
};
```

### 4. Criar API Route para Enviar Notificações

Crie `src/app/api/notifications/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializar Firebase Admin (se ainda não estiver)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export async function POST(request: NextRequest) {
  try {
    const { tokens, notification, data } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'No tokens provided' },
        { status: 400 }
      );
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png'
      },
      data: data || {},
      tokens: tokens
    };

    const response = await admin.messaging().sendMulticast(message);

    console.log('Notifications sent:', response.successCount);
    console.log('Failures:', response.failureCount);

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 5. Integrar no Componente de Configurações

Adicione ao `src/app/configuracoes/page.tsx`:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

export default function ConfiguracoesPage() {
  const { permission, requestPermission, isSupported } = useNotifications();
  
  // ... resto do código
  
  // Na aba de Notificações, adicione:
  {isSupported && permission === 'default' && (
    <Button onClick={requestPermission} className="w-full">
      Ativar Notificações Push
    </Button>
  )}
  
  {permission === 'granted' && (
    <Badge variant="success">Notificações Ativadas ✓</Badge>
  )}
}
```

## 🚀 Uso Prático

### Exemplo: Notificar ao Criar Agendamento

No `src/app/agenda/page.tsx` ou onde criar agendamentos:

```typescript
import { notificationService } from '@/services/notifications';

const handleCreateAppointment = async (data: any) => {
  try {
    // Criar agendamento
    const appointment = await appointmentService.create(data);
    
    // Notificar admin
    await notificationService.notifyNewAppointment({
      clientName: data.clientName,
      serviceName: data.serviceName
    });
    
    // Notificar cliente
    await notificationService.notifyAppointmentConfirmed(
      data.clientId,
      { serviceName: data.serviceName }
    );
    
    toast.success('Agendamento criado e notificações enviadas!');
  } catch (error) {
    console.error(error);
  }
};
```

## 📝 Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=tessy-nails-b7c9d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tessy-nails-b7c9d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# FCM
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

## 🎨 Melhorias Futuras

- [ ] **Agendamento de Notificações**: Usar Firebase Cloud Functions para lembretes automáticos
- [ ] **Notificações por Email**: Integrar com SendGrid ou similar
- [ ] **SMS**: Integrar com Twilio para SMS
- [ ] **Histórico de Notificações**: Salvar no Firestore para consulta
- [ ] **Preferências Granulares**: Permitir usuário escolher tipos específicos
- [ ] **Rich Notifications**: Adicionar imagens, ações (Confirmar/Cancelar)

## 📚 Recursos

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Status**: ✅ Configurações preparadas | 🔄 Implementação pendente
**Última atualização**: 16 de março de 2026
