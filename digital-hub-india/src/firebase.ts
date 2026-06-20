import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const meta = import.meta as any;

const firebaseConfig = {
  apiKey: meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyAx-ZZRhh7a4rh_nR-aQtfdkAn3UB1_m08",
  authDomain: meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "inspiring-craft-4hh41.firebaseapp.com",
  projectId: meta.env?.VITE_FIREBASE_PROJECT_ID || "inspiring-craft-4hh41",
  storageBucket: meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "inspiring-craft-4hh41.firebasestorage.app",
  messagingSenderId: meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "181637293548",
  appId: meta.env?.VITE_FIREBASE_APP_ID || "1:181637293548:web:c068a81a571cdb05b34cc9"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app, "ai-studio-fa75d009-6bac-4b67-b926-c559c9866a9c");
export const auth = getAuth(app);
import { getStorage } from 'firebase/storage';
export const storage = getStorage(app);

// Authentication & Firestore Error Handlers
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Verify connections helper
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears to be offline. Verify network connection and config.");
    }
  }
}
testConnection();
