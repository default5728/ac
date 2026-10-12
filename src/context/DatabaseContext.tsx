import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  computeCredentialHash,
  computeSecretVaultId,
  ROOT_OWNER_HASH,
} from '../lib/firebase';
import { applicationsDb, seedApplicationsOwnerAnchor } from '../lib/applicationsFirebase';
import {
  UserProfile,
  UserRole,
  VehicleItem,
  HallOfFameEntry,
  CorporationFinancials,
  AuditLogItem,
  AppNotification,
  FarmStats,
  RESOURCE_PRICES,
  ROLE_DEFINITIONS,
  RANK_LADDER,
  MAX_RANK,
  ShiftStatus,
  VehicleStatus,
  BonusReport,
  BonusReportStatus,
  CandidateApplication,
  ApplicationStatus,
  isProfileOnline,
  PRESENCE_HEARTBEAT_MS,
} from '../types/database';
import {
  INITIAL_USERS,
  INITIAL_FLEET,
  INITIAL_HALL_OF_FAME,
  INITIAL_FINANCIALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BONUS_REPORTS,
} from '../store/initialData';

interface LoginCredentials {
  displayName: string;
  cid: string;
  phone: string;
  discord: string;
  pin: string;
}

interface DatabaseContextType {
  // Collections
  users: UserProfile[];
  fleet: VehicleItem[];
  hallOfFame: HallOfFameEntry[];
  financials: CorporationFinancials;
  auditLogs: AuditLogItem[];
  notifications: AppNotification[];
  bonusReports: BonusReport[];
  applications: CandidateApplication[];
  activeToastIds: string[];

  // Cloud & Session status
  isCloudConnected: boolean;
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  lastSyncedAt: Date;
  syncEventCount: number;
  /** Advances on a timer so presence badges expire even when the cloud is silent. */
  presenceNow: number;

  // Modals & Navigation
  isArchitectureModalOpen: boolean;
  openArchitectureModal: () => void;
  closeArchitectureModal: () => void;

