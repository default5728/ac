import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import applicationsConfigRaw from '../../firebase-applications-config.json';
import { db as mainDb, ROOT_OWNER_HASH } from './firebase';

// Applicant forms live in a SEPARATE Firebase project so the public recruiting site never needs
// write access to the staff portal's main database (auth_hashes, staff_profiles, staff_secrets).
// Until the dedicated project's keys are pasted into firebase-applications-config.json we fall
// back to the main database, so nothing crashes and behavior is unchanged.
// This MUST be a named app: the main project already owns the default app instance.
const APPLICATIONS_APP_NAME = 'apathy-applications';
const isPlaceholder = String(applicationsConfigRaw.projectId || '').includes('REPLACE-WITH');

let applicationsDb: Firestore;

if (isPlaceholder) {
  applicationsDb = mainDb;
} else {
  const existing = getApps().find((a) => a.name === APPLICATIONS_APP_NAME);
  const app: FirebaseApp =
    existing ?? initializeApp(applicationsConfigRaw, APPLICATIONS_APP_NAME);
  applicationsDb = getFirestore(app, applicationsConfigRaw.firestoreDatabaseId);
}

export { applicationsDb };

// The applications rules gate staff list/update on isRootOwnerSeeded(), which checks for this
// anchor doc. The dedicated project starts empty, so ac seeds the anchor once on boot to unlock
// the review flow. Writing to the fallback main db is a harmless no-op (doc already exists).
export async function seedApplicationsOwnerAnchor(): Promise<void> {
  const ref = doc(applicationsDb, 'auth_hashes', ROOT_OWNER_HASH);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { id: ROOT_OWNER_HASH, profileId: 'u-owner-root', role: 'owner' });
  }
}
