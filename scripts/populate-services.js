import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Configuração do Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyDovLKo3djdRbs963vqKdbj-geRWyzMTrg",
  authDomain: "tessy-nails.firebaseapp.com",
  projectId: "tessy-nails",
  storageBucket: "tessy-nails.appspot.com",
  messagingSenderId: "229831786550",
  appId: "1:229831786550:web:abc123def456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Serviços iniciais para salão de unhas
const initialServices = [
  {
    name: "Manicure Simples",
    description: "Cuidados básicos das unhas: corte, lixa e esmaltação tradicional",
    price: 50,
    durationMinutes: 60,
    active: true,
    category: "manicure",
    rating: 4.8,
    image: "/images/services/manicure-simples.jpg"
  },
  {
    name: "Manicure em Gel",
    description: "Manicure com esmaltação em gel, maior durabilidade e brilho intenso",
    price: 80,
    durationMinutes: 90,
    active: true,
    category: "manicure",
    rating: 4.9,
    image: "/images/services/manicure-gel.jpg"
  },
  {
    name: "Pedicure Completa",
    description: "Tratamento completo dos pés: esfoliação, hidratação e esmaltação",
    price: 70,
    durationMinutes: 75,
    active: true,
    category: "pedicure",
    rating: 4.7,
    image: "/images/services/pedicure.jpg"
  },
  {
    name: "Alongamento de Unhas",
    description: "Aplicação de unhas acrílicas ou em gel com formato desejado",
    price: 120,
    durationMinutes: 120,
    active: true,
    category: "alongamento",
    rating: 4.9,
    image: "/images/services/alongamento.jpg"
  },
  {
    name: "Esmaltação em Gel",
    description: "Esmaltação em gel sobre unhas naturais, duração de 3 semanas",
    price: 60,
    durationMinutes: 45,
    active: true,
    category: "esmaltacao",
    rating: 4.6,
    image: "/images/services/esmaltacao-gel.jpg"
  },
  {
    name: "Spa das Mãos",
    description: "Tratamento de luxo: hidratação profunda, massagem e esmaltação",
    price: 90,
    durationMinutes: 60,
    active: true,
    category: "spa",
    rating: 5.0,
    image: "/images/services/spa-maos.jpg"
  },
  {
    name: "Spa dos Pés",
    description: "Tratamento relaxante: banho de pés, esfoliação e massagem",
    price: 80,
    durationMinutes: 60,
    active: true,
    category: "spa",
    rating: 4.8,
    image: "/images/services/spa-pes.jpg"
  },
  {
    name: "Manutenção de Gel",
    description: "Manutenção semanal de unhas em gel para manter a aparência",
    price: 45,
    durationMinutes: 30,
    active: true,
    category: "manutencao",
    rating: 4.5,
    image: "/images/services/manutencao-gel.jpg"
  },
  {
    name: "Unhas Decoradas",
    description: "Arte em unhas com desenhos, pedrarias e nail art personalizada",
    price: 100,
    durationMinutes: 90,
    active: true,
    category: "decoracao",
    rating: 4.9,
    image: "/images/services/unhas-decoradas.jpg"
  },
  {
    name: "Tratamento Fortalecedor",
    description: "Tratamento para unhas fracas e quebradiças com produtos especiais",
    price: 55,
    durationMinutes: 40,
    active: true,
    category: "tratamento",
    rating: 4.7,
    image: "/images/services/tratamento.jpg"
  }
];

// Função para popular serviços
async function populateServices() {
  try {
    console.log("🚀 Iniciando popularização de serviços...");
    
    const servicesRef = collection(db, "services");
    const results = [];
    
    for (const service of initialServices) {
      const serviceData = {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(servicesRef, serviceData);
      console.log(`✅ Serviço criado: ${service.name} (ID: ${docRef.id})`);
      results.push({ id: docRef.id, name: service.name });
    }
    
    console.log(`🎉 Sucesso! ${results.length} serviços criados:`);
    results.forEach(r => console.log(`  - ${r.name} (${r.id})`));
    
    return results;
  } catch (error) {
    console.error("❌ Erro ao popular serviços:", error);
    throw error;
  }
}

// Função para criar configuração do salão
async function createSalonConfig() {
  try {
    console.log("🏢 Criando configuração do salão...");
    
    const configRef = collection(db, "salonConfig");
    
    const salonConfig = {
      name: "Tessy Nails",
      phone: "(11) 99999-9999",
      email: "contato@tessynails.com.br",
      address: {
        street: "Rua Principal, 123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "00000-000"
      },
      workingHours: {
        monday: { open: "09:00", close: "19:00", closed: false },
        tuesday: { open: "09:00", close: "19:00", closed: false },
        wednesday: { open: "09:00", close: "19:00", closed: false },
        thursday: { open: "09:00", close: "19:00", closed: false },
        friday: { open: "09:00", close: "19:00", closed: false },
        saturday: { open: "08:00", close: "18:00", closed: false },
        sunday: { open: "00:00", close: "00:00", closed: true }
      },
      settings: {
        appointmentDuration: 30, // minutos
        advanceBookingDays: 30, // dias
        cancelationHours: 24, // horas
        requireConfirmation: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(configRef, salonConfig);
    console.log(`✅ Configuração do salão criada (ID: ${docRef.id})`);
    
    return docRef.id;
  } catch (error) {
    console.error("❌ Erro ao criar configuração:", error);
    throw error;
  }
}

// Executar tudo
async function main() {
  try {
    console.log("🎯 Iniciando setup completo do Tessy Nails...\n");
    
    // 1. Popular serviços
    await populateServices();
    console.log("");
    
    // 2. Criar configuração do salão
    await createSalonConfig();
    console.log("");
    
    console.log("🎉 Setup completo! O salão está pronto para uso!");
    console.log("\n📋 Resumo:");
    console.log("  ✅ 10 serviços criados");
    console.log("  ✅ Configuração do salão criada");
    console.log("  ✅ Horários de funcionamento definidos");
    console.log("\n🚀 Agora acesse: https://tessy-nails.vercel.app/servicos");
    
  } catch (error) {
    console.error("❌ Falha no setup:", error);
    process.exit(1);
  }
}

// Executar
main();
