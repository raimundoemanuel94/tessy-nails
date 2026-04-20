#!/usr/bin/env ts-node

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Configuração Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./tessy-nails-firebase-adminsdk-fbsvc-8ebe8667af.json', 'utf8'));

// Inicializar Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: 'tessy-nails'
});

const db = getFirestore(app);

// Lista de serviços para importar
const services = [
  {
    id: 'manicure-simples',
    name: 'Manicure Simples',
    description: 'Limpeza, corte e esmaltação clássica para unhas bem cuidadas. Inclui remoção de cutículas, lixamento e esmaltação tradicional.',
    durationMinutes: 60,
    price: 45.00,
    category: 'manicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'manicure-francesa',
    name: 'Manicure Francesa',
    description: 'Esmaltação francesa elegante com pontas brancas clássicas. Técnica tradicional com acabamento impecável e duradouro.',
    durationMinutes: 75,
    price: 65.00,
    category: 'manicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'pedicure-completa',
    name: 'Pedicure Completa',
    description: 'Tratamento completo para pés com esfoliação, hidratação e esmaltação. Deixa os pés macios, renovados e bem cuidados.',
    durationMinutes: 90,
    price: 80.00,
    category: 'pedicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'unhas-gel',
    name: 'Unhas em Gel',
    description: 'Aplicação de gel com durabilidade de 3 semanas. Perfeito para quem busca unhas fortes e com brilho intenso por mais tempo.',
    durationMinutes: 120,
    price: 120.00,
    category: 'gel',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'nail-art',
    name: 'Nail Art',
    description: 'Arte personalizada nas unhas com designs exclusivos. Criamos desenhos únicos conforme seu estilo e preferência.',
    durationMinutes: 150,
    price: 150.00,
    category: 'arte',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'alongamento-unhas',
    name: 'Alongamento de Unhas',
    description: 'Alongamento com fibra de vidro ou acrílico para unhas mais longas e resistentes. Ideal para unhas fracas ou quebradiças.',
    durationMinutes: 180,
    price: 180.00,
    category: 'alongamento',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'manicure-executiva',
    name: 'Manicure Executiva',
    description: 'Tratamento premium com máscara hidratante e massageamento. Inclui esfoliação, hidratação profunda e esmaltação de alta qualidade.',
    durationMinutes: 90,
    price: 95.00,
    category: 'manicure',
    isActive: true,
    createdAt: new Date()
  },
  {
    id: 'pedicure-terapeutica',
    name: 'Pedicure Terapêutica',
    description: 'Tratamento especializado para calosidades e rachaduras. Inclui esfoliação intensiva, máscara reparadora e hidratação profunda.',
    durationMinutes: 105,
    price: 110.00,
    category: 'pedicure',
    isActive: true,
    createdAt: new Date()
  }
];

async function seedServices() {
  console.log('🚀 Iniciando importação de serviços para o Firestore...');
  
  try {
    const servicesRef = db.collection('services');
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const service of services) {
      try {
        // Verificar se o serviço já existe
        const serviceDoc = await servicesRef.doc(service.id).get();
        
        if (serviceDoc.exists) {
          console.log(`⏭️  Serviço "${service.name}" já existe. Pulando...`);
          skippedCount++;
          continue;
        }

        // Criar novo serviço
        await servicesRef.doc(service.id).set(service);
        console.log(`✅ Serviço "${service.name}" criado com sucesso!`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Erro ao criar serviço "${service.name}":`, error);
        errorCount++;
      }
    }

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Criados: ${createdCount} serviços`);
    console.log(`⏭️  Pulados: ${skippedCount} serviços (já existiam)`);
    console.log(`❌ Erros: ${errorCount} serviços`);
    console.log(`📋 Total processados: ${services.length} serviços`);

    if (createdCount > 0) {
      console.log('\n🎉 Serviços importados com sucesso! Acesse o Firebase Console para visualizar.');
    } else {
      console.log('\n📝 Nenhum novo serviço foi criado. Todos já existiam no Firestore.');
    }

  } catch (error) {
    console.error('❌ Erro geral durante a importação:', error);
    process.exit(1);
  }
}

// Função para validar serviços criados
async function validateServices() {
  console.log('\n🔍 Validando serviços criados...');
  
  try {
    const servicesRef = db.collection('services');
    const snapshot = await servicesRef.get();
    
    console.log(`📋 Total de serviços na coleção: ${snapshot.size}`);
    
    snapshot.forEach(doc => {
      const service = doc.data();
      console.log(`  - ${service.name} (${doc.id}) - R$ ${service.price}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao validar serviços:', error);
  }
}

// Executar seed e validação
async function main() {
  await seedServices();
  await validateServices();
  
  console.log('\n🏁 Script concluído!');
  process.exit(0);
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

export { seedServices, validateServices };
