import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { User, Save, CheckCircle2, Lock, Truck, FileText } from 'lucide-react';
import { ShiftStatus, ROLE_DEFINITIONS } from '../../types/database';

export const StaffProfileView: React.FC = () => {
  const {
    currentUser,
    fleet,
    updateUserProfile,
    updateStaffVehicleAndNotes,
    updateUserShiftStatus,
  } = useDatabase();

  if (!currentUser) return null;

  const canEditVehicleAndNotes =
    ROLE_DEFINITIONS[currentUser.role].permissions.canEditStaffVehicleAndNotes;

  const [phone, setPhone] = useState(currentUser.phone);
  const [discord, setDiscord] = useState(currentUser.discord);
  const [bioNotes, setBioNotes] = useState(currentUser.bioNotes);
  const [assignedVehicle, setAssignedVehicle] = useState(currentUser.assignedVehicle || '-');
  const [profileSavedNotice, setProfileSavedNotice] = useState(false);

  useEffect(() => {
    setPhone(currentUser.phone);
    setDiscord(currentUser.discord);
    setBioNotes(currentUser.bioNotes);
    setAssignedVehicle(currentUser.assignedVehicle || '-');
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(currentUser.id, {
      phone,
      discord,
      ...(canEditVehicleAndNotes
        ? {
            assignedVehicle,
            bioNotes,
          }
        : {}),
    });

    setProfileSavedNotice(true);
    setTimeout(() => setProfileSavedNotice(false), 3000);
  };

  const handleStatusChange = (status: ShiftStatus) => {
    updateUserShiftStatus(currentUser.id, status);
  };

  const totalFlowers =
    (currentUser.farmStats?.blueFlower || 0) +
    (currentUser.farmStats?.redFlower || 0) +
    (currentUser.farmStats?.pinkFlower || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-black border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-2xl font-black">
            {currentUser.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{currentUser.displayName}</h2>
              <span className="text-[11px] font-mono-custom px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                CID: {currentUser.cid}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono-custom mt-0.5">
              Ранг [{currentUser.rankNumber.toString().padStart(2, '0')}] {currentUser.rankName} · Отдел:{' '}
              {currentUser.department}
            </p>
          </div>
        </div>

        {/* Shift status buttons */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <span className="text-[10px] text-zinc-500 font-mono-custom px-2 uppercase">Смена:</span>
          {(
            [
              { id: 'on_shift', label: 'На смене', color: 'bg-emerald-500 text-black font-bold' },
              { id: 'off_duty', label: 'Отдых', color: 'bg-zinc-700 text-white' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => handleStatusChange(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono-custom transition-all cursor-pointer ${
                currentUser.status === st.id
                  ? st.color
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real Farm Metrics (Read-only for regular employees; editable by Owner/Admin/HR in Staff/Analytics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Баланс зарплаты
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${currentUser.walletBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono-custom">Личный заработок</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Горная порода (5.000$)
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {currentUser.farmStats?.rock || 0} шт.
          </div>
          <span className="text-[10px] text-zinc-500 font-mono-custom">Сдано в корпорацию</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Дерево (2.500$)
          </span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {currentUser.farmStats?.wood || 0} шт.
          </div>
          <span className="text-[10px] text-zinc-500 font-mono-custom">Заготовлено бревен</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase">
            Цветы всех сортов (1.500$)
          </span>
          <div className="text-2xl font-black text-pink-400 mt-1">
            {totalFlowers} шт.
          </div>
          <span className="text-[10px] text-zinc-500 font-mono-custom">Синий/Красный/Розовый</span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Личные рабочие реквизиты
          </h3>
          <span className="text-[11px] font-mono-custom text-zinc-500">
            {canEditVehicleAndNotes
              ? 'Полный доступ (Владелец / Администратор)'
              : 'Транспорт и служебные заметки назначаются Владельцем или Администратором'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                Телефон в игре:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                Discord для связи:
              </label>
              <input
                type="text"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Assigned Vehicle (Selected from Corporation Fleet; editable ONLY by Owner or Admin) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono-custom text-zinc-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Закреплённый транспорт из автопарка:
              </label>
              {!canEditVehicleAndNotes && (
                <span className="text-[10px] font-mono-custom text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Только Владелец / Админ
                </span>
              )}
            </div>

            {canEditVehicleAndNotes ? (
              <div className="space-y-1.5">
                <select
                  value={assignedVehicle}
                  onChange={(e) => setAssignedVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
                >
                  <option value="-">— Не закреплён —</option>
                  {fleet.map((veh) => {
                    const label = `${veh.modelName} [${veh.plate}]`;
                    return (
                      <option key={veh.id} value={label}>
                        {veh.modelName} [{veh.plate}] · Багажник: {veh.trunkKg} кг ({veh.slot})
                      </option>
                    );
                  })}
                </select>
                {fleet.length === 0 && (
                  <p className="text-[10px] font-mono-custom text-amber-400/90">
                    Подсказка: добавьте машины во вкладке «Автопарк корпорации», чтобы они появились в этом выпадающем списке.
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/5 text-zinc-300 text-xs font-mono-custom flex items-center justify-between">
                <span>
                  {currentUser.assignedVehicle && currentUser.assignedVehicle !== '-'
                    ? currentUser.assignedVehicle
                    : '— Не закреплён —'}
                </span>
                <span className="text-[10px] text-zinc-500">Из автопарка корпорации</span>
              </div>
            )}
          </div>

          {/* Service Bio Notes (Editable ONLY by Owner or Admin) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono-custom text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Служебные заметки:
              </label>
              {!canEditVehicleAndNotes && (
                <span className="text-[10px] font-mono-custom text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Только Владелец / Админ
                </span>
              )}
            </div>

            {canEditVehicleAndNotes ? (
              <textarea
                rows={2}
                value={bioNotes}
                onChange={(e) => setBioNotes(e.target.value)}
                placeholder="Служебная характеристика, допуски, заметки руководства..."
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            ) : (
              <div className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/5 text-zinc-300 text-xs font-mono-custom min-h-[56px]">
                {currentUser.bioNotes || 'Нет служебных заметок.'}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-black transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Сохранить данные
          </button>

          {profileSavedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono-custom flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Данные профиля обновлены в Единой БД!
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
