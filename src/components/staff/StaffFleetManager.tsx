import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Truck, Fuel, Plus, Trash2, Lock, CheckCircle2 } from 'lucide-react';
import { ROLE_DEFINITIONS, VehicleStatus } from '../../types/database';

export const StaffFleetManager: React.FC = () => {
  const { fleet, updateVehicleStatus, addVehicle, deleteVehicle, currentUser } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const canEdit = ROLE_DEFINITIONS[userRole].permissions.canEditFleet;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newTrunk, setNewTrunk] = useState('1500');
  const [newSlot, setNewSlot] = useState('Слот 1');
  const [newRankReq, setNewRankReq] = useState('Ранг [01]+');

  const statuses: VehicleStatus[] = ['Готов к выезду', 'В рейсе', 'Ремонт', 'Зарезервирован'];

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    addVehicle({
      modelName: newModel.trim(),
      plate: newPlate.trim() || 'AP-000',
      category: 'Рабочий транспорт',
      trunkKg: parseInt(newTrunk, 10) || 1000,
      rankRequired: newRankReq,
      slot: newSlot.trim() || 'Ангар 1',
      status: 'Готов к выезду',
      fuelPercent: 100,
    });

    setNewModel('');
    setNewPlate('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Диспетчерская и Управление Автопарком
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Добавленные сюда машины автоматически появляются в списке выбора закреплённого транспорта в профилях сотрудников.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono-custom font-bold bg-cyan-400 hover:bg-cyan-300 text-black flex items-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Добавить транспорт
            </button>
          )}

          {!canEdit ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono-custom">
              <Lock className="w-3.5 h-3.5" />
              <span>RBAC: Только чтение</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono-custom">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Управление автопарком</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-cyan-500/40 shadow-2xl animate-fadeIn">
          <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider font-mono-custom">
            Внесение транспорта в базу корпорации
          </h3>
          <form onSubmit={handleCreateVehicle} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono-custom block mb-1">
                Модель авто / тягача:
              </label>
              <input
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Speedo Custom / Phantom"
                className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-mono-custom block mb-1">
                Номерной знак:
              </label>
              <input
                type="text"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="AP-777"
                className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-mono-custom block mb-1">
                Вместимость багажника (кг):
              </label>
              <input
                type="number"
                value={newTrunk}
                onChange={(e) => setNewTrunk(e.target.value)}
                placeholder="1500"
                className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-mono-custom block mb-1">
                Парковочный слот:
              </label>
              <input
                type="text"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="Слот 1"
                className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono-custom text-zinc-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-mono-custom font-bold bg-cyan-400 text-black hover:bg-cyan-300 cursor-pointer"
              >
                Сохранить в автопарк
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fleet Grid */}
      {fleet.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-white/5 space-y-3 font-mono-custom">
          <Truck className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-white">Автопарк пуст</div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Нажмите «+ Добавить транспорт», чтобы внести технику вашей корпорации. После добавления она сразу появится в выпадающем списке для закрепления в профиле сотрудников.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fleet.map((veh) => (
            <div key={veh.id} className="p-6 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white">{veh.modelName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono-custom text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">
                      {veh.plate}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => deleteVehicle(veh.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Удалить машину"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">{veh.category}</p>

                <div className="text-xs font-mono-custom space-y-1 text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                  <div className="flex justify-between">
                    <span>Багажник:</span>
                    <span className="text-white font-bold">{veh.trunkKg} кг</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Слот:</span>
                    <span className="text-zinc-300">{veh.slot}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      Бак:
                    </span>
                    <span className="text-zinc-200 font-bold">{veh.fuelPercent}%</span>
                  </div>
                </div>
              </div>

              {canEdit ? (
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <span className="text-[10px] text-zinc-400 font-mono-custom block">
                    Переключить статус:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {statuses.map((st) => (
                      <button
                        key={st}
                        onClick={() => updateVehicleStatus(veh.id, st)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono-custom transition-all cursor-pointer ${
                          veh.status === st
                            ? 'bg-cyan-500 text-black font-bold shadow'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateVehicleStatus(veh.id, veh.status, 100)}
                      className="flex-1 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-[10px] font-mono-custom flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Fuel className="w-3 h-3" />
                      Заправить до 100%
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-white/10 text-xs font-mono-custom text-zinc-400">
                  Текущий статус: <b className="text-white">{veh.status}</b>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
