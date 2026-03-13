const admin = require('firebase-admin');
const serviceAccount = require('./tessy-nails-firebase-adminsdk-fbsvc-8ebe8667af.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'tessy-nails'
});

const db = admin.firestore();

// Teste de criação de agendamento
async function testAppointmentCreation() {
  console.log('🧪 Testando criação de agendamento...');
  
  try {
    // Dados de teste
    const testAppointment = {
      clientId: 'test-user-id',
      serviceId: 'manicure-simples',
      specialistId: 'test-specialist-id',
      appointmentDate: new Date(),
      status: 'pending',
      paymentStatus: 'unpaid',
      notes: 'Agendamento de teste',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Criar agendamento
    const docRef = await db.collection('appointments').add(testAppointment);
    console.log(`✅ Agendamento de teste criado com ID: ${docRef.id}`);

    // Verificar se foi salvo
    const savedDoc = await docRef.get();
    if (savedDoc.exists) {
      console.log('✅ Agendamento verificado no Firestore');
      console.log('📋 Dados salvos:', savedDoc.data());
    } else {
      console.log('❌ Agendamento não encontrado após criação');
    }

    // Limpar teste
    await docRef.delete();
    console.log('🧹 Agendamento de teste removido');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Verificar coleção atual
async function checkAppointmentsCollection() {
  console.log('\n🔍 Verificando coleção appointments...');
  
  try {
    const snapshot = await db.collection('appointments').get();
    console.log(`📋 Total de agendamentos na coleção: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      console.log('📄 Agendamentos encontrados:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}`);
        console.log(`    Cliente: ${data.clientId}`);
        console.log(`    Serviço: ${data.serviceId}`);
        console.log(`    Data: ${data.appointmentDate?.toDate?.() || data.appointmentDate}`);
        console.log(`    Status: ${data.status}`);
      });
    } else {
      console.log('📭 Nenhum agendamento encontrado na coleção');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar coleção:', error);
  }
}

// Executar testes
async function main() {
  await checkAppointmentsCollection();
  await testAppointmentCreation();
  await checkAppointmentsCollection();
  
  console.log('\n🏁 Testes concluídos!');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
