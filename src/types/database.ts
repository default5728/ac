export type UserRole = 'owner' | 'admin' | 'manager' | 'hr' | 'employee';

export interface UserRoleInfo {
  role: UserRole;
  title: string;
  badgeColor: string;
  permissions: {
    canManageRoles: boolean;
    canEditTreasury: boolean;
    canAccessPublicApi: boolean;
    canManageUsers: boolean;
    canViewHrSection: boolean;
    canEditFleet: boolean;
    canEditHallOfFame: boolean;
    canEditAnalytics: boolean;
    canEditStaffFarm: boolean;
    canEditStaffVehicleAndNotes: boolean;
    canViewAuditLogs: boolean;
    canEditOwnProfile: boolean;
  };
}

export const ROLE_DEFINITIONS: Record<UserRole, UserRoleInfo> = {
  owner: {
    role: 'owner',
    title: 'Владелец / Лидер [10]',
    badgeColor: 'border-purple-500/50 text-purple-300 bg-purple-950/40',
    permissions: {
      canManageRoles: true,
      canEditTreasury: true,
      canAccessPublicApi: true,
      canManageUsers: true,
      canViewHrSection: true,
      canEditFleet: true,
      canEditHallOfFame: true,
      canEditAnalytics: true,
      canEditStaffFarm: true,
      canEditStaffVehicleAndNotes: true,
      canViewAuditLogs: true,
      canEditOwnProfile: true,
    },
  },
  admin: {
    role: 'admin',
    title: 'Администратор [09]',
    badgeColor: 'border-red-500/50 text-red-300 bg-red-950/40',
    permissions: {
      canManageRoles: false,
      canEditTreasury: false,
      canAccessPublicApi: false,
      canManageUsers: true,
      canViewHrSection: true,
      canEditFleet: true,
      canEditHallOfFame: true,
      canEditAnalytics: true,
      canEditStaffFarm: true,
      canEditStaffVehicleAndNotes: true,
      canViewAuditLogs: true,
      canEditOwnProfile: true,
    },
  },
  manager: {
    role: 'manager',
    title: 'Менеджер / Логист [06]',
    badgeColor: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40',
    permissions: {
      canManageRoles: false,
      canEditTreasury: false,
      canAccessPublicApi: false,
      canManageUsers: false,
      canViewHrSection: true,
      canEditFleet: false,
      canEditHallOfFame: false,
      canEditAnalytics: false,
      canEditStaffFarm: false,
      canEditStaffVehicleAndNotes: false,
      canViewAuditLogs: false,
      canEditOwnProfile: true,
    },
  },
  hr: {
    role: 'hr',
    title: 'Отдел кадров (HR) [05]',
    badgeColor: 'border-pink-500/50 text-pink-300 bg-pink-950/40',
    permissions: {
      canManageRoles: false,
      canEditTreasury: false,
      canAccessPublicApi: false,
      canManageUsers: true,
      canViewHrSection: true,
      canEditFleet: false,
      canEditHallOfFame: false,
      canEditAnalytics: false,
      canEditStaffFarm: true,
      canEditStaffVehicleAndNotes: false,
      canViewAuditLogs: false,
      canEditOwnProfile: true,
    },
  },
  employee: {
    role: 'employee',
    title: 'Сотрудник / Фармер [04]',
    badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40',
    permissions: {
      canManageRoles: false,
      canEditTreasury: false,
      canAccessPublicApi: false,
      canManageUsers: false,
      canViewHrSection: false,
      canEditFleet: false,
      canEditHallOfFame: false,
      canEditAnalytics: false,
      canEditStaffFarm: false,
      canEditStaffVehicleAndNotes: false,
      canViewAuditLogs: false,
      canEditOwnProfile: true,
    },
  },
};

// Цены за 1 шт. добытого ресурса
export const RESOURCE_PRICES = {
  rock: 5000,         // Горная порода: 5.000$ за шт.
  wood: 2500,         // Дерево: 2.500$ за шт.
  blueFlower: 1500,   // Синий цветок: 1.500$ за шт.
  redFlower: 1500,    // Красный цветок: 1.500$ за шт.
  pinkFlower: 1500,   // Розовый цветок: 1.500$ за шт.
};

export type ShiftStatus = 'on_shift' | 'off_duty';

/** How long a session heartbeat keeps a profile marked as online. Generous window: a hidden
 * portal tab gets its timers throttled by Chrome to ~1/min, the TTL must survive that. */
