import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Carregar chave do serviço
const serviceAccount = JSON.parse(readFileSync('./tessy-nails-firebase-adminsdk-fbsvc-8ebe8667af.json', 'utf8'));

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tessy-nails'
});

const db = admin.firestore();

async function debugServices() {
  console.log('🔍 DEBUG: Verificando serviços no Firestore...');  
  try {
    // Verificar coleção services
    const servicesSnapshot = await db.collection('services').get();
    console.log(`📋 Total de serviços encontrados: ${servicesSnapshot.size}`);
    
    if (servicesSnapshot.size > 0) {
      servicesSnapshot.forEach(doc => {
        const service = doc.data();
        console.log(`✅ Serviço: ${doc.id} - ${service.name} (R$ ${service.price})`);
      });
    } else {
      console.log('❌ NENHUM serviço encontrado na coleção services');
    }

    // Verificar coleção appointments
    const appointmentsSnapshot = await db.collection('appointments').get();
    console.log(`📋 Total de agendamentos encontrados: ${appointmentsSnapshot.size}`);
    
    if (appointmentsSnapshot.size > 0) {
      for (const doc of appointmentsSnapshot.docs) {
        const apt = doc.data();
        console.log(`✅ Agendamento: ${doc.id} - serviceId: ${apt.serviceId} - status: ${apt.status}`);
        
        // Verificar se o serviceId existe
        const serviceDoc = await db.collection('services').doc(apt.serviceId).get();
        if (serviceDoc.exists) {
          const service = serviceDoc.data();
          console.log(`✅ Serviço encontrado: ${service.name}`);
        } else {
          console.log(`❌ Serviço NÃO encontrado: ${apt.serviceId}`);
        }
      }
    } else {
      console.log('❌ NENHUM agendamento encontrado na coleção appointments');
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  }
  
  process.exit(0);
}

debugServices();
