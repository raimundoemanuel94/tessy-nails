// Script para popular dados iniciais no Firestore
// Execute: node scripts/seed-firestore.js

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require("firebase/firestore");

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg",
  authDomain: "tessy-nails.firebaseapp.com",
  projectId: "tessy-nails",
  storageBucket: "tessy-nails.firebasestorage.app",
  messagingSenderId: "229831786550",
  appId: "1:229831786550:web:187fea7504f60afc90d897",
  measurementId: "G-8HVWP6L1F7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dados iniciais
const seedData = {
  users: [
    {
      uid: "admin-tessy",
      name: "Administrador Tessy Nails",
      email: "admin@tessynails.com",
      role: "admin",
      photoURL: null,
      createdAt: serverTimestamp(),
      isActive: true
    },
    {
      uid: "professional-tessy", 
      name: "Tessy",
      email: "tessy@tessynails.com",
      role: "professional",
      photoURL: null,
      createdAt: serverTimestamp(),
      isActive: true
    }
  ],
  
  services: [
    {
      id: "manicure-tradicional",
      name: "Manicure Tradicional",
      description: "Manicure completa com esmaltação",
      durationMinutes: 60,
      price: 35.00,
      category: "manicure",
      active: true,
      createdAt: serverTimestamp()
    },
    {
      id: "pedicure-tradicional",
      name: "Pedicure Tradicional", 
      description: "Pedicure completa com esmaltação",
      durationMinutes: 90,
      price: 45.00,
      category: "pedicure",
      active: true,
      createdAt: serverTimestamp()
    }
  ],
  
  clients: [
    {
      id: "client-maria",
      name: "Maria Silva",
      email: "maria.silva@email.com",
      phone: "(11) 98765-4321",
      notes: "Cliente preferencial, gosta de cores claras",
      totalAppointments: 5,
      lastVisit: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    {
      id: "client-joana",
      name: "Joana Santos",
      email: "joana.santos@email.com", 
      phone: "(11) 91234-5678",
      notes: "Alérgica a certos esmaltes",
      totalAppointments: 3,
      lastVisit: serverTimestamp(),
      createdAt: serverTimestamp()
    }
  ],
  
  appointments: [
    {
      id: "appointment-demo-1",
      clientId: "client-maria",
      serviceId: "manicure-tradicional",
      specialistId: "professional-tessy",
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "confirmed",
      paymentStatus: "unpaid",
      notes: "Cliente pediu cor rosa claro",
      createdAt: serverTimestamp()
    },
    {
      id: "appointment-demo-2", 
      clientId: "client-joana",
      serviceId: "pedicure-tradicional",
      specialistId: "professional-tessy",
      appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: "pending",
      paymentStatus: "unpaid", 
      notes: "Confirmar no dia",
      createdAt: serverTimestamp()
    }
  ]
};

async function seedFirestore() {
  console.log('🌱 Iniciando seed do Firestore...\n');
  
  try {
    // Criar coleções e documentos
    for (const [collectionName, documents] of Object.entries(seedData)) {
      console.log(`📁 Populando coleção: ${collectionName}`);
      
      if (Array.isArray(documents)) {
        // Para arrays de documentos
        for (const docData of documents) {
          const docRef = doc(db, collectionName, docData.id);
          await setDoc(docRef, docData);
          console.log(`  ✅ Documento criado: ${docData.id}`);
        }
      } else {
        // Para documento único
        const docRef = doc(db, collectionName, documents.id);
        await setDoc(docRef, documents);
        console.log(`  ✅ Documento criado: ${documents.id}`);
      }
    }
    
    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('  - Usuários: 2 (admin + professional)');
    console.log('  - Serviços: 2');
    console.log('  - Clientes: 2');
    console.log('  - Agendamentos: 2');
    
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
  }
}

async function main() {
  console.log('🚀 Seed do Firebase para Tessy Nails\n');
  await seedFirestore();
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { seedFirestore, seedData };
