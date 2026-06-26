import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// 1. Load env variables manually from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error('Error loading env file:', e);
}

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Ensure configuration is valid
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration keys are missing. Please ensure .env.local is configured.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_OPERATIONS = [
  'Bradesco',
  'Banese',
  'Banco BV',
  'Claro',
  'Cielo',
  'Luxottica',
  'Onfly',
  'Pagbank',
  'PicPay',
  'Pluxee',
  'Outro'
];

async function run() {
  const email = 'seed_temp@demandtracker.com';
  const password = 'seedTempPassword123!';

  try {
    console.log(`Tentando autenticar como: ${email}...`);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login efetuado com sucesso (usuário de semente já existente).');
    } catch (signInErr: any) {
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        console.log('Usuário de semente não encontrado. Criando nova conta de semente...');
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Conta de semente criada e autenticada com sucesso!');
      } else {
        throw signInErr;
      }
    }

    console.log('Buscando operações existentes no Firestore...');
    const opCollection = collection(db, 'operations');
    
    // Buscar operações default existentes
    const q = query(opCollection, where('isDefault', '==', true));
    const snapshot = await getDocs(q);
    const existingNames = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.name) {
        existingNames.add(data.name.toLowerCase());
      }
    });

    console.log(`Encontradas ${existingNames.size} operações padrão existentes no Firestore.`);
    
    const missingOps = DEFAULT_OPERATIONS.filter(
      name => !existingNames.has(name.toLowerCase())
    );

    if (missingOps.length === 0) {
      console.log('Todas as operações padrão já estão cadastradas no Firestore!');
      process.exit(0);
    }

    console.log(`Cadastrando ${missingOps.length} operações ausentes...`);
    const batch = writeBatch(db);
    const now = Timestamp.now();

    missingOps.forEach(name => {
      const newDocRef = doc(opCollection); // Gera ID automático
      batch.set(newDocRef, {
        name,
        userId: null,
        isDefault: true,
        createdAt: now,
        updatedAt: now
      });
      console.log(`- Preparando: ${name}`);
    });

    await batch.commit();
    console.log('Sucesso! Operações padrão cadastradas com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a execução do seed:', error);
    process.exit(1);
  }
}

run();
