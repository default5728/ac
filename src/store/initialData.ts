import {
  UserProfile,
  VehicleItem,
  HallOfFameEntry,
  CorporationFinancials,
  AuditLogItem,
  AppNotification,
  BonusReport,
} from '../types/database';

// Единственный предустановленный аккаунт Владельца для первичного входа и создания персонала
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u-owner-root',
    username: 'owner',
    displayName: 'Owner',
    pin: '7777',
    role: 'owner',
    cid: '0001',
    rankNumber: 10,
    rankName: 'Владелец / Лидер',
    phone: '555-001',
    discord: 'owner#0001',
    department: 'Совет Директоров',
    walletBalance: 0,
    farmStats: {
      rock: 0,
      wood: 0,
      blueFlower: 0,
      redFlower: 0,
      pinkFlower: 0,
      totalEarned: 0,
    },
    assignedVehicle: '-',
    status: 'on_shift',
    bioNotes: 'Главный руководитель корпорации APATHY.',
    joinedAt: new Date().toISOString().slice(0, 10),
    lastActive: 'Онлайн',
  },
];

export const INITIAL_FLEET: VehicleItem[] = [];

export const INITIAL_HALL_OF_FAME: HallOfFameEntry[] = [
  {
    id: 'hof-1',
    place: 1,
    nickname: 'none',
    cid: '-',
    rankTitle: '-',
    totalMined: 0,
    bonusReward: 0,
  },
  {
    id: 'hof-2',
    place: 2,
    nickname: 'none',
    cid: '-',
    rankTitle: '-',
    totalMined: 0,
    bonusReward: 0,
  },
  {
    id: 'hof-3',
    place: 3,
    nickname: 'none',
    cid: '-',
    rankTitle: '-',
    totalMined: 0,
    bonusReward: 0,
  },
];

export const INITIAL_FINANCIALS: CorporationFinancials = {
  treasuryBalance: 0,
  weeklyGain: 0,
  totalMined: {
    rock: 0,
    wood: 0,
    blueFlower: 0,
    redFlower: 0,
    pinkFlower: 0,
    totalEarned: 0,
  },
  activeWorkersCount: 0,
  radioFrequency: '104.2 MHz',
};

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_BONUS_REPORTS: BonusReport[] = [];
