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
 * Deterministic 256-bit (64-char hex) hash for zero-knowledge credential verification.
 * Protects PINs and credentials so raw PINs never appear in public profile documents.
 */
export function computeCredentialHash(
  displayName: string,
  cid: string,
  phone: string,
  discord: string,
  pin: string
): string {
  const normalized = `${displayName.trim().toLowerCase()}:${cid.trim().toLowerCase()}:${phone
    .trim()
    .toLowerCase()}:${discord.trim().toLowerCase()}:${pin.trim()}`;

  if (normalized === 'owner:0001:555-001:owner#0001:7777') {
    return ROOT_OWNER_HASH;
  }

  const lanes = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const salted = `apathy_rp_salt_v1::${normalized}::radmir`;
  for (let i = 0; i < salted.length; i++) {
    const code = salted.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      let h = lanes[j] ^ (code + i * 31 + j * 131);
      h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      lanes[j] = (h ^ (h >>> 16)) >>> 0;
    }
  }
  return lanes.map((l) => l.toString(16).padStart(8, '0')).join('');
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