export const PRESENCE_TTL_MS = 300000;

/** How often a logged-in client refreshes its heartbeat. */
export const PRESENCE_HEARTBEAT_MS = 30000;

/**
 * Presence, not a manual switch: a profile is online only while its own client keeps stamping
 * `lastActive` (ISO timestamp) and it logged out cleanly otherwise. Legacy rows store plain words
 * like 'Онлайн' in that field, which parse to NaN and therefore read as offline.
 */
export function isProfileOnline(
  lastActive: string,
  status: ShiftStatus,
  now: number = Date.now()
): boolean {
  if (status !== 'on_shift') return false;
  const seenAt = Date.parse(lastActive);
  return Number.isFinite(seenAt) && now - seenAt < PRESENCE_TTL_MS;
}

export interface FarmStats {
  rock: number;
  wood: number;
  blueFlower: number;
  redFlower: number;
  pinkFlower: number;
  totalEarned: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  pin: string; // PIN-код для входа
  role: UserRole;
  cid: string;
  rankNumber: number;
  rankName: string;
  phone: string;
  discord: string;
  department: string;
  walletBalance: number;
  farmStats: FarmStats;
  assignedVehicle: string;
  status: ShiftStatus;
  bioNotes: string;
  joinedAt: string;
  lastActive: string;
}

export type VehicleStatus = 'Готов к выезду' | 'В рейсе' | 'Ремонт' | 'Зарезервирован' | 'Дежурство СБ';

export interface VehicleItem {
  id: string;
  modelName: string;
  category: string;
  trunkKg: number;
  rankRequired: string;
  slot: string;
  status: VehicleStatus;
  fuelPercent: number;
  plate: string;
  /** Public site visibility toggle (Apathy-Corp-Public reads this collection). */
  publicVisible?: boolean;
  /** Data-URL preview shown on the public site card. */
  publicImage?: string;
  /** Optional free-text description overriding the auto-composed one. */
  publicDesc?: string;
}

export interface HallOfFameEntry {
  id: string;
  place: 1 | 2 | 3;
  nickname: string;
  cid: string;
  rankTitle: string;
  totalMined: number;
  bonusReward: number;
}

/**
 * Полная служебная лестница корпорации [02]–[11] (как в Discord-ролах).
 * [01] Novice — пригласительный ранг, в пикере не предлагается.
 */
export const RANK_LADDER: Record<number, string> = {
  11: 'Генеральный директор',
  10: 'Исполнительный директор',
  9: 'Глава HR-отдела',
  8: 'Менеджер',
  7: 'Глава логистики',
  6: 'Супервайзер',
  5: 'Мастер смены',
  4: 'Специалист логистики',
  3: 'Перевозчик',
  2: 'Сотрудник',
};

/** Ранги, доступные в пикере (по возрастанию). */
export const RANK_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const MAX_RANK = 11;

export type BonusReportStatus = 'pending' | 'approved' | 'counted' | 'rejected';

export interface BonusReport {
  id: string;
  userId: string;
  nickname: string;
  cid: string;
  rankTitle: string;
  farmSnapshot: {
    rock: number;
    wood: number;
    blueFlower: number;
    redFlower: number;
    pinkFlower: number;
    totalMinedItems: number;
  };
  requestedAmount: number;
  comment: string;
  createdAt: string;
  status: BonusReportStatus;
  reviewedBy?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// Mirrors the /applications/{appId} document written by the public portal
// (Apathy-Corp-Public). Field names must stay in sync with firestore.rules.
export interface CandidateApplication {
  id: string;
  nick: string;
  cid: string;
  phone: string;
  discord: string;
  docs: string;
  status: ApplicationStatus;
  submittedAt: string;
  source: string;
  reviewedAt: string;
  reviewerNotes: string;
  createdProfileId: string;
  /** Код проверки статуса заявки на публичном сайте (AP-XXXXXX). */
  publicCode?: string;
  /** Discord-аккаунт кандидата, подтверждённый через OAuth бота: туда бот шлёт вердикт. */
  discordVerifiedId?: string;
  discordVerifiedName?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  module: 'users' | 'treasury' | 'fleet' | 'hall_of_fame' | 'recruitment' | 'farm' | 'profile' | 'bonus_report';
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  actorName?: string;
}

export interface CorporationFinancials {
  treasuryBalance: number;
  weeklyGain: number;
  totalMined: FarmStats;
  activeWorkersCount: number;
  radioFrequency: string;
}
