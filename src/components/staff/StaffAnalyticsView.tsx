import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  BarChart2,
  Clock,
  Coins,
  Edit3,
  Save,
  X,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import {
  RESOURCE_PRICES,
  ROLE_DEFINITIONS,
  UserProfile,
  isProfileOnline,
} from '../../types/database';

export const StaffAnalyticsView: React.FC = () => {
  const {
    financials,
    users,
    currentUser,
    updateFinancialsData,
    updateStaffFarmStats,
    recordFarmSubmission,
    presenceNow,
  } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const canEditAnalytics = ROLE_DEFINITIONS[userRole].permissions.canEditAnalytics;
  const canEditStaffFarm = ROLE_DEFINITIONS[userRole].permissions.canEditStaffFarm;

  // Analytics Editor State (Owner & Admin ONLY)
  const [isEditingAnalytics, setIsEditingAnalytics] = useState(false);
  const [editTreasury, setEditTreasury] = useState('0');
  const [editWeeklyGain, setEditWeeklyGain] = useState('0');
  const [editRadio, setEditRadio] = useState('104.2 MHz');
  const [editRock, setEditRock] = useState('0');
  const [editWood, setEditWood] = useState('0');
  const [editBlue, setEditBlue] = useState('0');
  const [editRed, setEditRed] = useState('0');
  const [editPink, setEditPink] = useState('0');
  const [savedAnalyticsNotice, setSavedAnalyticsNotice] = useState(false);

  // Staff Farm Editor Modal State (Owner, Admin, HR ONLY)
  const [editingStaffUser, setEditingStaffUser] = useState<UserProfile | null>(null);
  const [staffEditMode, setStaffEditMode] = useState<'add' | 'exact'>('add');
  const [staffRock, setStaffRock] = useState('0');
  const [staffWood, setStaffWood] = useState('0');
  const [staffBlue, setStaffBlue] = useState('0');
  const [staffRed, setStaffRed] = useState('0');
  const [staffPink, setStaffPink] = useState('0');
  const [staffWallet, setStaffWallet] = useState('0');

  const onShiftUsers = users.filter((u) =>
    isProfileOnline(u.lastActive, u.status, presenceNow)
  );
  const totalRock = financials.totalMined?.rock || 0;
  const totalWood = financials.totalMined?.wood || 0;
  const totalBlue = financials.totalMined?.blueFlower || 0;
  const totalRed = financials.totalMined?.redFlower || 0;
  const totalPink = financials.totalMined?.pinkFlower || 0;
  const totalFlowers = totalBlue + totalRed + totalPink;

  const totalFarmItems = totalRock + totalWood + totalFlowers;
  const totalTreasury = financials.treasuryBalance || 0;

  const grossValueProduced =
    totalRock * RESOURCE_PRICES.rock +
    totalWood * RESOURCE_PRICES.wood +
    totalFlowers * RESOURCE_PRICES.blueFlower;

  const openAnalyticsEditor = () => {
    setEditTreasury(String(financials.treasuryBalance || 0));
    setEditWeeklyGain(String(financials.weeklyGain || 0));
    setEditRadio(financials.radioFrequency || '104.2 MHz');
    setEditRock(String(financials.totalMined?.rock || 0));
    setEditWood(String(financials.totalMined?.wood || 0));
    setEditBlue(String(financials.totalMined?.blueFlower || 0));
    setEditRed(String(financials.totalMined?.redFlower || 0));
    setEditPink(String(financials.totalMined?.pinkFlower || 0));
    setIsEditingAnalytics(true);
  };

  const handleSyncFromStaffTotals = () => {
    const sumRock = users.reduce((acc, u) => acc + (u.farmStats?.rock || 0), 0);
    const sumWood = users.reduce((acc, u) => acc + (u.farmStats?.wood || 0), 0);
    const sumBlue = users.reduce((acc, u) => acc + (u.farmStats?.blueFlower || 0), 0);
    const sumRed = users.reduce((acc, u) => acc + (u.farmStats?.redFlower || 0), 0);
    const sumPink = users.reduce((acc, u) => acc + (u.farmStats?.pinkFlower || 0), 0);
    setEditRock(String(sumRock));
    setEditWood(String(sumWood));
    setEditBlue(String(sumBlue));
    setEditRed(String(sumRed));
    setEditPink(String(sumPink));
  };

  const handleSaveAnalytics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditAnalytics) return;

    const r = Math.max(0, parseInt(editRock, 10) || 0);
    const w = Math.max(0, parseInt(editWood, 10) || 0);
    const b = Math.max(0, parseInt(editBlue, 10) || 0);
    const rd = Math.max(0, parseInt(editRed, 10) || 0);
    const p = Math.max(0, parseInt(editPink, 10) || 0);

    const totalEarnedCalc =
      r * RESOURCE_PRICES.rock +
      w * RESOURCE_PRICES.wood +
      (b + rd + p) * RESOURCE_PRICES.blueFlower;

    updateFinancialsData({
      treasuryBalance: Math.max(0, parseInt(editTreasury, 10) || 0),
      weeklyGain: Math.max(0, parseInt(editWeeklyGain, 10) || 0),
      radioFrequency: editRadio.trim() || '104.2 MHz',
      totalMined: {
        rock: r,
        wood: w,
        blueFlower: b,
        redFlower: rd,
        pinkFlower: p,
        totalEarned: totalEarnedCalc,
      },
    });

    setIsEditingAnalytics(false);
    setSavedAnalyticsNotice(true);
    setTimeout(() => setSavedAnalyticsNotice(false), 3500);
  };

  const openStaffFarmModal = (u: UserProfile, mode: 'add' | 'exact') => {
    setEditingStaffUser(u);
    setStaffEditMode(mode);
    if (mode === 'add') {
      setStaffRock('0');
      setStaffWood('0');
      setStaffBlue('0');
      setStaffRed('0');
      setStaffPink('0');
      setStaffWallet(String(u.walletBalance || 0));
    } else {
      setStaffRock(String(u.farmStats?.rock || 0));
      setStaffWood(String(u.farmStats?.wood || 0));
      setStaffBlue(String(u.farmStats?.blueFlower || 0));
      setStaffRed(String(u.farmStats?.redFlower || 0));
      setStaffPink(String(u.farmStats?.pinkFlower || 0));
      setStaffWallet(String(u.walletBalance || 0));
    }
  };

  const handleSaveStaffFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffUser || !canEditStaffFarm) return;

    const r = Math.max(0, parseInt(staffRock, 10) || 0);
    const w = Math.max(0, parseInt(staffWood, 10) || 0);
    const b = Math.max(0, parseInt(staffBlue, 10) || 0);
    const rd = Math.max(0, parseInt(staffRed, 10) || 0);
    const p = Math.max(0, parseInt(staffPink, 10) || 0);

    if (staffEditMode === 'add') {
      recordFarmSubmission(editingStaffUser.id, {
        rock: r,
        wood: w,
        blueFlower: b,
        redFlower: rd,
        pinkFlower: p,
      });
    } else {
      updateStaffFarmStats(editingStaffUser.id, {
        rock: r,
        wood: w,
        blueFlower: b,
        redFlower: rd,
        pinkFlower: p,
        walletBalance: Math.max(0, parseInt(staffWallet, 10) || 0),
      });
    }

    setEditingStaffUser(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            Служебная Аналитика & KPI Корпорации
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Сводка выработки смен, сданной добычи (порода, дерево, цветы) и реальная казна корпорации.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditAnalytics && (
            <button
              onClick={() =>
                isEditingAnalytics ? setIsEditingAnalytics(false) : openAnalyticsEditor()
              }
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono-custom font-bold bg-cyan-400 hover:bg-cyan-300 text-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingAnalytics ? 'Закрыть редактор' : 'Редактировать аналитику'}</span>
            </button>
          )}
        </div>
      </div>

      {savedAnalyticsNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono-custom flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Показатели корпоративной аналитики успешно обновлены!
        </div>
      )}

      {/* Analytics Editor Panel (Owner & Admin ONLY) */}
      {canEditAnalytics && isEditingAnalytics && (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-cyan-500/40 shadow-2xl animate-fadeIn font-mono-custom text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Редактирование глобальной аналитики корпорации
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Доступно только Владельцу и Администратору.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncFromStaffTotals}
              className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Подтянуть сумму добычи из профилей штата</span>
            </button>
          </div>

          <form onSubmit={handleSaveAnalytics} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Казна корпорации ($):</label>
                <input
                  type="number"
                  min="0"
                  value={editTreasury}
                  onChange={(e) => setEditTreasury(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Прирост за неделю ($):</label>
                <input
                  type="number"
                  min="0"
                  value={editWeeklyGain}
                  onChange={(e) => setEditWeeklyGain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Частота рации:</label>
                <input
                  type="text"
                  value={editRadio}
                  onChange={(e) => setEditRadio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-amber-400 mb-1 text-[11px]">🪨 Порода (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={editRock}
                  onChange={(e) => setEditRock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 text-[11px]">🪵 Дерево (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={editWood}
                  onChange={(e) => setEditWood(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-blue-400 mb-1 text-[11px]">💠 Синий цв. (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={editBlue}
                  onChange={(e) => setEditBlue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-rose-400 mb-1 text-[11px]">🌺 Красный цв. (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={editRed}
                  onChange={(e) => setEditRed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-pink-400 mb-1 text-[11px]">🌸 Розовый цв. (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={editPink}
                  onChange={(e) => setEditPink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingAnalytics(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Сохранить аналитику
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Казна корпорации
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${totalTreasury.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono-custom mt-1">
            Резервный фонд APATHY
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Выплачено персоналу
          </span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            ${grossValueProduced.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono-custom mt-1">
            Заработная плата на руки
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Всего добыто ресурсов
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {totalFarmItems > 0 ? `${totalFarmItems.toLocaleString()} шт.` : '-'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono-custom mt-1">
            Порода + Дерево + Цветы
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Сотрудников в сети
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {onShiftUsers.length} чел.
          </div>
          <div className="text-[11px] text-zinc-500 font-mono-custom mt-1">
            Всего в штате: {users.length}
          </div>
        </div>
      </div>

      {/* Resource Breakdown Ribbon */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-cyan-400" />
          Добыча по категориям сырья (Фиксированные тарифы)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono-custom text-xs">
          <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30">
            <div className="flex justify-between items-center text-zinc-400 mb-1">
              <span>🪨 Горная порода</span>
              <span className="text-amber-400 font-bold">$5,000 / шт</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalRock > 0 ? `${totalRock.toLocaleString()} шт.` : '-'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Оборот: ${(totalRock * RESOURCE_PRICES.rock).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-cyan-500/30">
            <div className="flex justify-between items-center text-zinc-400 mb-1">
              <span>🪵 Дерево</span>
              <span className="text-cyan-400 font-bold">$2,500 / шт</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalWood > 0 ? `${totalWood.toLocaleString()} шт.` : '-'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Оборот: ${(totalWood * RESOURCE_PRICES.wood).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-blue-500/30">
            <div className="flex justify-between items-center text-zinc-400 mb-1">
              <span>💠 Синий цветок</span>
              <span className="text-blue-400 font-bold">$1,500 / шт</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalBlue > 0 ? `${totalBlue.toLocaleString()} шт.` : '-'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Оборот: ${(totalBlue * RESOURCE_PRICES.blueFlower).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-rose-500/30">
            <div className="flex justify-between items-center text-zinc-400 mb-1">
              <span>🌺 Красный цветок</span>
              <span className="text-rose-400 font-bold">$1,500 / шт</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalRed > 0 ? `${totalRed.toLocaleString()} шт.` : '-'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Оборот: ${(totalRed * RESOURCE_PRICES.redFlower).toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-pink-500/30">
            <div className="flex justify-between items-center text-zinc-400 mb-1">
              <span>🌸 Розовый цветок</span>
              <span className="text-pink-400 font-bold">$1,500 / шт</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalPink > 0 ? `${totalPink.toLocaleString()} шт.` : '-'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Оборот: ${(totalPink * RESOURCE_PRICES.pinkFlower).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Farm Editor Modal (Owner, Admin, HR ONLY) */}
      {canEditStaffFarm && editingStaffUser && (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-2xl animate-fadeIn font-mono-custom text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase">
                Управление добычей сотрудника: {editingStaffUser.displayName} (CID: {editingStaffUser.cid})
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Доступно только Владельцу, Администратору и Отделу кадров (HR).
              </p>
            </div>
            <button
              onClick={() => setEditingStaffUser(null)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => openStaffFarmModal(editingStaffUser, 'add')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                staffEditMode === 'add'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              + Начислить сданную партию (по прайсу в баланс и аналитику)
            </button>
            <button
              type="button"
              onClick={() => openStaffFarmModal(editingStaffUser, 'exact')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                staffEditMode === 'exact'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Задать точные цифры в профиле
            </button>
          </div>

          <form onSubmit={handleSaveStaffFarm} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-amber-400 mb-1 text-[11px]">🪨 Порода:</label>
                <input
                  type="number"
                  min="0"
                  value={staffRock}
                  onChange={(e) => setStaffRock(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-cyan-400 mb-1 text-[11px]">🪵 Дерево:</label>
                <input
                  type="number"
                  min="0"
                  value={staffWood}
                  onChange={(e) => setStaffWood(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-blue-400 mb-1 text-[11px]">💠 Синий цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={staffBlue}
                  onChange={(e) => setStaffBlue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-rose-400 mb-1 text-[11px]">🌺 Красный цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={staffRed}
                  onChange={(e) => setStaffRed(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-pink-400 mb-1 text-[11px]">🌸 Розовый цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={staffPink}
                  onChange={(e) => setStaffPink(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              {staffEditMode === 'exact' && (
                <div>
                  <label className="block text-emerald-400 mb-1 text-[11px]">💰 Баланс ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={staffWallet}
                    onChange={(e) => setStaffWallet(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStaffUser(null)}
                className="px-4 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer"
              >
                {staffEditMode === 'add' ? 'Начислить добычу' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Activity Roster Table */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Выработка сотрудников & Текущие смены
          </h3>
          {canEditStaffFarm && (
            <span className="text-[11px] font-mono-custom text-emerald-400">
              Вы можете начислять и редактировать добычу персонала
            </span>
          )}
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 font-mono-custom text-xs">
            Сотрудники ещё не зарегистрированы. Владелец может создать их во вкладке «Отдел кадров».
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-custom text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 text-[10px] uppercase">
                  <th className="pb-3 font-semibold">Сотрудник</th>
                  <th className="pb-3 font-semibold">CID</th>
                  <th className="pb-3 font-semibold">Смена</th>
                  <th className="pb-3 font-semibold">Транспорт</th>
                  <th className="pb-3 font-semibold">Порода</th>
                  <th className="pb-3 font-semibold">Дерево</th>
                  <th className="pb-3 font-semibold">Цветы</th>
                  <th className="pb-3 font-semibold text-right">Заработано</th>
                  {canEditStaffFarm && (
                    <th className="pb-3 font-semibold text-right">Управление добычей</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const flowers =
                    (u.farmStats?.blueFlower || 0) +
                    (u.farmStats?.redFlower || 0) +
                    (u.farmStats?.pinkFlower || 0);
                  const online = isProfileOnline(u.lastActive, u.status, presenceNow);

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-[10px] text-zinc-500">{u.rankName}</div>
                      </td>
                      <td className="py-3 text-cyan-400">{u.cid}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            online
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {online ? 'В сети' : 'Не в сети'}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400 text-[11px]">
                        {u.assignedVehicle && u.assignedVehicle !== '-' ? u.assignedVehicle : '—'}
                      </td>
                      <td className="py-3 text-zinc-300">{u.farmStats?.rock || 0} шт.</td>
                      <td className="py-3 text-zinc-300">{u.farmStats?.wood || 0} шт.</td>
                      <td className="py-3 text-zinc-300">{flowers} шт.</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">
                        ${u.walletBalance.toLocaleString()}
                      </td>
                      {canEditStaffFarm && (
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openStaffFarmModal(u, 'add')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Начислить сданную добычу по прайсу"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>+Добыча</span>
                            </button>
                            <button
                              onClick={() => openStaffFarmModal(u, 'exact')}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-[10px] transition-colors cursor-pointer"
                              title="Изменить точные значения"
                            >
                              Изменить
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
