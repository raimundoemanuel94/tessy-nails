// Script para configurar o banco de dados Firebase
// Execute: node scripts/setup-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuração Firebase (substitua com suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForTesting",
  authDomain: "tessy-nails.firebaseapp.com",
  projectId: "tessy-nails",
  storageBucket: "tessy-nails.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados iniciais para as coleções
const initialData = {
  users: [
    {
      uid: "admin-demo",
      name: "Administrador Tessy Nails",
      email: "admin@tessynails.com",
      role: "admin",
      photoURL: null,
      createdAt: new Date(),
      isActive: true
    },
    {
      uid: "professional-demo", 
      name: "Tessy",
      email: "tessy@tessynails.com",
      role: "professional",
      photoURL: null,
      createdAt: new Date(),
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
      createdAt: new Date()
    },
    {
      id: "pedicure-tradicional",
      name: "Pedicure Tradicional", 
      description: "Pedicure completa com esmaltação",
      price: 45.00,
      duration: 90,
      category: "pedicure",
      active: true,
      createdAt: new Date()
    },
    {
      id: "alongamento-fibra",
      name: "Alongamento em Fibra",
      description: "Alongamento de unhas em fibra de vidro",
      price: 80.00,
      duration: 120,
      category: "alongamento",
      active: true,
      createdAt: new Date()
    },
    {
      id: "manicure-francesa",
      name: "Manicure Francesa",
      description: "Manicure com esmaltação francesa",
      price: 40.00,
      duration: 70,
      category: "manicure",
      active: true,
      createdAt: new Date()
    }
  ],
  
  clients: [
    {
      id: "client-demo-1",
      name: "Maria Silva",
      email: "maria.silva@email.com",
      phone: "(11) 98765-4321",
      lastVisit: new Date(),
      totalVisits: 5,
      notes: "Cliente preferencial, gosta de cores claras",
      createdAt: new Date()
    },
    {
      id: "client-demo-2",
      name: "Joana Santos",
      email: "joana.santos@email.com", 
      phone: "(11) 91234-5678",
      lastVisit: new Date(),
      totalVisits: 3,
      notes: "Alérgica a certos esmaltes",
      createdAt: new Date()
    }
  ],
  
  appointments: [
    {
      id: "appointment-demo-1",
      clientId: "client-demo-1",
      serviceId: "manicure-tradicional",
      specialistId: "professional-demo",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      status: "confirmed",
      paymentStatus: "unpaid",
      notes: "Cliente pediu cor rosa claro",
      createdAt: new Date()
    },
    {
      id: "appointment-demo-2", 
      clientId: "client-demo-2",
      serviceId: "pedicure-tradicional",
      specialistId: "professional-demo",
      appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // Depois de amanhã
      status: "pending",
      paymentStatus: "unpaid", 
      notes: "Confirmar no dia",
      createdAt: new Date()
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
      minCancelNotice: 24
    },
    createdAt: new Date()
  }
};

async function setupFirestore() {
  console.log('🔥 Iniciando configuração do Firestore...\n');
  
  try {
    // Criar coleções e documentos
    for (const [collectionName, documents] of Object.entries(initialData)) {
      console.log(`📁 Criando coleção: ${collectionName}`);
      
      if (Array.isArray(documents)) {
        // Para arrays de documentos
        for (const docData of documents) {
          const docRef = doc(db, collectionName, docData.id);
          await setDoc(docRef, docData);
          console.log(`  ✅ Documento criado: ${docData.id}`);
        }
      } else {
        // Para documento único (salon)
        const docRef = doc(db, collectionName, documents.id);
        await setDoc(docRef, documents);
        console.log(`  ✅ Documento criado: ${documents.id}`);
      }
    }
    
    console.log('\n🎉 Banco de dados configurado com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('  - Usuários: 2 (admin + professional)');
    console.log('  - Serviços: 4');
    console.log('  - Clientes: 2');
    console.log('  - Agendamentos: 2');
    console.log('  - Configurações do Salão: 1');
    
  } catch (error) {
    console.error('❌ Erro ao configurar Firestore:', error);
  }
}

// Função para criar usuário no Firebase Auth (requer SDK admin)
async function createAuthUsers() {
  console.log('\n🔐 Para criar usuários no Authentication, acesse:');
  console.log('1. Firebase Console > Authentication > Users');
  console.log('2. Adicione manualmente os usuários:');
  console.log('   - Email: admin@tessynails.com | Senha: admin123');
  console.log('   - Email: tessy@tessynails.com | Senha: tessy123');
}

async function main() {
  console.log('🚀 Setup do Firebase para Tessy Nails\n');
  
  console.log('⚠️  IMPORTANTE: Antes de executar, atualize as credenciais Firebase neste script!');
  console.log('📝 Edite o arquivo e substitua as credenciais de exemplo.\n');
  
  const answer = await new Promise(resolve => {
    rl.question('Deseja continuar com as credenciais de teste? (s/n): ', resolve);
  });
  
  if (answer.toLowerCase() === 's') {
    await setupFirestore();
    await createAuthUsers();
  } else {
    console.log('❌ Operação cancelada. Atualize as credenciais Firebase primeiro.');
  }
  
  rl.close();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupFirestore, initialData };