  // Auth (Works across ANY domain: Vercel, Cloudflare, AI Studio without Google popup!)
  loginWithCredentials: (creds: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  createUserByAdmin: (newUserData: {
    displayName: string;
    cid: string;
    phone: string;
    discord: string;
    pin: string;
    role: UserRole;
    rankNumber?: number;
    department?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateUserCredentialsByOwner: (
    userId: string,
    updates: {
      role?: UserRole;
      pin?: string;
      rankNumber?: number;
      rankName?: string;
      department?: string;
      phone?: string;
      discord?: string;
      displayName?: string;
      cid?: string;
    }
  ) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  logoutStaff: () => Promise<void>;

  // Recruitment: applications submitted on the public portal
  approveCandidateApplication: (
    appId: string,
    credentials: { pin: string; role: UserRole; department?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  rejectCandidateApplication: (
    appId: string,
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Staff Farm Management (Owner, Admin, HR ONLY)
  recordFarmSubmission: (
    userId: string,
    items: {
      rock: number;
      wood: number;
      blueFlower: number;
      redFlower: number;
      pinkFlower: number;
    }
  ) => Promise<void>;
  updateStaffFarmStats: (
    userId: string,
    exactStats: {
      rock: number;
      wood: number;
      blueFlower: number;
      redFlower: number;
      pinkFlower: number;
      walletBalance: number;
    }
  ) => Promise<void>;

  // Vehicle & BioNotes Management (Owner & Admin ONLY)
  updateStaffVehicleAndNotes: (
    userId: string,
    updates: {
      assignedVehicle?: string;
      bioNotes?: string;
    }
  ) => Promise<void>;

  // Bonus Reports (Submitted by any staff, visible & managed by Owner)
  submitBonusReport: (data: { requestedAmount: number; comment: string }) => Promise<void>;
  reviewBonusReport: (reportId: string, status: BonusReportStatus) => Promise<void>;
  deleteBonusReport: (reportId: string) => Promise<void>;

  // Profile, Analytics, Treasury, Fleet, Hall of Fame
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  updateFinancialsData: (updates: Partial<CorporationFinancials>) => Promise<void>;
  adjustTreasury: (deltaAmount: number, reason: string) => Promise<void>;
  updateHallOfFameWinner: (entryId: string, updates: Partial<HallOfFameEntry>) => Promise<void>;
  updateVehicleStatus: (vehicleId: string, status: VehicleStatus) => Promise<void>;
  updateVehiclePublicFields: (
    vehicleId: string,
    updates: { publicVisible?: boolean; publicImage?: string; publicDesc?: string }
  ) => Promise<void>;
  updateVehicleFields: (
    vehicleId: string,
    updates: {
      modelName?: string;
      plate?: string;
      trunkKg?: number;
      slot?: string;
      rankRequired?: string;
    }
  ) => Promise<void>;
  addVehicle: (newVehicle: Omit<VehicleItem, 'id'>) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  dismissToast: (id: string) => void;
  clearAllNotifications: () => void;
  resetDatabaseToDefault: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const SESSION_KEY = 'apathy_corp_session_v9';

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Set once the first real cloud snapshots arrive; public_stats mirroring waits for them
  // so seeded local defaults never overwrite real numbers in the public document.
  const corpStateLoadedRef = React.useRef(false);
  const profilesLoadedRef = React.useRef(false);

  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [secretsMap, setSecretsMap] = useState<
    Record<string, { phone: string; discord: string; pin: string; credHash: string }>
  >({});
  const secretsMapRef = React.useRef<
    Record<string, { phone: string; discord: string; pin: string; credHash: string }>
  >({});
  const [fleet, setFleet] = useState<VehicleItem[]>(INITIAL_FLEET);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>(INITIAL_HALL_OF_FAME);
  const [financials, setFinancials] = useState<CorporationFinancials>(INITIAL_FINANCIALS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [bonusReports, setBonusReports] = useState<BonusReport[]>(INITIAL_BONUS_REPORTS);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [activeToastIds, setActiveToastIds] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [syncEventCount, setSyncEventCount] = useState<number>(0);
  const [presenceNow, setPresenceNow] = useState<number>(() => Date.now());

  const triggerSyncPulse = useCallback(() => {
    setLastSyncedAt(new Date());
    setSyncEventCount((prev) => prev + 1);
  }, []);

  // Save active corporate session in sessionStorage
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [currentUser]);

  // Helper to convert Firestore StaffProfile doc + optional secret into UserProfile
  const mapDocToUserProfile = useCallback(
    (
      data: Record<string, unknown>,
      secret?: { phone: string; discord: string; pin: string }
    ): UserProfile => {
      return {
        id: String(data.id || ''),
        username: String(data.username || ''),
        displayName: String(data.displayName || ''),
        pin: secret?.pin || '••••',
        role: (data.role as UserRole) || 'employee',
        cid: String(data.cid || ''),
        rankNumber: Number(data.rankNumber) || 4,
        rankName: String(data.rankName || 'Сотрудник'),
        phone: secret?.phone || 'Скрыто (Защита БД)',
        discord: secret?.discord || 'Скрыто (Защита БД)',
        department: String(data.department || 'Цех добычи'),
        walletBalance: Number(data.walletBalance) || 0,
        farmStats: {
          rock: Number(data.rock) || 0,
          wood: Number(data.wood) || 0,
          blueFlower: Number(data.blueFlower) || 0,
          redFlower: Number(data.redFlower) || 0,
          pinkFlower: Number(data.pinkFlower) || 0,
          totalEarned: Number(data.totalEarned) || 0,
        },
        assignedVehicle: String(data.assignedVehicle || '-'),
        // status is derived from the heartbeat, so every consumer reads presence rather than the
        // manual switch a stale row may still carry.
        lastActive: String(data.lastActive || ''),
        status: isProfileOnline(
          String(data.lastActive || ''),
          (data.status as ShiftStatus) || 'off_duty'
        )
          ? 'on_shift'
          : 'off_duty',
        bioNotes: String(data.bioNotes || ''),
        joinedAt: String(data.joinedAt || ''),
      };
    },
    []
  );

  // Ensure initial root owner and state are seeded in Firestore on boot
  useEffect(() => {
    let mounted = true;
    async function seedIfNeeded() {
      try {
        const rootHashRef = doc(db, 'auth_hashes', ROOT_OWNER_HASH);
        const rootHashSnap = await getDoc(rootHashRef);

        if (!rootHashSnap.exists()) {
          // 1. Seed root owner hash in /auth_hashes ( triggers isRootOwnerSeeded() in rules )
          await setDoc(rootHashRef, {
            id: ROOT_OWNER_HASH,
            profileId: 'u-owner-root',
            role: 'owner',
          });

          // 2. Seed /staff_profiles/u-owner-root (NO PIN, NO PHONE, NO DISCORD)
          const rootOwner = INITIAL_USERS[0];
          await setDoc(doc(db, 'staff_profiles', rootOwner.id), {
            id: rootOwner.id,
            username: rootOwner.username,
            displayName: rootOwner.displayName,
            role: rootOwner.role,
            cid: rootOwner.cid,
            rankNumber: rootOwner.rankNumber,
            rankName: rootOwner.rankName,
            department: rootOwner.department,
            walletBalance: rootOwner.walletBalance,
            rock: rootOwner.farmStats.rock,
            wood: rootOwner.farmStats.wood,
            blueFlower: rootOwner.farmStats.blueFlower,
            redFlower: rootOwner.farmStats.redFlower,
            pinkFlower: rootOwner.farmStats.pinkFlower,
            totalEarned: rootOwner.farmStats.totalEarned,
            assignedVehicle: rootOwner.assignedVehicle,
            status: rootOwner.status,
            bioNotes: rootOwner.bioNotes,
            joinedAt: rootOwner.joinedAt,
            lastActive: 'Онлайн',
          });

          // 3. Seed isolated secret in /staff_secrets/{vaultId}
          const vaultId = computeSecretVaultId(rootOwner.id);
          await setDoc(doc(db, 'staff_secrets', vaultId), {
            id: vaultId,
            profileId: rootOwner.id,
            phone: rootOwner.phone,
            discord: rootOwner.discord,
            pin: rootOwner.pin,
            credHash: ROOT_OWNER_HASH,
          });

          // 4. Seed /corp_state/main
          await setDoc(doc(db, 'corp_state', 'main'), {
            treasuryBalance: INITIAL_FINANCIALS.treasuryBalance,
            weeklyGain: INITIAL_FINANCIALS.weeklyGain,
            rock: INITIAL_FINANCIALS.totalMined.rock,
            wood: INITIAL_FINANCIALS.totalMined.wood,
            blueFlower: INITIAL_FINANCIALS.totalMined.blueFlower,
            redFlower: INITIAL_FINANCIALS.totalMined.redFlower,
            pinkFlower: INITIAL_FINANCIALS.totalMined.pinkFlower,
            totalEarned: INITIAL_FINANCIALS.totalMined.totalEarned,
            activeWorkersCount: 1,
            radioFrequency: INITIAL_FINANCIALS.radioFrequency,
          });

          // 5. Seed /hall_of_fame
          for (const h of INITIAL_HALL_OF_FAME) {
            await setDoc(doc(db, 'hall_of_fame', h.id), {
              id: h.id,
              place: h.place,
              nickname: h.nickname,
              cid: h.cid,
              rankTitle: h.rankTitle,
              totalMined: h.totalMined,
              bonusReward: h.bonusReward,
            });
          }
        }
        if (mounted) {
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.warn('Seed check:', err);
      }
    }
    seedIfNeeded();
    return () => {
      mounted = false;
    };
  }, []);

  // Real-time Firestore listeners (active across all domains: Vercel, Cloudflare, AI Studio)
  useEffect(() => {
    // 1. Listen to /staff_profiles
    const qProfiles = query(collection(db, 'staff_profiles'), where('rankNumber', '>=', 1));
    const unsubProfiles = onSnapshot(
      qProfiles,
      (snap) => {
        setIsCloudConnected(true);
        profilesLoadedRef.current = true;
        const docsData = snap.docs.map((d) => d.data());
        if (docsData.length > 0) {
          setUsers((prevUsers) => {
            return docsData.map((d) => {
              const id = String(d.id);
              const existingUser = prevUsers.find((p) => p.id === id);
              const sec =
                secretsMapRef.current[id] ||
                (existingUser && existingUser.phone !== 'Скрыто (Защита БД)'
                  ? {
                      phone: existingUser.phone,
                      discord: existingUser.discord,
                      pin: existingUser.pin,
                    }
                  : undefined);
              return mapDocToUserProfile(d, sec);
            });
          });
          triggerSyncPulse();
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'staff_profiles');
      }
    );

    // 2. Listen to /corp_state/main
    const unsubCorpState = onSnapshot(
      doc(db, 'corp_state', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          corpStateLoadedRef.current = true;
          const d = docSnap.data();
          setFinancials({
            treasuryBalance: Number(d.treasuryBalance) || 0,
            weeklyGain: Number(d.weeklyGain) || 0,
            totalMined: {
              rock: Number(d.rock) || 0,
              wood: Number(d.wood) || 0,
              blueFlower: Number(d.blueFlower) || 0,
              redFlower: Number(d.redFlower) || 0,
              pinkFlower: Number(d.pinkFlower) || 0,
              totalEarned: Number(d.totalEarned) || 0,
            },
            activeWorkersCount: Number(d.activeWorkersCount) || 0,
            radioFrequency: String(d.radioFrequency || '104.2 MHz'),
          });
          triggerSyncPulse();
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'corp_state/main');
      }
    );

    // 3. Listen to /fleet
    const qFleet = query(collection(db, 'fleet'), where('trunkKg', '>=', 0));
    const unsubFleet = onSnapshot(
      qFleet,
      (snap) => {
        const items: VehicleItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id),
            modelName: String(data.modelName),
            category: String(data.category),
            trunkKg: Number(data.trunkKg) || 0,
            rankRequired: String(data.rankRequired),
            slot: String(data.slot),
            status: data.status as VehicleStatus,
            fuelPercent: Number(data.fuelPercent) || 100,
            plate: String(data.plate),
            publicVisible: data.publicVisible !== false,
            publicImage: String(data.publicImage || ''),
            publicDesc: String(data.publicDesc || ''),
          };
        });
        setFleet(items);
        triggerSyncPulse();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'fleet');
      }
    );

    // 4. Listen to /hall_of_fame
    const qHof = query(collection(db, 'hall_of_fame'), where('place', '>=', 1));
    const unsubHof = onSnapshot(
      qHof,
      (snap) => {
        if (!snap.empty) {
          const items: HallOfFameEntry[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: String(data.id),
                place: (Number(data.place) as 1 | 2 | 3) || 1,
                nickname: String(data.nickname || 'none'),
                cid: String(data.cid || '-'),
                rankTitle: String(data.rankTitle || '-'),
                totalMined: Number(data.totalMined) || 0,
                bonusReward: Number(data.bonusReward) || 0,
              };
            })
            .sort((a, b) => a.place - b.place);
          setHallOfFame(items);
          triggerSyncPulse();
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'hall_of_fame');
      }
    );

    // 5. Listen to /bonus_reports
    const qReports = query(collection(db, 'bonus_reports'), where('requestedAmount', '>=', 0));
    const unsubReports = onSnapshot(
      qReports,
      (snap) => {
        const items: BonusReport[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: String(data.id),
              userId: String(data.userId),
              nickname: String(data.nickname),
              cid: String(data.cid),
              rankTitle: String(data.rankTitle),
              farmSnapshot: {
                rock: Number(data.rock) || 0,
                wood: Number(data.wood) || 0,
                blueFlower: Number(data.blueFlower) || 0,
                redFlower: Number(data.redFlower) || 0,
                pinkFlower: Number(data.pinkFlower) || 0,
                totalMinedItems: Number(data.totalMinedItems) || 0,
              },
              requestedAmount: Number(data.requestedAmount) || 0,
              comment: String(data.comment || ''),
              createdAt: String(data.createdAt || ''),
              status: (data.status as BonusReportStatus) || 'pending',
            };
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBonusReports(items);
        triggerSyncPulse();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'bonus_reports');
      }
    );

