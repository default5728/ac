import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Truck, Plus, Trash2, Lock, CheckCircle2, Eye, Image as ImageIcon, Pencil, Save, X } from 'lucide-react';
import { ROLE_DEFINITIONS, VehicleItem, VehicleStatus } from '../../types/database';

export const StaffFleetManager: React.FC = () => {
  const {
    fleet,
    updateVehicleStatus,
    updateVehiclePublicFields,
    updateVehicleFields,
    addVehicle,
    deleteVehicle,
    currentUser,
  } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const canEdit = ROLE_DEFINITIONS[userRole].permissions.canEditFleet;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newTrunk, setNewTrunk] = useState('1500');
  const [newSlot, setNewSlot] = useState('Слот 1');
  const [newRankReq, setNewRankReq] = useState('Ранг [01]+');
  const [descDrafts, setDescDrafts] = useState<Record<string, string>>({});

  // Редактирование существующего авто (модель, номер, багажник, слот, ранг)
  const [editingVehId, setEditingVehId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editTrunk, setEditTrunk] = useState('0');
  const [editSlot, setEditSlot] = useState('');
  const [editRankReq, setEditRankReq] = useState('');

  const handleStartEdit = (veh: VehicleItem) => {
    setEditingVehId(veh.id);
    setEditModel(veh.modelName);
    setEditPlate(veh.plate);
    setEditTrunk(String(veh.trunkKg));
    setEditSlot(veh.slot);
    setEditRankReq(veh.rankRequired);
  };

  const handleSaveEdit = (vehId: string) => {
    updateVehicleFields(vehId, {
      modelName: editModel.trim(),
      plate: editPlate.trim(),
      trunkKg: Math.max(0, parseInt(editTrunk, 10) || 0),
      slot: editSlot.trim(),
      rankRequired: editRankReq.trim(),
    });
    setEditingVehId(null);
  };

  const statuses: VehicleStatus[] = ['Готов к выезду', 'Ремонт', 'Зарезервирован'];

  // Firestore doc limit is 1MB, so the photo is downscaled and re-encoded as JPEG
  // until the base64 payload fits well below that.
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, 1000 / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        URL.revokeObjectURL(url);
        if (!ctx) {
          reject(new Error('canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Firestore ограничивает документ 1 МБ, а base64 хранится как есть (символ = байт),
        // поэтому считаем именно длину строки.
        let quality = 0.82;
        let out = canvas.toDataURL('image/jpeg', quality);
        while (out.length > 900_000 && quality > 0.4) {
          quality -= 0.12;
          out = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(out);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('bad image'));
      };
      img.src = url;
    });

  const handleImagePick = async (veh: VehicleItem, file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImage(file);
      updateVehiclePublicFields(veh.id, { publicImage: dataUrl });
    } catch {
      /* неподходящий файл — просто игнорируем */
    }
  };

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
            Добавленные сюда машины автоматически появляются в списке выбора закреплённого транспорта в профилях сотрудников, а карточки с включённым тумблером публикуются на сайте корпорации (там же используется загруженное фото и описание).
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
                      <>
                        <button
                          onClick={() =>
                            editingVehId === veh.id ? setEditingVehId(null) : handleStartEdit(veh)
                          }
                          className="p-1 text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
                          title="Редактировать машину"
                        >
                          {editingVehId === veh.id ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteVehicle(veh.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Удалить машину"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-3">{veh.category}</p>

                {editingVehId === veh.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveEdit(veh.id);
                    }}
                    className="text-xs font-mono-custom space-y-2 bg-black/40 p-3 rounded-xl border border-cyan-500/30 mb-4"
                  >
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-0.5">Модель:</label>
                      <input
                        type="text"
                        required
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-black border border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">Номер:</label>
                        <input
                          type="text"
                          value={editPlate}
                          onChange={(e) => setEditPlate(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">Багажник (кг):</label>
                        <input
                          type="number"
                          min="0"
                          value={editTrunk}
                          onChange={(e) => setEditTrunk(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">Слот:</label>
                        <input
                          type="text"
                          value={editSlot}
                          onChange={(e) => setEditSlot(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5">Доступ (ранг):</label>
                        <input
                          type="text"
                          value={editRankReq}
                          onChange={(e) => setEditRankReq(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-black border border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingVehId(null)}
                        className="px-3 py-1 rounded-lg bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        Сохранить
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-xs font-mono-custom space-y-1 text-zinc-400 bg-black/40 p-3 rounded-xl border border-white/5 mb-4">
                    <div className="flex justify-between">
                      <span>Багажник:</span>
                      <span className="text-white font-bold">{veh.trunkKg} кг</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Слот:</span>
                      <span className="text-zinc-300">{veh.slot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Доступ:</span>
                      <span className="text-zinc-300">{veh.rankRequired}</span>
                    </div>
                  </div>
                )}

                {canEdit && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-mono-custom">
                        Показывать на публичном сайте:
                      </span>
                      <button
                        onClick={() =>
                          updateVehiclePublicFields(veh.id, { publicVisible: !(veh.publicVisible !== false) })
                        }
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono-custom transition-all cursor-pointer flex items-center gap-1 ${
                          veh.publicVisible !== false
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {veh.publicVisible !== false ? (
                          <>
                            <Eye className="w-3 h-3" /> Да
                          </>
                        ) : (
                          'Нет'
                        )}
                      </button>
                    </div>

                    {veh.publicImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/10">
                        <img src={veh.publicImage} alt={veh.modelName} className="w-full h-28 object-cover" />
                        <button
                          onClick={() => updateVehiclePublicFields(veh.id, { publicImage: '' })}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/70 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                          title="Убрать фото"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/15 text-[11px] font-mono-custom text-zinc-400 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Загрузить фото для публички
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImagePick(veh, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    <input
                      type="text"
                      value={descDrafts[veh.id] ?? veh.publicDesc ?? ''}
                      onChange={(e) => setDescDrafts((prev) => ({ ...prev, [veh.id]: e.target.value }))}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (veh.publicDesc || '')) {
                          updateVehiclePublicFields(veh.id, { publicDesc: val });
                        }
                      }}
                      placeholder="Своё описание для публички (необязательно)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/10 text-[11px] text-white placeholder-zinc-600"
                    />
                  </div>
                )}
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
