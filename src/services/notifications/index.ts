import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
interface AppointmentNotificationData {
  serviceName: string;
  clientName?: string;
  date?: string;
  time?: string;
  [key: string]: unknown;
}


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
            icon: payload.icon || '/brand/icons/icon-192.png'
          },
          data: {
            url: payload.url || '/dashboard',
            tag: payload.tag || 'default'
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Notificar admin sobre novo agendamento
  async notifyNewAppointment(appointmentData: AppointmentNotificationData) {
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
  async notifyAppointmentConfirmed(clientId: string, appointmentData: AppointmentNotificationData) {
    await this.sendToUser(clientId, {
      title: '✅ Agendamento Confirmado',
      body: `Seu agendamento para ${appointmentData.serviceName} foi confirmado!`,
      url: '/cliente/agendamentos',
      tag: 'appointment-confirmed'
    });
  },

  // Lembrete de agendamento (1 hora antes)
  async sendAppointmentReminder(clientId: string, appointmentData: AppointmentNotificationData) {
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
