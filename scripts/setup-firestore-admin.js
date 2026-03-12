// Script para configurar o Firebase com Admin SDK
// Requer serviceAccountKey.json do Firebase

const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

// Verificar se o arquivo de credenciais existe
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ Arquivo serviceAccountKey.json não encontrado!');
  console.log('\n📋 Como obter o arquivo:');
  console.log('1. Vá ao Firebase Console > Configurações do Projeto > Contas de serviço');
  console.log('2. Clique em "Gerar nova chave privada"');
  console.log('3. Baixe o arquivo JSON');
  console.log('4. Renomeie para serviceAccountKey.json');
  console.log('5. Coloque na pasta scripts/');
  console.log('\n⚠️  Mantenha este arquivo seguro e nunca envie para o Git!');
  process.exit(1);
}

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Dados iniciais para as coleções
const initialData = {
  users: [
    {
      uid: "admin-demo",
      name: "Administrador Tessy Nails",
      email: "admin@tessynails.com",
      role: "admin",
      photoURL: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    },
    {
      uid: "professional-demo", 
      name: "Tessy",
      email: "tessy@tessynails.com",
      role: "professional",
      photoURL: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    }
  ],
  
  services: [
    {
      id: "manicure-tradicional",
      name: "Manicure Tradicional",
      description: "Manicure completa com esmaltação",
      price: 35.00,
      duration: 60,
      category: "manicure",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "pedicure-tradicional",
      name: "Pedicure Tradicional", 
      description: "Pedicure completa com esmaltação",
      price: 45.00,
      duration: 90,
      category: "pedicure",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "alongamento-fibra",
      name: "Alongamento em Fibra",
      description: "Alongamento de unhas em fibra de vidro",
      price: 80.00,
      duration: 120,
      category: "alongamento",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "manicure-francesa",
      name: "Manicure Francesa",
      description: "Manicure com esmaltação francesa",
      price: 40.00,
      duration: 70,
      category: "manicure",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "unhas-em-gel",
      name: "Unhas em Gel",
      description: "Aplicação de gel nas unhas",
      price: 60.00,
      duration: 100,
      category: "alongamento",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "spas",
      name: "Spa dos Pés",
      description: "Tratamento completo para os pés",
      price: 50.00,
      duration: 60,
      category: "pedicure",
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  
  clients: [
    {
      id: "client-demo-1",
      name: "Maria Silva",
      email: "maria.silva@email.com",
      phone: "(11) 98765-4321",
      lastVisit: admin.firestore.FieldValue.serverTimestamp(),
      totalVisits: 5,
      notes: "Cliente preferencial, gosta de cores claras",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "client-demo-2",
      name: "Joana Santos",
      email: "joana.santos@email.com", 
      phone: "(11) 91234-5678",
      lastVisit: admin.firestore.FieldValue.serverTimestamp(),
      totalVisits: 3,
      notes: "Alérgica a certos esmaltes",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "client-demo-3",
      name: "Ana Oliveira",
      email: "ana.oliveira@email.com",
      phone: "(11) 94567-8910",
      lastVisit: admin.firestore.FieldValue.serverTimestamp(),
      totalVisits: 8,
      notes: "Faz alongamento há 6 meses",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  
  appointments: [
    {
      id: "appointment-demo-1",
      clientId: "client-demo-1",
      serviceId: "manicure-tradicional",
      specialistId: "professional-demo",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "confirmed",
      paymentStatus: "unpaid",
      notes: "Cliente pediu cor rosa claro",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "appointment-demo-2", 
      clientId: "client-demo-2",
      serviceId: "pedicure-tradicional",
      specialistId: "professional-demo",
      appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pending",
      paymentStatus: "unpaid", 
      notes: "Confirmar no dia",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      id: "appointment-demo-3",
      clientId: "client-demo-3",
      serviceId: "alongamento-fibra",
      specialistId: "professional-demo",
      appointmentDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      status: "confirmed",
      paymentStatus: "deposit_paid",
      notes: "Cliente já pagou sinal",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ],
  
  salon: {
    id: "config-salon",
    name: "Tessy Nails",
    phone: "(11) 99999-8888",
    email: "contato@tessynails.com",
    address: {
      street: "Rua das Flores, 123",
      neighborhood: "Jardim Primavera",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567"
    },
    workingHours: {
      monday: { open: "09:00", close: "19:00", enabled: true },
      tuesday: { open: "09:00", close: "19:00", enabled: true },
      wednesday: { open: "09:00", close: "19:00", enabled: true },
      thursday: { open: "09:00", close: "19:00", enabled: true },
      friday: { open: "09:00", close: "19:00", enabled: true },
      saturday: { open: "08:00", close: "18:00", enabled: true },
      sunday: { open: "00:00", close: "00:00", enabled: false }
    },
    settings: {
      appointmentInterval: 30,
      cleaningTime: 15,
      maxAdvanceBooking: 90,
      minCancelNotice: 24,
      currency: "BRL",
      timezone: "America/Sao_Paulo"
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
};

async function setupFirestore() {
  console.log('🔥 Iniciando configuração do Firestore com Admin SDK...\n');
  
  try {
    // Criar coleções e documentos
    for (const [collectionName, documents] of Object.entries(initialData)) {
      console.log(`📁 Criando coleção: ${collectionName}`);
      
      if (Array.isArray(documents)) {
        // Para arrays de documentos
        for (const docData of documents) {
          await db.collection(collectionName).doc(docData.id).set(docData);
          console.log(`  ✅ Documento criado: ${docData.id}`);
        }
      } else {
        // Para documento único (salon)
        await db.collection(collectionName).doc(documents.id).set(documents);
        console.log(`  ✅ Documento criado: ${documents.id}`);
      }
    }
    
    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('  - Usuários: 2 (admin + professional)');
    console.log('  - Serviços: 6');
    console.log('  - Clientes: 3');
    console.log('  - Agendamentos: 3');
    console.log('  - Configurações do Salão: 1');
    
    // Criar usuários no Authentication (requer Auth Emulator ou Admin SDK)
    console.log('\n🔐 Criando usuários no Authentication...');
    
    try {
      await admin.auth().createUser({
        uid: "admin-demo",
        email: "admin@tessynails.com",
        password: "admin123",
        displayName: "Administrador Tessy Nails"
      });
      console.log('  ✅ Usuário admin criado');
    } catch (error) {
      console.log('  ⚠️  Usuário admin já existe ou erro:', error.message);
    }
    
    try {
      await admin.auth().createUser({
        uid: "professional-demo",
        email: "tessy@tessynails.com",
        password: "tessy123",
        displayName: "Tessy"
      });
      console.log('  ✅ Usuário professional criado');
    } catch (error) {
      console.log('  ⚠️  Usuário professional já existe ou erro:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao configurar Firestore:', error);
  }
}

// Função para verificar configuração
async function checkSetup() {
  console.log('\n🔍 Verificando configuração...');
  
  try {
    const collections = ['users', 'services', 'clients', 'appointments', 'salon'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      console.log(`📊 ${collectionName}: ${snapshot.size} documentos`);
    }
    
    const users = await admin.auth().listUsers();
    console.log(`👥 Usuários no Auth: ${users.users.length}`);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function main() {
  console.log('🚀 Setup do Firebase Admin SDK para Tessy Nails\n');
  
  try {
    await setupFirestore();
    await checkSetup();
    
    console.log('\n✅ Configuração concluída!');
    console.log('\n🔑 Credenciais para teste:');
    console.log('  Admin: admin@tessynails.com / admin123');
    console.log('  Profissional: tessy@tessynails.com / tessy123');
    console.log('\n⚠️  NÃO use essas senhas em produção!');
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupFirestore, checkSetup, db, admin };
