const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'Tessy Nails', 'scripts', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'tessy-nails'
});

const db = getFirestore();

async function checkData() {
  console.log('--- Verificando dados no Firestore ---');
  
  const clientsSnapshot = await db.collection('clients').get();
  console.log(`Total de clientes: ${clientsSnapshot.size}`);
  clientsSnapshot.forEach(doc => {
    console.log(` - Cliente: [${doc.id}] ${doc.data().name}`);
  });

  const servicesSnapshot = await db.collection('services').get();
  console.log(`Total de serviços: ${servicesSnapshot.size}`);
  servicesSnapshot.forEach(doc => {
    console.log(` - Serviço: [${doc.id}] ${doc.data().name} (Ativo: ${doc.data().isActive})`);
  });

  process.exit(0);
}

checkData();
