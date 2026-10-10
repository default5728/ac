import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  User,
  Truck,
  Users,
  DollarSign,
  FileText,
  Bell,
  BarChart2,
  Trophy,
  Calculator,
  Globe,
  RefreshCw,
  LogOut,
  Layers,
} from 'lucide-react';
import { ROLE_DEFINITIONS } from '../../types/database';
import { StaffProfileView } from './StaffProfileView';
import { StaffAnalyticsView } from './StaffAnalyticsView';
import { StaffHallOfFameView } from './StaffHallOfFameView';
import { StaffCalculatorsView } from './StaffCalculatorsView';
import { StaffFleetManager } from './StaffFleetManager';
import { StaffHrManager } from './StaffHrManager';
import { StaffAuditLogsView } from './StaffAuditLogsView';
import { StaffTreasuryManager } from './StaffTreasuryManager';
import { StaffPublicApiSyncView } from './StaffPublicApiSyncView';

export type StaffTab =
  | 'analytics'
  | 'hall_of_fame'
  | 'calculators'
  | 'profile'
  | 'fleet'
  | 'hr'
  | 'treasury'
  | 'audit'
  | 'api_sync'
  | 'notifications';

export const StaffPortalView: React.FC = () => {
  const {
    currentUser,
    logoutStaff,
    notifications,
    bonusReports,
    markNotificationAsRead,
    clearAllNotifications,
    openArchitectureModal,
    syncEventCount,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<StaffTab>('analytics');
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const role = currentUser?.role || 'employee';
  const roleInfo = currentUser ? ROLE_DEFINITIONS[role] : ROLE_DEFINITIONS.employee;
  const isOwner = role === 'owner';
  const isEmployee = role === 'employee';

  const unreadNotifs = notifications.filter((n) => !n.read);
  const pendingBonusReports = bonusReports.filter((r) => r.status === 'pending').length;

  const allNavItems: { id: StaffTab; label: string; icon: React.ReactNode; badge?: string; visible: boolean }[] = [
    {
      id: 'analytics',
      label: 'Аналитика & KPI',
      icon: <BarChart2 className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'hall_of_fame',
      label: 'Доска Почёта',
      icon: <Trophy className="w-4 h-4" />,
      badge: isOwner && pendingBonusReports > 0 ? `Рапорты: ${pendingBonusReports}` : undefined,
      visible: true,
    },
    {
      id: 'calculators',
      label: 'Калькулятор Фарма 50/50',
      icon: <Calculator className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'profile',
      label: 'Мой Профиль & Смена',
      icon: <User className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'fleet',
      label: 'Автопарк корпорации',
      icon: <Truck className="w-4 h-4" />,
      visible: true,
    },
    {
      id: 'hr',
      label: 'Отдел Кадров & Штат',
      icon: <Users className="w-4 h-4" />,
      badge: isOwner ? 'Владелец' : 'HR',
      visible: !isEmployee,
    },
    {
      id: 'treasury',
      label: 'Казна & Сейф',
      icon: <DollarSign className="w-4 h-4" />,
      badge: 'Владелец',
      visible: isOwner,
    },
    {
      id: 'audit',
      label: 'Журнал Действий (Аудит)',
      icon: <FileText className="w-4 h-4" />,
      visible: !isEmployee,
    },
    {
      id: 'api_sync',
      label: 'Шлюз Синхронизации API',
      icon: <Globe className="w-4 h-4" />,
      badge: 'Владелец',
      visible: isOwner,
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      icon: <Bell className="w-4 h-4" />,
      visible: true,
    },
  ];

  const navItems = allNavItems.filter((i) => i.visible);

  return (
    <div className="min-h-screen bg-[#050608] text-[#e7ebf0] flex flex-col select-none">
      {/* Top Intranet Header */}
      <header className="sticky top-0 z-30 px-6 py-3 border-b border-white/10 bg-[#07090e]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-black font-black grid place-items-center shadow-lg shadow-cyan-500/20 text-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-widest text-sm text-cyan-400">
                APATHY // ПОРТАЛ ПЕРСОНАЛА
              </span>
              <span className="text-[10px] font-mono-custom text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 hidden sm:inline">
                ● ВНУТРЕННЯЯ СИСТЕМА
              </span>
            </div>
            <div className="text-[10px] font-mono-custom text-zinc-400">
              RADMIR GTA 5 RP · ФАРМ КОРПОРАЦИЯ
            </div>
          </div>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-white/10 font-mono-custom text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Сессия активна:</span>
          <span className="text-white font-bold">{currentUser?.displayName}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-cyan-400 font-bold">CID: {currentUser?.cid}</span>
        </div>

        {/* Right: Tools, Notifications, User Badge & Logout */}
        <div className="flex items-center gap-2.5">
          {isOwner && (
            <button
              onClick={openArchitectureModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono-custom bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 transition-all cursor-pointer"
              title="Шлюз архитектуры и схема синхронизации (только для Владельца)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-bold">Шлюз интеграции</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 relative cursor-pointer"
              title="Уведомления"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-3 font-mono-custom text-xs animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800 mb-2">
                  <span className="font-bold text-white uppercase text-[11px]">
                    Уведомления ({notifications.length})
                  </span>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Очистить
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-zinc-500 text-[11px]">
                      Нет новых уведомлений
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-[11px] cursor-pointer transition-colors ${
                          !n.read
                            ? 'border-cyan-500/40 bg-cyan-950/30 text-zinc-200'
                            : 'border-white/5 bg-white/[0.02] text-zinc-400'
                        }`}
                      >
                        <div className="flex justify-between text-zinc-400 text-[10px]">
                          <span className="font-bold text-white">{n.title}</span>
                          <span>{n.timestamp}</span>
                        </div>
                        <div className="mt-1 leading-snug">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-none">
                {currentUser?.displayName}
              </div>
              <div className={`text-[10px] font-mono-custom mt-0.5 ${roleInfo.badgeColor.split(' ')[1]}`}>
                {roleInfo.title}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-black grid place-items-center text-xs">
              {currentUser?.displayName.charAt(0)}
            </div>
          </div>

          <button
            onClick={logoutStaff}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 border border-white/5 transition-all ml-1 cursor-pointer"
            title="Выйти из аккаунта (Сменить пользователя)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-[#06080d] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-1">
            <div className="text-[10px] font-mono-custom text-zinc-400 uppercase tracking-widest px-3 mb-2">
              Служебные разделы
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono-custom px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-black text-cyan-300 font-bold'
                          : 'bg-white/10 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono-custom text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Единая БД онлайн</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Все показатели фарма, рапорты и казна синхронизированы в реальном времени.
            </p>
            <div className="text-[10px] text-zinc-400 pt-1 border-t border-white/5 flex justify-between">
              <span>Событий БД:</span>
              <span className="text-white">#{syncEventCount}</span>
            </div>
          </div>
        </aside>

        {/* Mobile Tab Scroller */}
        <div className="md:hidden flex overflow-x-auto border-b border-white/10 bg-black/40 p-2 gap-1.5 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-custom whitespace-nowrap shrink-0 transition-all ${
                activeTab === item.id
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#030407]/90">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'analytics' && <StaffAnalyticsView />}
            {activeTab === 'hall_of_fame' && <StaffHallOfFameView />}
            {activeTab === 'calculators' && <StaffCalculatorsView />}
            {activeTab === 'profile' && <StaffProfileView />}
            {activeTab === 'fleet' && <StaffFleetManager />}
            {activeTab === 'hr' && !isEmployee && <StaffHrManager />}
            {activeTab === 'treasury' && isOwner && <StaffTreasuryManager />}
            {activeTab === 'audit' && !isEmployee && <StaffAuditLogsView />}
            {activeTab === 'api_sync' && isOwner && <StaffPublicApiSyncView />}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Центр Уведомлений</h3>
                  <button
                    onClick={clearAllNotifications}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-custom text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Очистить историю
                  </button>
                </div>
                <div className="space-y-2 font-mono-custom text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-white/5 text-zinc-500">
                      История уведомлений пуста.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex justify-between items-start"
                      >
                        <div>
                          <div className="font-bold text-white">{n.title}</div>
                          <div className="text-zinc-400 mt-1">{n.message}</div>
                          {n.actorName && (
                            <div className="text-[10px] text-cyan-400 mt-1">
                              Сотрудник: {n.actorName}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">{n.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
