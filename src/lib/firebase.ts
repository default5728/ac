import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ROOT_OWNER_HASH =
  '493280c790a2a988171849d2f24d47458732a4f59907d700222668162c6f275c';

/**
 * Deterministic 256-bit (64-char hex) login hash over Nick + PIN only,
 * via the browser's native SHA-256 (WebCrypto). Raw PINs never leave the
 * client as a stored credential: only this hash is written to /auth_hashes.
 */
export async function computeLoginHash(displayName: string, pin: string): Promise<string> {
  const normalized = `${displayName.trim().toLowerCase()}:${pin.trim()}`;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`apathy_login_v2::${normalized}`)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes a non-listable secret vault document ID for a staff profile's PII/PIN
 * using the Owner's master key so `/staff_secrets` cannot be enumerated.
 */
export function computeSecretVaultId(profileId: string): string {
  const lanes = [0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344];
  const input = `vault_key::${ROOT_OWNER_HASH}::${profileId}`;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    for (let j = 0; j < 4; j++) {
      let h = lanes[j] ^ (c + i * 17 + j * 97);
      h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
      h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
      lanes[j] = (h ^ (h >>> 15)) >>> 0;
    }
  }
  return `sec_${lanes.map((l) => l.toString(16).padStart(8, '0')).join('')}`;
}
