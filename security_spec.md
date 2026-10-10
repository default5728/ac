# Security Specification — APATHY RP Portal

## 1. Data Invariants
1. **Default Deny**: All unmatched paths in Firestore are unconditionally rejected (`allow read, write: if false`).
2. **PII & PIN Isolation**: Raw PIN codes, phone numbers, and Discord tags are strictly isolated in `/staff_secrets/{profileId}` and can ONLY be read or written by a verified Admin/Owner (`isAdmin()`).
3. **Hashed Credentials**: `/staff_profiles/{profileId}` stores only `credentialHash` (SHA-256) and non-PII operational fields.
4. **Role & Admin Verification**: Admin privilege (`isAdmin()`) requires `request.auth != null`, `request.auth.token.email_verified == true`, and either the bootstrapped owner email (`aleksanderkey3@gmail.com`) or an existing record in `/admins/$(request.auth.uid)`.
5. **Strict Schema & Bounds**: Every string field enforces `.size() <= MAX` and IDs match `^[a-zA-Z0-9_\-]+$`. Every `create` and `update` invokes `isValid[Entity](incoming())` and restricts keys via `hasOnly`.
6. **Bonus Reports Isolation**: Bonus reports in `/bonus_reports/{reportId}` can only be read by `isAdmin()` or the report's author (`resource.data.authorUid == request.auth.uid`). Once `status` reaches `'approved'` or `'rejected'`, non-admins cannot update it.

## 2. The "Dirty Dozen" Payloads

1. **Unauthenticated Profile Write** (`/staff_profiles/u-1`):
   `{ "id": "u-1", "displayName": "Hacker", "role": "owner" }` (auth = null) -> `PERMISSION_DENIED`
2. **Shadow Field Injection on StaffProfile** (`/staff_profiles/u-1`):
   `{ ..., "isSuperAdmin": true }` -> `PERMISSION_DENIED`
3. **Self-Privilege Escalation on StaffProfile Update** (`/staff_profiles/u-1`):
   Non-admin attempting to update `role` from `'employee'` to `'owner'` -> `PERMISSION_DENIED`
4. **PII Leak on StaffSecret Read** (`/staff_secrets/u-owner-root`):
   Authenticated non-admin attempting `get` on `/staff_secrets/u-owner-root` -> `PERMISSION_DENIED`
5. **Email Spoofing Attack** (`/corp_state/main`):
   User with `email: "aleksanderkey3@gmail.com"` but `email_verified: false` attempting to update treasury -> `PERMISSION_DENIED`
6. **ID Poisoning Attack** (`/fleet/invalid$id!@#`):
   Attempting to create a vehicle with malformed ID -> `PERMISSION_DENIED`
7. **Denial of Wallet (1MB String)** (`/bonus_reports/rep-1`):
   `comment` field exceeding 500 chars -> `PERMISSION_DENIED`
8. **Identity Spoofing on BonusReport Create** (`/bonus_reports/rep-1`):
   Setting `authorUid` to another user's UID -> `PERMISSION_DENIED`
9. **Terminal State Bypass on BonusReport** (`/bonus_reports/rep-1`):
   Non-admin attempting to modify a report whose `status` is already `'approved'` -> `PERMISSION_DENIED`
10. **Unauthorized Analytics Modification** (`/corp_state/main`):
    Regular employee attempting to update `treasuryBalance` -> `PERMISSION_DENIED`
11. **Unauthorized Fleet Deletion** (`/fleet/veh-1`):
    Regular employee attempting `delete` on `/fleet/veh-1` -> `PERMISSION_DENIED`
12. **Audit Log Tampering** (`/audit_logs/log-1`):
    Attempting to `update` or `delete` an existing immutable audit log -> `PERMISSION_DENIED`
