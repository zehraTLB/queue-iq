import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const keyPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');

let initialized = false;

if (existsSync(keyPath)) {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
} else {
  console.warn(
    '\n[queue-iq-server] serviceAccountKey.json not found.\n' +
    'Download it from Firebase Console → Project settings → Service accounts → Generate new private key,\n' +
    'then save it as server/serviceAccountKey.json and restart the server.\n' +
    'Until then, all /api routes that need Firebase will return 503.\n'
  );
}

export const isFirebaseReady = () => initialized;
export const getAuth = () => admin.auth();
export const getDb = () => admin.firestore();