    // 6. Listen to /audit_logs
    const qLogs = query(collection(db, 'audit_logs'), where('timestamp', '>=', '0'));
    const unsubLogs = onSnapshot(
      qLogs,
      (snap) => {
        const items: AuditLogItem[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: String(data.id),
              timestamp: String(data.timestamp),
              actorId: String(data.actorId),
              actorName: String(data.actorName),
              actorRole: (data.actorRole as UserRole) || 'employee',
              module: data.module as AuditLogItem['module'],
              action: String(data.action),
              details: String(data.details),
            };
          })
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        setAuditLogs(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'audit_logs');
      }
    );

    return () => {
      unsubProfiles();
      unsubCorpState();
      unsubFleet();
      unsubHof();
      unsubReports();
      unsubLogs();
    };
  }, [mapDocToUserProfile, triggerSyncPulse]);

  // Applications live in a dedicated Firebase project. Seed the owner anchor first (its rules
  // gate staff list on isRootOwnerSeeded), then subscribe. Seeding-then-listening avoids the
  // race where the list query fires before the anchor exists and gets denied with no retry.
  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    seedApplicationsOwnerAnchor()
      .catch((err) => console.warn('Applications anchor seed:', err))
      .finally(() => {
        if (cancelled) return;
        const qApplications = query(
          collection(applicationsDb, 'applications'),
          where('submittedAt', '>=', '0')
        );
        unsub = onSnapshot(
          qApplications,
          (snap) => {
            const items: CandidateApplication[] = snap.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: String(data.id || d.id),
                  nick: String(data.nick || ''),
                  cid: String(data.cid || ''),
                  phone: String(data.phone || ''),
                  discord: String(data.discord || ''),
                  docs: String(data.docs || ''),
                  status: (data.status as ApplicationStatus) || 'pending',
                  submittedAt: String(data.submittedAt || ''),
                  source: String(data.source || ''),
                  reviewedAt: String(data.reviewedAt || ''),
                  reviewerNotes: String(data.reviewerNotes || ''),
                  createdProfileId: String(data.createdProfileId || ''),
                  publicCode: String(data.publicCode || ''),
                  discordVerifiedId: data.discordVerifiedId ? String(data.discordVerifiedId) : undefined,
                  discordVerifiedName: data.discordVerifiedName ? String(data.discordVerifiedName) : undefined,
                };
              })
              .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
            setApplications(items);
            triggerSyncPulse();
          },
          (err) => {
            // Log only: handleFirestoreError() throws, and an error callback that throws turns a
            // recoverable "queue not readable yet" into an uncaught error in the portal.
            console.error('Applications listener:', err);
          }
        );
      });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [triggerSyncPulse]);

  // Keep currentUser synced with live updates from `users`
  useEffect(() => {
    if (!currentUser) return;
    const updated = users.find((u) => u.id === currentUser.id);
    const latestSec = secretsMap[currentUser.id] || secretsMapRef.current[currentUser.id];
    if (updated) {
      setCurrentUser((prev) => {
        if (!prev) return null;
        return {
          ...updated,
          phone:
            latestSec?.phone ||
            (updated.phone !== 'Скрыто (Защита БД)' ? updated.phone : prev.phone),
          discord:
            latestSec?.discord ||
            (updated.discord !== 'Скрыто (Защита БД)' ? updated.discord : prev.discord),
          pin: latestSec?.pin || (updated.pin !== '••••' ? updated.pin : prev.pin),
        };
      });
      return;
    }

    // The roster is live in the cloud and this profile is no longer in it, so the account was
    // deleted by the Owner. Sessions are restored from sessionStorage without re-checking
    // credentials, which makes this the only place able to end a revoked session.
    if (isCloudConnected && currentUser.role !== 'owner') {
      setCurrentUser(null);
      addNotification(
        'Доступ отозван',
        'Ваша учетная запись удалена из реестра персонала APATHY. Сессия завершена.',
        'warning'
      );
    }
  }, [users, secretsMap, currentUser?.id, isCloudConnected]);

  // Presence heartbeat: an open session stamps its own profile, which is what "В сети" means.
  // Chrome throttles background timers to ~1/min, still inside PRESENCE_TTL_MS.
  const heartbeatProfileId = currentUser?.id || '';
  useEffect(() => {
    if (!heartbeatProfileId) return;
    const beat = () => {
      const nowIso = new Date().toISOString();
      updateDoc(doc(db, 'staff_profiles', heartbeatProfileId), {
        lastActive: nowIso,
      }).catch(() => {
        // one lost beat only costs one presence window
      });
      // Public-safe presence beacon: the public site counts these docs for "Сейчас в сети".
      // Doc ID is the opaque profile id, no nicknames or personal data inside.
      setDoc(doc(db, 'public_presence', heartbeatProfileId), { at: nowIso }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, PRESENCE_HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [heartbeatProfileId]);

  useEffect(() => {
    const timer = setInterval(() => setPresenceNow(Date.now()), PRESENCE_HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, []);

  // Mirror of public-safe numbers for Apathy-Corp-Public (block «Корпорация в цифрах»).
  useEffect(() => {
    if (!isCloudConnected || !currentUser) return;
    if (!corpStateLoadedRef.current || !profilesLoadedRef.current) return;
    const mined = financials.totalMined;
    setDoc(doc(db, 'public_stats', 'main'), {
      treasuryBalance: financials.treasuryBalance,
      totalMinedItems: mined.rock + mined.wood + mined.blueFlower + mined.redFlower + mined.pinkFlower,
      staffTotal: users.length,
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  }, [financials, users, isCloudConnected, currentUser]);

  // Load isolated secrets by computed vault ID for current user (and all users if Owner/Admin)
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    async function loadSecrets() {
      const nextMap: Record<
        string,
        { phone: string; discord: string; pin: string; credHash: string }
      > = {};

      const targets =
        currentUser?.role === 'owner' || currentUser?.role === 'admin'
          ? users
          : users.filter((u) => u.id === currentUser?.id);

      for (const u of targets) {
        try {
          const vaultId = computeSecretVaultId(u.id);
          const secSnap = await getDoc(doc(db, 'staff_secrets', vaultId));
          if (secSnap.exists()) {
            const sd = secSnap.data();
            nextMap[u.id] = {
              phone: String(sd.phone || ''),
              discord: String(sd.discord || ''),
              pin: String(sd.pin || ''),
              credHash: String(sd.credHash || ''),
            };
          }
        } catch {
          // ignore if not found
        }
      }
      if (!cancelled && Object.keys(nextMap).length > 0) {
        secretsMapRef.current = { ...secretsMapRef.current, ...nextMap };
        setSecretsMap((prev) => ({ ...prev, ...nextMap }));
        setUsers((prev) =>
          prev.map((u) =>
            nextMap[u.id]
              ? {
                  ...u,
                  phone: nextMap[u.id].phone,
                  discord: nextMap[u.id].discord,
                  pin: nextMap[u.id].pin,
                }
              : u
          )
        );
      }
    }
    loadSecrets();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role, users.length]);

  const addNotification = useCallback(
    (title: string, message: string, type: AppNotification['type'] = 'info') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newNotif: AppNotification = {
        id: notifId,
        timestamp: timeStr,
        title,
        message,
        type,
        read: false,
        actorName: currentUser?.displayName,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 99)]);
      setActiveToastIds((prev) => [...prev, notifId]);

      setTimeout(() => {
        setActiveToastIds((prev) => prev.filter((id) => id !== notifId));
      }, 5000);
    },
    [currentUser?.displayName]
  );

  const addAuditLog = useCallback(
    async (
      module: AuditLogItem['module'],
      action: string,
      details: string,
      actorOverride?: { id: string; name: string; role: UserRole }
    ) => {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const actorId = actorOverride?.id || currentUser?.id || 'u-owner-root';
      const actorName = actorOverride?.name || currentUser?.displayName || 'Система';
      const actorRole = actorOverride?.role || currentUser?.role || 'employee';

      try {
        await setDoc(doc(db, 'audit_logs', logId), {
          id: logId,
          timestamp: timeStr.slice(0, 64),
          actorId: actorId.slice(0, 128),
          actorName: actorName.slice(0, 64),
          actorRole,
          module,
          action: action.slice(0, 120),
          details: details.slice(0, 500),
        });
      } catch (err) {
        console.warn('Audit log write skipped:', err);
      }
    },
    [currentUser]
  );

  const dismissToast = (id: string) => {
    setActiveToastIds((prev) => prev.filter((item) => item !== id));
  };

  // Zero-knowledge login via /auth_hashes/{credHash} (no Google popup needed, works on Vercel/Cloudflare/anywhere!)
  const loginWithCredentials = async (creds: LoginCredentials) => {
    try {
      const inputHash = computeCredentialHash(
        creds.displayName,
        creds.cid,
        creds.phone,
        creds.discord,
        creds.pin
      );

      // Direct point lookup in /auth_hashes/{inputHash} (list is disabled on server!)
      const hashSnap = await getDoc(doc(db, 'auth_hashes', inputHash));
      if (!hashSnap.exists()) {
        return {
          success: false,
          error:
            'Ошибка авторизации: неверные реквизиты (Ник, CID, Телефон, Discord или PIN). Вход разрешён исключительно по данным, зарегистрированным Владельцем.',
        };
      }

      const hashData = hashSnap.data();
      const profileId = String(hashData.profileId);

      const profileSnap = await getDoc(doc(db, 'staff_profiles', profileId));
      if (!profileSnap.exists()) {
        return {
          success: false,
          error: 'Профиль сотрудника не найден в базе данных.',
        };
      }

      const profileData = profileSnap.data();
      let savedSecret = {
        phone: creds.phone.trim(),
        discord: creds.discord.trim(),
        pin: creds.pin.trim(),
        credHash: inputHash,
      };
      try {
        const vaultId = computeSecretVaultId(profileId);
        const secSnap = await getDoc(doc(db, 'staff_secrets', vaultId));
        if (secSnap.exists()) {
          const sd = secSnap.data();
          savedSecret = {
            phone: String(sd.phone || creds.phone.trim()),
            discord: String(sd.discord || creds.discord.trim()),
            pin: String(sd.pin || creds.pin.trim()),
            credHash: String(sd.credHash || inputHash),
          };
        }
      } catch {
        // fallback to entered credentials
      }

      secretsMapRef.current = { ...secretsMapRef.current, [profileId]: savedSecret };
      setSecretsMap((prev) => ({ ...prev, [profileId]: savedSecret }));

      const loggedInUser = mapDocToUserProfile(profileData, savedSecret);

      // Presence starts here: this client keeps stamping lastActive while the tab is open.
      const seenAt = new Date().toISOString();
      try {
        await updateDoc(doc(db, 'staff_profiles', profileId), {
          status: 'on_shift',
          lastActive: seenAt,
        });
        await updateDoc(doc(db, 'corp_state', 'main'), {
          activeWorkersCount: users.filter((u) =>
            u.id === profileId ? true : u.status === 'on_shift'
          ).length,
        });
      } catch {
        // non-blocking
      }

      setCurrentUser({ ...loggedInUser, lastActive: seenAt, status: 'on_shift' });
      addNotification(
        'Успешный вход (Cloud Sync)',
        `Сотрудник ${loggedInUser.displayName} авторизован. Роль: ${ROLE_DEFINITIONS[loggedInUser.role].title}`,
        'success'
      );
      await addAuditLog(
        'users',
        'Вход в систему',
        `${loggedInUser.displayName} [${loggedInUser.cid}] вошел в портал`,
        { id: loggedInUser.id, name: loggedInUser.displayName, role: loggedInUser.role }
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? `Ошибка подключения к облачной БД: ${error.message}`
            : 'Ошибка авторизации.',
      };
    }
  };

  // Zero-knowledge provisioning shared by manual registration and recruitment approval:
  // writes /auth_hashes/{credHash} + /staff_profiles/{id} + /staff_secrets/{vaultId}
  const provisionStaffAccount = async (newUserData: {
    displayName: string;
    cid: string;
    phone: string;
    discord: string;
    pin: string;
    role: UserRole;
    rankNumber?: number;
    department?: string;
    bioNotes?: string;
  }): Promise<{ success: boolean; error?: string; userId?: string }> => {
    const nickClean = newUserData.displayName.trim().slice(0, 64);
    const cidClean = newUserData.cid.trim().toUpperCase().slice(0, 32);
    const phoneClean = newUserData.phone.trim().slice(0, 64);
    const discordClean = newUserData.discord.trim().slice(0, 64);
    const pinClean = newUserData.pin.trim().slice(0, 32);

    if (!nickClean || !cidClean || !phoneClean || !discordClean || !pinClean) {
      return {
        success: false,
        error: 'Все 5 полей (Ник, CID, Телефон, Discord, PIN) обязательны для регистрации сотрудника!',
      };
    }

    const exists = users.some(
      (u) =>
        u.displayName.toLowerCase() === nickClean.toLowerCase() ||
        u.cid.toLowerCase() === cidClean.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'Сотрудник с таким NickName или CID уже существует в базе!' };
    }

    const roleRankMap: Record<UserRole, { num: number; name: string }> = {
      owner: { num: 10, name: 'Владелец / Лидер' },
      admin: { num: 9, name: 'Администратор / Зам' },
      manager: { num: 6, name: 'Менеджер / Логист' },
      hr: { num: 5, name: 'Отдел кадров (HR)' },
      employee: { num: 4, name: 'Сотрудник / Фармер' },
    };

    const rankInfo = roleRankMap[newUserData.role] || { num: 4, name: 'Сотрудник' };
    const newId = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const credHash = computeCredentialHash(nickClean, cidClean, phoneClean, discordClean, pinClean);
    const vaultId = computeSecretVaultId(newId);
    const joinedAt = new Date().toISOString().slice(0, 10);
    const dept = (newUserData.department || (newUserData.role === 'employee' ? 'Цех добычи' : 'Руководство')).slice(0, 64);

    const nextRankNumber = Math.min(MAX_RANK, Math.max(2, newUserData.rankNumber || rankInfo.num));
    const nextRankName = (newUserData.rankNumber && RANK_LADDER[nextRankNumber]) || rankInfo.name;

    try {
      // 1. Write zero-knowledge lookup record in /auth_hashes/{credHash}
      await setDoc(doc(db, 'auth_hashes', credHash), {
        id: credHash,
        profileId: newId,
        role: newUserData.role,
      });

      // 2. Write operational profile in /staff_profiles/{newId} (NO PIN, NO PHONE, NO DISCORD, NO HASH)
      await setDoc(doc(db, 'staff_profiles', newId), {
        id: newId,
        username: nickClean.toLowerCase().replace(/\s+/g, '_').slice(0, 64),
        displayName: nickClean,
        role: newUserData.role,
        cid: cidClean,
        rankNumber: nextRankNumber,
        rankName: nextRankName,
        department: dept,
        walletBalance: 0,
        rock: 0,
        wood: 0,
        blueFlower: 0,
        redFlower: 0,
        pinkFlower: 0,
        totalEarned: 0,
        assignedVehicle: '-',
        status: 'off_duty',
        bioNotes: (newUserData.bioNotes ?? 'Сотрудник зарегистрирован Владельцем корпорации APATHY.').slice(0, 500),
        joinedAt,
        lastActive: 'Не входил',
      });

      // 3. Write isolated PII & PIN in /staff_secrets/{vaultId}
      await setDoc(doc(db, 'staff_secrets', vaultId), {
        id: vaultId,
        profileId: newId,
        phone: phoneClean,
        discord: discordClean,
        pin: pinClean,
        credHash,
      });

      const newSecEntry = { phone: phoneClean, discord: discordClean, pin: pinClean, credHash };
      secretsMapRef.current = { ...secretsMapRef.current, [newId]: newSecEntry };
      setSecretsMap((prev) => ({
        ...prev,
        [newId]: newSecEntry,
      }));

      return { success: true, userId: newId };
    } catch (error) {
      // Log-only: handleFirestoreError() throws, which would swallow the message
      // instead of surfacing it in the HR form.
      console.error('Staff account provisioning failed:', error);
      return {
        success: false,
        error: 'Не удалось сохранить сотрудника в облачную БД (проверьте доступ к Firestore и правила безопасности).',
      };
    }
  };

  // Registration: ONLY by Owner
  const createUserByAdmin = async (newUserData: {
    displayName: string;
    cid: string;
    phone: string;
    discord: string;
    pin: string;
    role: UserRole;
    rankNumber?: number;
    department?: string;
  }) => {
    if (currentUser?.role !== 'owner') {
      return { success: false, error: 'Только Владелец корпорации может регистрировать новые учетные записи!' };
    }

    const result = await provisionStaffAccount(newUserData);
    if (!result.success) return result;

    const nickClean = newUserData.displayName.trim().slice(0, 64);
    const cidClean = newUserData.cid.trim().toUpperCase().slice(0, 32);

    addNotification(
      'Сотрудник создан в облаке',
      `Владелец зарегистрировал сотрудника ${nickClean} [${ROLE_DEFINITIONS[newUserData.role].title}]`,
      'success'
    );
    await addAuditLog(
      'users',
      'Создание учетной записи',
      `Владелец создал профиль ${nickClean} (CID: ${cidClean}, Роль: ${newUserData.role})`
    );

    return { success: true };
  };

  const nowStamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Accepting a public-portal application creates the staff account with the PIN typed here
  const approveCandidateApplication = async (
    appId: string,
    credentials: { pin: string; role: UserRole; department?: string }
  ) => {
    if (currentUser?.role !== 'owner') {
      return { success: false, error: 'Принимать заявки может только Владелец корпорации!' };
    }

    const app = applications.find((a) => a.id === appId);
    if (!app) return { success: false, error: 'Заявка не найдена в базе данных.' };
    if (app.status !== 'pending') {
      return { success: false, error: 'Заявка уже обработана ранее.' };
    }

    const role: UserRole = credentials.role === 'owner' ? 'employee' : credentials.role;

    const provisioned = await provisionStaffAccount({
      displayName: app.nick,
      cid: app.cid,
      phone: app.phone,
      discord: app.discord,
      pin: credentials.pin,
      role,
      department: credentials.department,
      bioNotes: `Принят по заявке с публичного сайта APATHY (${app.submittedAt.slice(0, 10)}). CID подтверждён кандидатом.`,
    });
    if (!provisioned.success || !provisioned.userId) return provisioned;

    const newUserId = provisioned.userId;

    try {
      await updateDoc(doc(applicationsDb, 'applications', appId), {
        status: 'approved',
        reviewedAt: nowStamp(),
        createdProfileId: newUserId,
      });
    } catch (error) {
      console.error('Application approve status update failed:', error);
      return {
        success: false,
        error: `Учетная запись создана, но статус заявки не обновился в БД. Повторно заявку не принимайте.`,
      };
    }

    await addAuditLog(
      'recruitment',
      'Заявка одобрена',
      `Владелец принял кандидата ${app.nick} (CID: ${app.cid}) с публичного сайта и создал учетную запись ${newUserId}`
    );
    addNotification(
      'Заявка принята',
      `${app.nick} [${ROLE_DEFINITIONS[role].title}] зачислен в штат, реквизиты для входа созданы`,
      'success'
    );

    return { success: true };
  };

  const rejectCandidateApplication = async (appId: string, reason: string) => {
    if (currentUser?.role !== 'owner') {
      return { success: false, error: 'Отклонять заявки может только Владелец корпорации!' };
    }

    const app = applications.find((a) => a.id === appId);
    if (!app) return { success: false, error: 'Заявка не найдена в базе данных.' };
    if (app.status !== 'pending') {
      return { success: false, error: 'Заявка уже обработана ранее.' };
    }

    const noteClean = (reason.trim() || 'Отклонено без комментария.').slice(0, 500);

    try {
      await updateDoc(doc(applicationsDb, 'applications', appId), {
        status: 'rejected',
        reviewedAt: nowStamp(),
        reviewerNotes: noteClean,
      });
    } catch (error) {
      console.error('Application reject status update failed:', error);
      return { success: false, error: 'Не удалось обновить статус заявки в облачной БД.' };
    }

    await addAuditLog(
      'recruitment',
      'Заявка отклонена',
      `Владелец отклонил заявку ${app.nick} (CID: ${app.cid}): ${noteClean}`
    );
    addNotification('Заявка отклонена', `Кандидат ${app.nick} [${app.cid}] получил отказ`, 'warning');

    return { success: true };
  };

  const updateUserCredentialsByOwner = async (
    userId: string,
    updates: {
      role?: UserRole;
      pin?: string;
      rankNumber?: number;
      rankName?: string;
      department?: string;
      phone?: string;
      discord?: string;
      displayName?: string;
      cid?: string;
    }
  ) => {
    if (currentUser?.role !== 'owner') return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const vaultId = computeSecretVaultId(userId);
    let currentSec = secretsMapRef.current[userId] || secretsMap[userId];
    if (!currentSec) {
      const secSnap = await getDoc(doc(db, 'staff_secrets', vaultId));
      if (secSnap.exists()) {
        const sd = secSnap.data();
        currentSec = {
          phone: String(sd.phone || ''),
          discord: String(sd.discord || ''),
          pin: String(sd.pin || ''),
          credHash: String(sd.credHash || ''),
        };
      } else {
        currentSec = {
          phone: target.phone,
          discord: target.discord,
          pin: target.pin,
          credHash: computeCredentialHash(
            target.displayName,
            target.cid,
            target.phone,
            target.discord,
            target.pin
          ),
        };
      }
    }

    const nextDisplayName = (updates.displayName ?? target.displayName).trim().slice(0, 64);
    const nextCid = (updates.cid ?? target.cid).trim().toUpperCase().slice(0, 32);
    const nextPhone = (updates.phone ?? currentSec.phone).trim().slice(0, 64);
    const nextDiscord = (updates.discord ?? currentSec.discord).trim().slice(0, 64);
    const nextPin = (updates.pin ?? currentSec.pin).trim().slice(0, 32);
    const nextRole = updates.role ?? target.role;
    const nextRankNumber = Math.min(MAX_RANK, Math.max(2, updates.rankNumber ?? target.rankNumber));
    // Смена ранга подтягивает название с лестницы, если Владелец не ввёл своё.
    const nextRankName =
      (updates.rankName ??
        (updates.rankNumber !== undefined && updates.rankNumber !== target.rankNumber
          ? RANK_LADDER[nextRankNumber]
          : undefined) ??
        target.rankName).slice(0, 64);
    const nextDepartment = (updates.department ?? target.department).slice(0, 64);

    const nextCredHash = computeCredentialHash(
      nextDisplayName,
      nextCid,
      nextPhone,
      nextDiscord,
      nextPin
    );

    try {
      // Ensure root anchor hash always exists so isRootOwnerSeeded() in rules never breaks
      const rootAnchorRef = doc(db, 'auth_hashes', ROOT_OWNER_HASH);
      const rootAnchorSnap = await getDoc(rootAnchorRef);
      if (!rootAnchorSnap.exists()) {
        await setDoc(rootAnchorRef, {
          id: ROOT_OWNER_HASH,
          profileId: 'u-owner-root',
          role: 'owner',
        });
      }

      // Create new hash FIRST before deleting old hash, and never delete ROOT_OWNER_HASH
      await setDoc(doc(db, 'auth_hashes', nextCredHash), {
        id: nextCredHash,
        profileId: target.id,
        role: nextRole,
      });

      if (
        currentSec.credHash &&
        currentSec.credHash !== nextCredHash &&
        currentSec.credHash !== ROOT_OWNER_HASH
      ) {
        try {
          await deleteDoc(doc(db, 'auth_hashes', currentSec.credHash));
        } catch {
          // ignore if old hash didn't exist
        }
      }

      const nextSecEntry = {
        phone: nextPhone,
        discord: nextDiscord,
        pin: nextPin,
        credHash: nextCredHash,
      };
      secretsMapRef.current = { ...secretsMapRef.current, [userId]: nextSecEntry };
      setSecretsMap((prev) => ({
        ...prev,
        [userId]: nextSecEntry,
      }));

      await setDoc(doc(db, 'staff_profiles', userId), {
        id: target.id,
        username: target.username,
        displayName: nextDisplayName,
        role: nextRole,
        cid: nextCid,
        rankNumber: nextRankNumber,
        rankName: nextRankName,
        department: nextDepartment,
        walletBalance: target.walletBalance,
        rock: target.farmStats.rock,
        wood: target.farmStats.wood,
        blueFlower: target.farmStats.blueFlower,
        redFlower: target.farmStats.redFlower,
        pinkFlower: target.farmStats.pinkFlower,
        totalEarned: target.farmStats.totalEarned,
        assignedVehicle: target.assignedVehicle || '-',
        status: target.status,
        bioNotes: target.bioNotes || '',
        joinedAt: target.joinedAt,
        lastActive: target.lastActive,
      });

      await setDoc(doc(db, 'staff_secrets', vaultId), {
        id: vaultId,
        profileId: target.id,
        phone: nextPhone,
        discord: nextDiscord,
        pin: nextPin,
        credHash: nextCredHash,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                displayName: nextDisplayName,
                cid: nextCid,
                phone: nextPhone,
                discord: nextDiscord,
                pin: nextPin,
                role: nextRole,
                rankNumber: nextRankNumber,
                rankName: nextRankName,
                department: nextDepartment,
              }
            : u
        )
      );

      await addAuditLog(
        'users',
        'Изменение профиля сотрудника',
        `Владелец изменил параметры ${target.displayName}: ${Object.keys(updates).join(', ')}`
      );
      addNotification('Профиль обновлен', `Владелец обновил данные сотрудника ${target.displayName}`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_profiles/${userId}`);
    }
  };

  const deleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'owner') return;

    const vaultId = computeSecretVaultId(userId);
    const sec = secretsMap[userId];

    try {
      if (sec?.credHash) {
        await deleteDoc(doc(db, 'auth_hashes', sec.credHash));
      }
      await deleteDoc(doc(db, 'staff_profiles', userId));
      await deleteDoc(doc(db, 'staff_secrets', vaultId));
      // Доска Почёта не должна хранить удалённого сотрудника: пересобираем ТОП-3 из оставшихся.
      await syncHallOfFameAuto(users.filter((u) => u.id !== userId));
      await addAuditLog('users', 'Удаление сотрудника', `Удален профиль ${target.displayName} [${target.cid}]`);
      addNotification('Сотрудник удален', `Учетная запись ${target.displayName} удалена из облачной БД.`, 'warning');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff_profiles/${userId}`);
    }
  };

  const logoutStaff = async () => {
    if (!currentUser) return;

    addAuditLog('users', 'Выход из системы', `${currentUser.displayName} вышел из сессии`);
    try {
      await updateDoc(doc(db, 'staff_profiles', currentUser.id), {
        status: 'off_duty',
        lastActive: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'corp_state', 'main'), {
        activeWorkersCount: users.filter(
          (u) => u.status === 'on_shift' && u.id !== currentUser.id
        ).length,
      });
    } catch {
      // A dropped write only delays the badge: the heartbeat stops, so presence expires anyway.
    }

    setCurrentUser(null);
  };

  const saveFullStaffProfileDoc = async (u: UserProfile) => {
    await setDoc(doc(db, 'staff_profiles', u.id), {
      id: u.id,
      username: u.username.slice(0, 64),
      displayName: u.displayName.slice(0, 64),
      role: u.role,
      cid: u.cid.slice(0, 32),
      rankNumber: u.rankNumber,
      rankName: u.rankName.slice(0, 64),
      department: u.department.slice(0, 64),
      walletBalance: Math.max(0, u.walletBalance),
      rock: Math.max(0, u.farmStats.rock),
      wood: Math.max(0, u.farmStats.wood),
      blueFlower: Math.max(0, u.farmStats.blueFlower),
      redFlower: Math.max(0, u.farmStats.redFlower),
      pinkFlower: Math.max(0, u.farmStats.pinkFlower),
      totalEarned: Math.max(0, u.farmStats.totalEarned),
      assignedVehicle: (u.assignedVehicle || '-').slice(0, 120),
      status: u.status,
      bioNotes: (u.bioNotes || '').slice(0, 500),
      joinedAt: u.joinedAt.slice(0, 32),
      lastActive: u.lastActive.slice(0, 64),
    });
  };

  const saveFullCorpStateDoc = async (fin: CorporationFinancials) => {
    await setDoc(doc(db, 'corp_state', 'main'), {
      treasuryBalance: Math.max(0, fin.treasuryBalance),
      weeklyGain: Math.max(0, fin.weeklyGain),
      rock: Math.max(0, fin.totalMined.rock),
      wood: Math.max(0, fin.totalMined.wood),
      blueFlower: Math.max(0, fin.totalMined.blueFlower),
      redFlower: Math.max(0, fin.totalMined.redFlower),
      pinkFlower: Math.max(0, fin.totalMined.pinkFlower),
      totalEarned: Math.max(0, fin.totalMined.totalEarned),
      activeWorkersCount: Math.max(0, fin.activeWorkersCount),
      radioFrequency: (fin.radioFrequency || '104.2 MHz').slice(0, 64),
    });
  };

  // Авто-топ-3: сортирует всех по заработку и перезаписывает hall_of_fame детерминированными
  // id (place-1..3). Легаси-доки (hof-1..3 из сид-данных) удаляются, чтобы публичка читала
  // ровно один актуальный состав лидеров.
  const syncHallOfFameAuto = async (nextUsers: UserProfile[]) => {
    const ranked = [...nextUsers].sort(
      (a, b) => (b.farmStats?.totalEarned || 0) - (a.farmStats?.totalEarned || 0)
    );

    const nextBoard: HallOfFameEntry[] = ([1, 2, 3] as const).map((place) => {
      const u = ranked[place - 1];
      const fs = u?.farmStats;
      return {
        id: `place-${place}`,
        place,
        nickname: u ? u.displayName.slice(0, 64) : 'none',
        cid: u ? (u.cid || '-').slice(0, 32) : '-',
        rankTitle: u ? `${u.rankName} [${u.rankNumber}]`.slice(0, 64) : '-',
        totalMined: fs ? fs.rock + fs.wood + fs.blueFlower + fs.redFlower + fs.pinkFlower : 0,
        bonusReward: fs ? Math.max(0, fs.totalEarned) : 0,
      };
    });

    const legacyIds = hallOfFame.filter((h) => !h.id.startsWith('place-')).map((h) => h.id);

    try {
      await Promise.all([
        ...nextBoard.map((entry) => setDoc(doc(db, 'hall_of_fame', entry.id), entry)),
        ...legacyIds.map((legacyId) => deleteDoc(doc(db, 'hall_of_fame', legacyId))),
      ]);
      setHallOfFame(nextBoard);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'hall_of_fame');
    }
  };

  const recordFarmSubmission = async (
    userId: string,
    items: {
      rock: number;
      wood: number;
      blueFlower: number;
      redFlower: number;
      pinkFlower: number;
    }
  ) => {
    if (!currentUser) return;
    if (!ROLE_DEFINITIONS[currentUser.role].permissions.canEditStaffFarm) return;

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const grandTotal =
      items.rock * RESOURCE_PRICES.rock +
      items.wood * RESOURCE_PRICES.wood +
      items.blueFlower * RESOURCE_PRICES.blueFlower +
      items.redFlower * RESOURCE_PRICES.redFlower +
      items.pinkFlower * RESOURCE_PRICES.pinkFlower;

    if (grandTotal <= 0) return;

    const driverCut = grandTotal;
    const treasuryCut = grandTotal;

    const updatedUser: UserProfile = {
      ...targetUser,
      walletBalance: targetUser.walletBalance + driverCut,
      farmStats: {
        rock: targetUser.farmStats.rock + items.rock,
        wood: targetUser.farmStats.wood + items.wood,
        blueFlower: targetUser.farmStats.blueFlower + items.blueFlower,
        redFlower: targetUser.farmStats.redFlower + items.redFlower,
        pinkFlower: targetUser.farmStats.pinkFlower + items.pinkFlower,
        totalEarned: targetUser.farmStats.totalEarned + driverCut,
      },
    };

    const updatedFin: CorporationFinancials = {
      ...financials,
      treasuryBalance: financials.treasuryBalance + treasuryCut,
      weeklyGain: financials.weeklyGain + treasuryCut,
      totalMined: {
        rock: financials.totalMined.rock + items.rock,
        wood: financials.totalMined.wood + items.wood,
        blueFlower: financials.totalMined.blueFlower + items.blueFlower,
        redFlower: financials.totalMined.redFlower + items.redFlower,
        pinkFlower: financials.totalMined.pinkFlower + items.pinkFlower,
        totalEarned: financials.totalMined.totalEarned + grandTotal,
      },
    };

    try {
      await saveFullStaffProfileDoc(updatedUser);
      await saveFullCorpStateDoc(updatedFin);
      await syncHallOfFameAuto(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

      await addAuditLog(
        'farm',
        'Начисление добычи',
        `${targetUser.displayName}: начислено [Порода: ${items.rock}, Дерево: ${items.wood}, Цветы: ${items.blueFlower + items.redFlower + items.pinkFlower}]. Начислено рабочему по прайсу: +$${driverCut.toLocaleString()}`
      );
      addNotification(
        'Добыча начислена',
        `${targetUser.displayName} начислено +$${driverCut.toLocaleString()} по фиксированному прайсу`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_profiles/${userId}`);
    }
  };

  const updateStaffFarmStats = async (
    userId: string,
    exactStats: {
      rock: number;
      wood: number;
      blueFlower: number;
      redFlower: number;
      pinkFlower: number;
      walletBalance: number;
    }
  ) => {
    if (!currentUser) return;
    if (!ROLE_DEFINITIONS[currentUser.role].permissions.canEditStaffFarm) return;

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const newFarmStats: FarmStats = {
      rock: Math.max(0, exactStats.rock),
      wood: Math.max(0, exactStats.wood),
      blueFlower: Math.max(0, exactStats.blueFlower),
      redFlower: Math.max(0, exactStats.redFlower),
      pinkFlower: Math.max(0, exactStats.pinkFlower),
      totalEarned: Math.max(0, exactStats.walletBalance),
    };

    const updatedUser: UserProfile = {
      ...targetUser,
      walletBalance: Math.max(0, exactStats.walletBalance),
      farmStats: newFarmStats,
    };

    try {
      await saveFullStaffProfileDoc(updatedUser);
      await syncHallOfFameAuto(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      await addAuditLog(
        'farm',
        'Корректировка добычи сотрудника',
        `${currentUser.displayName} изменил добычу ${targetUser.displayName}: Порода=${newFarmStats.rock}, Дерево=${newFarmStats.wood}, Цветы=${newFarmStats.blueFlower + newFarmStats.redFlower + newFarmStats.pinkFlower}, Баланс=$${exactStats.walletBalance.toLocaleString()}`
      );
      addNotification(
        'Добыча обновлена',
        `Обновлены показатели добычи для сотрудника ${targetUser.displayName}`,
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_profiles/${userId}`);
    }
  };

  const updateStaffVehicleAndNotes = async (
    userId: string,
    updates: {
      assignedVehicle?: string;
      bioNotes?: string;
    }
  ) => {
    if (!currentUser) return;
    if (!ROLE_DEFINITIONS[currentUser.role].permissions.canEditStaffVehicleAndNotes) return;

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const updatedUser: UserProfile = {
      ...targetUser,
      ...(updates.assignedVehicle !== undefined ? { assignedVehicle: updates.assignedVehicle } : {}),
      ...(updates.bioNotes !== undefined ? { bioNotes: updates.bioNotes } : {}),
    };

    try {
      await saveFullStaffProfileDoc(updatedUser);
      await addAuditLog(
        'profile',
        'Закрепление транспорта / заметок',
        `${currentUser.displayName} обновил у ${targetUser.displayName}: ${
          updates.assignedVehicle !== undefined ? `Транспорт: ${updates.assignedVehicle} ` : ''
        }${updates.bioNotes !== undefined ? `Заметки обновлены` : ''}`
      );
      addNotification(
        'Данные сотрудника обновлены',
        `Обновлен транспорт/заметки для ${targetUser.displayName}`,
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_profiles/${userId}`);
    }
  };

  const submitBonusReport = async (data: { requestedAmount: number; comment: string }) => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 16);
    const reportId = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const rock = currentUser.farmStats?.rock || 0;
    const wood = currentUser.farmStats?.wood || 0;
    const blueFlower = currentUser.farmStats?.blueFlower || 0;
    const redFlower = currentUser.farmStats?.redFlower || 0;
    const pinkFlower = currentUser.farmStats?.pinkFlower || 0;
    const totalMinedItems = rock + wood + blueFlower + redFlower + pinkFlower;
    const reqAmount = Math.max(0, data.requestedAmount);
    const commentClean = (data.comment.trim() || 'Прошу рассмотреть мою выработку для премирования.').slice(0, 500);

    try {
      await setDoc(doc(db, 'bonus_reports', reportId), {
        id: reportId,
        userId: currentUser.id,
        nickname: currentUser.displayName.slice(0, 64),
        cid: currentUser.cid.slice(0, 32),
        rankTitle: `[${String(currentUser.rankNumber).padStart(2, '0')}] ${currentUser.rankName}`.slice(0, 64),
        rock,
        wood,
        blueFlower,
        redFlower,
        pinkFlower,
        totalMinedItems,
        requestedAmount: reqAmount,
        comment: commentClean,
        createdAt: timeStr,
        status: 'pending',
      });

      await addAuditLog(
        'bonus_report',
        'Подан рапорт на премию',
        `${currentUser.displayName} [${currentUser.cid}] подал рапорт на сумму $${reqAmount.toLocaleString()} (Сдано: ${totalMinedItems} шт.)`
      );
      addNotification(
        'Новый рапорт на премирование',
        `${currentUser.displayName} (CID: ${currentUser.cid}) подал рапорт Владельцу на премию $${reqAmount.toLocaleString()}`,
        'info'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `bonus_reports/${reportId}`);
    }
  };

  const reviewBonusReport = async (reportId: string, status: BonusReportStatus) => {
    if (currentUser?.role !== 'owner') return;
    const report = bonusReports.find((r) => r.id === reportId);
    if (!report) return;

    try {
      await updateDoc(doc(db, 'bonus_reports', reportId), { status });

      // «Засчитано» — единственное состояние, которое реально проводит деньги:
      // премия приходит сотруднику и списывается из казны. «Одобрено» — просто отметка.
      if (status === 'counted' && report.requestedAmount > 0) {
        const targetUser = users.find((u) => u.id === report.userId);
        if (targetUser) {
          await saveFullStaffProfileDoc({
            ...targetUser,
            walletBalance: targetUser.walletBalance + report.requestedAmount,
          });
        }
        await saveFullCorpStateDoc({
          ...financials,
          treasuryBalance: Math.max(0, financials.treasuryBalance - report.requestedAmount),
        });
      }

      const verdict =
        status === 'counted'
          ? 'Рапорт на премию засчитан'
          : status === 'approved'
          ? 'Рапорт на премию одобрен'
          : 'Рапорт на премию отклонён';
      await addAuditLog(
        'bonus_report',
        verdict,
        `Владелец ${
          status === 'counted' ? 'засчитал' : status === 'approved' ? 'одобрил' : 'отклонил'
        } рапорт ${report.nickname} на сумму $${report.requestedAmount.toLocaleString()}${
          status === 'counted' ? ' (премия выплачена из казны)' : ''
        }`
      );
      addNotification(
        status === 'counted' ? 'Рапорт засчитан' : status === 'approved' ? 'Рапорт одобрен' : 'Рапорт отклонён',
        `Рапорт сотрудника ${report.nickname} переведён в статус «${
          status === 'counted' ? 'Одобрено и засчитано' : status === 'approved' ? 'Одобрено' : 'Отклонено'
        }»`,
        status === 'rejected' ? 'warning' : 'success'
      );
    } catch (error) {
      addNotification(
        'Не удалось провести рапорт',
        'Firestore отклонил запись. Скорее всего, актуальные правила безопасности (firestore.rules) ещё не опубликованы в консоли Firebase для базы ai-studio-apathyrp… — опубликуй их и попробуй снова.',
        'alert'
      );
      handleFirestoreError(error, OperationType.UPDATE, `bonus_reports/${reportId}`);
    }
  };

  const deleteBonusReport = async (reportId: string) => {
    if (currentUser?.role !== 'owner') return;
    try {
      await deleteDoc(doc(db, 'bonus_reports', reportId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bonus_reports/${reportId}`);
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const target = users.find((u) => u.id === userId) || currentUser;

    const vaultId = computeSecretVaultId(userId);
    let currentSec = secretsMapRef.current[userId] || secretsMap[userId];
    if (!currentSec) {
      try {
        const secSnap = await getDoc(doc(db, 'staff_secrets', vaultId));
        if (secSnap.exists()) {
          const sd = secSnap.data();
          currentSec = {
            phone: String(sd.phone || ''),
            discord: String(sd.discord || ''),
            pin: String(sd.pin || ''),
            credHash: String(sd.credHash || ''),
          };
        }
      } catch {
        // fallback below
      }
    }
    if (!currentSec) {
      currentSec = {
        phone: target.phone !== 'Скрыто (Защита БД)' ? target.phone : currentUser.phone,
        discord: target.discord !== 'Скрыто (Защита БД)' ? target.discord : currentUser.discord,
        pin: target.pin !== '••••' ? target.pin : currentUser.pin,
        credHash: computeCredentialHash(
          target.displayName,
          target.cid,
          target.phone !== 'Скрыто (Защита БД)' ? target.phone : currentUser.phone,
          target.discord !== 'Скрыто (Защита БД)' ? target.discord : currentUser.discord,
          target.pin !== '••••' ? target.pin : currentUser.pin
        ),
      };
    }

    const nextPhone = (updates.phone ?? currentSec.phone).trim().slice(0, 64) || currentSec.phone;
    const nextDiscord =
      (updates.discord ?? currentSec.discord).trim().slice(0, 64) || currentSec.discord;
    const nextPin = currentSec.pin;
    const canEditVehAndNotes =
      ROLE_DEFINITIONS[currentUser.role].permissions.canEditStaffVehicleAndNotes;
    const nextAssignedVehicle =
      canEditVehAndNotes && updates.assignedVehicle !== undefined
        ? updates.assignedVehicle
        : target.assignedVehicle || '-';
    const nextBioNotes =
      canEditVehAndNotes && updates.bioNotes !== undefined
        ? updates.bioNotes
        : target.bioNotes || '';

    const nextCredHash = computeCredentialHash(
      target.displayName,
      target.cid,
      nextPhone,
      nextDiscord,
      nextPin
    );

    try {
      // Ensure ROOT_OWNER_HASH anchor always exists so rules validation succeeds
      const rootAnchorRef = doc(db, 'auth_hashes', ROOT_OWNER_HASH);
      const rootAnchorSnap = await getDoc(rootAnchorRef);
      if (!rootAnchorSnap.exists()) {
        await setDoc(rootAnchorRef, {
          id: ROOT_OWNER_HASH,
          profileId: 'u-owner-root',
          role: 'owner',
        });
      }

      // Create new login hash first, and never delete ROOT_OWNER_HASH
      await setDoc(doc(db, 'auth_hashes', nextCredHash), {
        id: nextCredHash,
        profileId: target.id,
        role: target.role,
      });

      if (
        currentSec.credHash &&
        currentSec.credHash !== nextCredHash &&
        currentSec.credHash !== ROOT_OWNER_HASH
      ) {
        try {
          await deleteDoc(doc(db, 'auth_hashes', currentSec.credHash));
        } catch {
          // ignore
        }
      }

      const nextSecEntry = {
        phone: nextPhone,
        discord: nextDiscord,
        pin: nextPin,
        credHash: nextCredHash,
      };
      secretsMapRef.current = { ...secretsMapRef.current, [userId]: nextSecEntry };
      setSecretsMap((prev) => ({
        ...prev,
        [userId]: nextSecEntry,
      }));

      await setDoc(doc(db, 'staff_secrets', vaultId), {
        id: vaultId,
        profileId: target.id,
        phone: nextPhone,
        discord: nextDiscord,
        pin: nextPin,
        credHash: nextCredHash,
      });

      const updatedProfileObj: UserProfile = {
        ...target,
        phone: nextPhone,
        discord: nextDiscord,
        pin: nextPin,
        assignedVehicle: nextAssignedVehicle,
        bioNotes: nextBioNotes,
      };

      await saveFullStaffProfileDoc(updatedProfileObj);

      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedProfileObj : u)));
      if (currentUser.id === userId) {
        setCurrentUser(updatedProfileObj);
      }

      await addAuditLog(
        'profile',
        'Обновление личных реквизитов',
        `${currentUser.displayName} обновил рабочие реквизиты (Тел: ${nextPhone}, Discord: ${nextDiscord})`
      );
      addNotification('Реквизиты сохранены', 'Рабочие реквизиты успешно сохранены в БД!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_profiles/${userId}`);
    }
  };

  const updateFinancialsData = async (updates: Partial<CorporationFinancials>) => {
    if (!currentUser) return;
    if (!ROLE_DEFINITIONS[currentUser.role].permissions.canEditAnalytics) return;

    const nextFin: CorporationFinancials = {
      ...financials,
      ...updates,
      totalMined: updates.totalMined
        ? { ...financials.totalMined, ...updates.totalMined }
        : financials.totalMined,
    };

    try {
      await saveFullCorpStateDoc(nextFin);
      await addAuditLog(
        'treasury',
        'Редактирование аналитики/KPI',
        `${currentUser.displayName} обновил показатели аналитики`
      );
      addNotification(
        'Аналитика обновлена',
        `${currentUser.displayName} обновил показатели корпоративной аналитики`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'corp_state/main');
    }
  };

  const adjustTreasury = async (deltaAmount: number, reason: string) => {
    if (currentUser?.role !== 'owner') return;
    const newBal = Math.max(0, financials.treasuryBalance + deltaAmount);
    const nextFin: CorporationFinancials = {
      ...financials,
      treasuryBalance: newBal,
      weeklyGain: deltaAmount > 0 ? financials.weeklyGain + deltaAmount : financials.weeklyGain,
    };

    try {
      await saveFullCorpStateDoc(nextFin);
      await addAuditLog(
        'treasury',
        deltaAmount >= 0 ? 'Пополнение казны' : 'Списание из казны',
        `Сумма: ${deltaAmount >= 0 ? '+' : ''}$${deltaAmount.toLocaleString()} (${reason})`
      );
      addNotification(
        'Движение казны',
        `${deltaAmount >= 0 ? 'Пополнение' : 'Списание'}: $${Math.abs(deltaAmount).toLocaleString()}. Причина: ${reason}`,
        deltaAmount >= 0 ? 'success' : 'alert'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'corp_state/main');
    }
  };

  const updateHallOfFameWinner = async (entryId: string, updates: Partial<HallOfFameEntry>) => {
    const existingEntry = hallOfFame.find((h) => h.id === entryId);
    if (!existingEntry) return;
    const nextEntry: HallOfFameEntry = { ...existingEntry, ...updates };

    try {
      await setDoc(doc(db, 'hall_of_fame', entryId), {
        id: nextEntry.id,
        place: nextEntry.place,
        nickname: (nextEntry.nickname || 'none').slice(0, 64),
        cid: (nextEntry.cid || '-').slice(0, 32),
        rankTitle: (nextEntry.rankTitle || '-').slice(0, 64),
        totalMined: Math.max(0, nextEntry.totalMined),
        bonusReward: Math.max(0, nextEntry.bonusReward),
      });
      await addAuditLog('hall_of_fame', 'Изменение Доски Почёта', `Место #${nextEntry.place}: ${nextEntry.nickname}`);
      addNotification('Доска Почёта обновлена', 'Данные лидеров обновлены в облаке.', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hall_of_fame/${entryId}`);
    }
  };

  const updateVehicleStatus = async (vehicleId: string, status: VehicleStatus) => {
    const target = fleet.find((v) => v.id === vehicleId);
    if (!target) return;

    const nextVeh: VehicleItem = { ...target, status };

    try {
      await setDoc(doc(db, 'fleet', vehicleId), nextVeh);
      await addAuditLog('fleet', 'Статус авто изменен', `${target.modelName} [${target.plate}] -> ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fleet/${vehicleId}`);
    }
  };

  const updateVehiclePublicFields = async (
    vehicleId: string,
    updates: { publicVisible?: boolean; publicImage?: string; publicDesc?: string }
  ) => {
    const target = fleet.find((v) => v.id === vehicleId);
    if (!target) return;

    const nextVeh: VehicleItem = { ...target, ...updates };

    try {
      await setDoc(doc(db, 'fleet', vehicleId), nextVeh);
      await addAuditLog('fleet', 'Публичная карточка авто', `${target.modelName} [${target.plate}]`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fleet/${vehicleId}`);
    }
  };

  const updateVehicleFields = async (
    vehicleId: string,
    updates: {
      modelName?: string;
      plate?: string;
      trunkKg?: number;
      slot?: string;
      rankRequired?: string;
    }
  ) => {
    const target = fleet.find((v) => v.id === vehicleId);
    if (!target) return;

    const nextVeh: VehicleItem = {
      ...target,
      ...(updates.modelName !== undefined
        ? { modelName: updates.modelName.trim().slice(0, 80) || target.modelName }
        : {}),
      ...(updates.plate !== undefined ? { plate: updates.plate.trim().slice(0, 32) || target.plate } : {}),
      ...(updates.trunkKg !== undefined ? { trunkKg: Math.max(0, updates.trunkKg) } : {}),
      ...(updates.slot !== undefined ? { slot: updates.slot.trim().slice(0, 64) || target.slot } : {}),
      ...(updates.rankRequired !== undefined
        ? { rankRequired: updates.rankRequired.trim().slice(0, 64) || target.rankRequired }
        : {}),
    };

    try {
      await setDoc(doc(db, 'fleet', vehicleId), nextVeh);
      // Закреплённые ярлыки в профилях сотрудников хранят строку "Модель [Номер]".
      const oldLabel = `${target.modelName} [${target.plate}]`;
      const newLabel = `${nextVeh.modelName} [${nextVeh.plate}]`;
      if (oldLabel !== newLabel) {
        for (const u of users) {
          if (u.assignedVehicle === oldLabel) {
            await saveFullStaffProfileDoc({ ...u, assignedVehicle: newLabel });
          }
        }
      }
      await addAuditLog('fleet', 'Редактирование авто', `${nextVeh.modelName} [${nextVeh.plate}]`);
      addNotification('Транспорт обновлён', `${nextVeh.modelName} [${nextVeh.plate}] сохранён`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fleet/${vehicleId}`);
    }
  };

  const addVehicle = async (newVehicle: Omit<VehicleItem, 'id'>) => {
    const vehId = `veh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const item: VehicleItem = {
      id: vehId,
      modelName: newVehicle.modelName.slice(0, 80),
      category: newVehicle.category.slice(0, 80),
      trunkKg: Math.max(0, newVehicle.trunkKg),
      rankRequired: newVehicle.rankRequired.slice(0, 64),
      slot: newVehicle.slot.slice(0, 64),
      status: newVehicle.status,
      fuelPercent: Math.min(100, Math.max(0, newVehicle.fuelPercent)),
      plate: newVehicle.plate.slice(0, 32),
      publicVisible: true,
      publicImage: '',
      publicDesc: '',
    };

    try {
      await setDoc(doc(db, 'fleet', vehId), item);
      await addAuditLog('fleet', 'Добавлен транспорт', `${item.modelName} [${item.plate}]`);
      addNotification('Транспорт добавлен', `${item.modelName} [${item.plate}] добавлен в автопарк`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `fleet/${vehId}`);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    const targetVeh = fleet.find((v) => v.id === vehicleId);
    try {
      await deleteDoc(doc(db, 'fleet', vehicleId));
      if (targetVeh) {
        const label = `${targetVeh.modelName} [${targetVeh.plate}]`;
        for (const u of users) {
          if (u.assignedVehicle === label) {
            await saveFullStaffProfileDoc({ ...u, assignedVehicle: '-' });
          }
        }
      }
      await addAuditLog('fleet', 'Удаление авто', `Удален транспорт ${targetVeh?.modelName || vehicleId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `fleet/${vehicleId}`);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setActiveToastIds([]);
  };

  const resetDatabaseToDefault = () => {
    setCurrentUser(null);
  };

  return (
    <DatabaseContext.Provider
      value={{
        users,
        fleet,
        hallOfFame,
        financials,
        auditLogs,
        notifications,
        bonusReports,
        applications,
        activeToastIds,
        isCloudConnected,
        currentUser,
        currentRole: currentUser?.role || null,
        lastSyncedAt,
        syncEventCount,
        presenceNow,
        isArchitectureModalOpen,
        openArchitectureModal: () => setIsArchitectureModalOpen(true),
        closeArchitectureModal: () => setIsArchitectureModalOpen(false),
        loginWithCredentials,
        createUserByAdmin,
        updateUserCredentialsByOwner,
        deleteUser,
        logoutStaff,
        approveCandidateApplication,
        rejectCandidateApplication,
        recordFarmSubmission,
        updateStaffFarmStats,
        updateStaffVehicleAndNotes,
        submitBonusReport,
        reviewBonusReport,
        deleteBonusReport,
        updateUserProfile,
        updateFinancialsData,
        adjustTreasury,
        updateHallOfFameWinner,
        updateVehicleStatus,
        updateVehiclePublicFields,
        updateVehicleFields,
        addVehicle,
        deleteVehicle,
        markNotificationAsRead,
        dismissToast,
        clearAllNotifications,
        resetDatabaseToDefault,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
