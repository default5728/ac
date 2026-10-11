import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, FirestoreError, type Firestore } from 'firebase/firestore';
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
// the review flow.
// The rules forbid get/list on /auth_hashes (hashes must not be enumerable), so existence cannot
// be probed first: we write directly. The create rule requires the doc to be absent, therefore a
// re-run — or the fallback to the main db, where the anchor already exists — is simply answered
// with permission-denied, which means the anchor is already in place. Both outcomes unlock
// isRootOwnerSeeded().
export async function seedApplicationsOwnerAnchor(): Promise<void> {
  try {
    await setDoc(doc(applicationsDb, 'auth_hashes', ROOT_OWNER_HASH), {
      id: ROOT_OWNER_HASH,
      profileId: 'u-owner-root',
      role: 'owner',
    });
  } catch (err) {
    if (err instanceof FirestoreError && err.code === 'permission-denied') return;
    throw err;
  }
}
