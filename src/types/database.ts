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

export type BonusReportStatus = 'pending' | 'approved' | 'rejected';

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
