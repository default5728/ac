/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Profile Write',
    collection: 'staff_profiles',
    docId: 'u-1',
    operation: 'create',
    auth: null,
    payload: { id: 'u-1', displayName: 'Hacker', role: 'owner' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on StaffProfile',
    collection: 'staff_profiles',
    docId: 'u-1',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'aleksanderkey3@gmail.com', email_verified: true },
    payload: { id: 'u-1', displayName: 'Test', isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Self-Privilege Escalation on StaffProfile Update',
    collection: 'staff_profiles',
    docId: 'u-1',
    operation: 'update',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    payload: { role: 'owner' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Leak on StaffSecret Read',
    collection: 'staff_secrets',
    docId: 'u-owner-root',
    operation: 'get',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Email Spoofing Attack (email_verified: false)',
    collection: 'corp_state',
    docId: 'main',
    operation: 'update',
    auth: { uid: 'spoof-1', email: 'aleksanderkey3@gmail.com', email_verified: false },
    payload: { treasuryBalance: 99999999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID Poisoning Attack',
    collection: 'fleet',
    docId: 'bad$id!@#',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'aleksanderkey3@gmail.com', email_verified: true },
    payload: { id: 'bad$id!@#', modelName: 'Speedo' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Denial of Wallet Oversized String',
    collection: 'bonus_reports',
    docId: 'rep-1',
    operation: 'create',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    payload: { comment: 'A'.repeat(1000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Identity Spoofing on BonusReport Create',
    collection: 'bonus_reports',
    docId: 'rep-1',
    operation: 'create',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    payload: { authorUid: 'other-uid' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Terminal State Bypass on BonusReport',
    collection: 'bonus_reports',
    docId: 'rep-1',
    operation: 'update',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    payload: { status: 'pending', requestedAmount: 999999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized Analytics Modification',
    collection: 'corp_state',
    docId: 'main',
    operation: 'update',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    payload: { treasuryBalance: 5000000 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unauthorized Fleet Deletion',
    collection: 'fleet',
    docId: 'veh-1',
    operation: 'delete',
    auth: { uid: 'emp-1', email: 'emp@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Audit Log Tampering',
    collection: 'audit_logs',
    docId: 'log-1',
    operation: 'delete',
    auth: { uid: 'admin-1', email: 'aleksanderkey3@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
