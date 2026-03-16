const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Caminho para a chave de serviço (ajustado para o local correto)
const serviceAccountPath = path.join(__dirname, '..', 'Tessy Nails', 'scripts', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'tessy-nails'
});

const db = getFirestore();

// Catálogo Real de Serviços da Tessy Nails
const realServices = [
  {
    id: 'manicure-simples',
    name: 'Manicure Simples',
    description: 'Limpeza, corte e esmaltação clássica para unhas bem cuidadas. Inclui remoção de cutículas e lixamento.',
    durationMinutes: 60,
    price: 45.00,
    category: 'manicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'manicure-francesa',
    name: 'Manicure Francesa',
    description: 'Esmaltação francesa elegante com pontas brancas clássicas e acabamento impecável.',
    durationMinutes: 75,
    price: 65.00,
    category: 'manicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'pedicure-completa',
    name: 'Pedicure Completa',
    description: 'Tratamento completo para pés com esfoliação, hidratação e esmaltação tradicional.',
    durationMinutes: 90,
    price: 80.00,
    category: 'pedicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'unhas-gel',
    name: 'Unhas em Gel',
    description: 'Aplicação de gel com durabilidade de até 3 semanas. Brilho intenso e resistência.',
    durationMinutes: 120,
    price: 120.00,
    category: 'gel',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'alongamento-fibra',
    name: 'Alongamento em Fibra',
    description: 'Alongamento com fibra de vidro para unhas mais longas, naturais e super resistentes.',
    durationMinutes: 180,
    price: 180.00,
    category: 'alongamento',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'manutencao-alongamento',
    name: 'Manutenção Alongamento',
    description: 'Manutenção periódica para garantir a saúde das unhas e a beleza do alongamento.',
    durationMinutes: 120,
    price: 100.00,
    category: 'alongamento',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'nail-art-especial',
    name: 'Nail Art Especial',
    description: 'Decorações personalizadas, pedrarias e desenhos feitos à mão.',
    durationMinutes: 30,
    price: 25.00,
    category: 'arte',
    isActive: true,
    createdAt: new Date()
  }
];

async function syncServices() {
  console.log('🚀 Iniciando sincronização do catálogo de serviços...');
  
  const servicesRef = db.collection('services');
  
  try {
    // 1. Marcar todos os serviços atuais como inativos (para "limpar" os genéricos)
    console.log('📦 Desativando serviços antigos...');
    const snapshot = await servicesRef.get();
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    await batch.commit();
    console.log(`✅ ${snapshot.size} serviços antigos marcados como inativos.`);

    // 2. Adicionar/Atualizar os serviços reais
    console.log('✨ Importando catálogo real...');
    for (const service of realServices) {
      const docId = service.id;
      const { id, ...serviceData } = service;
      
      await servicesRef.doc(docId).set({
        ...serviceData,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log(`🔹 Serviço sincronizado: ${service.name}`);
    }

    console.log('\n✅ Sincronização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    process.exit(1);
  }
}

syncServices();
