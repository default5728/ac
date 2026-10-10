import React, { useState } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { StaffAuthScreen } from './components/auth/StaffAuthScreen';
import { StaffPortalView } from './components/staff/StaffPortalView';
import { SyncIndicator } from './components/common/SyncIndicator';
import { NotificationToastContainer } from './components/common/NotificationToastContainer';
import { ArchitectureExplainerModal } from './components/common/ArchitectureExplainerModal';
import { RESOURCE_PRICES } from './types/database';
import { X, Eye, Radio, Truck, Trophy, Coins } from 'lucide-react';

const PublicSitePreviewModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { financials, fleet, hallOfFame, users } = useDatabase();
  const [tab, setTab] = useState<'about' | 'garage' | 'fame'>('about');

  if (!isOpen) return null;

  const onShiftCount = users.filter((u) => u.status === 'on_shift').length;
  const totalRock = financials.totalMined?.rock || 0;
  const totalWood = financials.totalMined?.wood || 0;
  const totalFlowers =
    (financials.totalMined?.blueFlower || 0) +
    (financials.totalMined?.redFlower || 0) +
    (financials.totalMined?.pinkFlower || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-5xl h-[88vh] bg-[#050608] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#07090e]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-xs font-mono-custom text-white">
              ПРЕДПРОСМОТР ПУБЛИЧНОГО САЙТА (ДЛЯ ВТОРОГО РАЗРАБОТЧИКА)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Nav */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-white/5 bg-black/40 overflow-x-auto text-xs font-mono-custom">
          {[
            { id: 'about', label: 'О корпорации & Выработка' },
            { id: 'garage', label: `Автопарк (${fleet.length})` },
            { id: 'fame', label: 'Доска Почёта' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as 'about' | 'garage' | 'fame')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'about' && (
            <div className="space-y-6">
              <div>
                <div className="font-mono-custom text-[#4fd8ff] text-xs tracking-[0.25em] uppercase mb-2">
                  // СЕРВЕР 1 · КОРПОРАЦИЯ APATHY
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
                  Добывающая корпорация штата (Система 50/50)
                </h2>
                <p className="text-zinc-400 text-sm">
                  Живые данные синхронизируются из закрытого портала персонала в реальном времени.
                </p>
              </div>

              <div className="custom-card p-6 border-cyan-500/30">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono-custom text-cyan-400 uppercase tracking-wider">
                      Синхронизированные метрики корпорации
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-custom text-zinc-500">
                    Рация: {financials.radioFrequency}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono-custom">
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase">Казна корпорации</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      ${financials.treasuryBalance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase">На смене / Штат</div>
                    <div className="text-2xl font-black text-cyan-400 mt-1">
                      {onShiftCount} / {users.length} чел.
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase">Горная порода ($5,000)</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {totalRock.toLocaleString()} шт.
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-zinc-400 uppercase">Дерево ($2,500) & Цветы ($1,500)</div>
                    <div className="text-2xl font-black text-white mt-1">
                      {(totalWood + totalFlowers).toLocaleString()} шт.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-custom text-xs">
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">🪨 Порода</span>
                  <b className="text-amber-400 text-base">${RESOURCE_PRICES.rock.toLocaleString()}</b>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">🪵 Дерево</span>
                  <b className="text-cyan-400 text-base">${RESOURCE_PRICES.wood.toLocaleString()}</b>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">💠 Синий цветок</span>
                  <b className="text-blue-400 text-base">${RESOURCE_PRICES.blueFlower.toLocaleString()}</b>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">🌺 Красный цветок</span>
                  <b className="text-rose-400 text-base">${RESOURCE_PRICES.redFlower.toLocaleString()}</b>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950 border border-white/10">
                  <span className="text-zinc-400 block text-[10px]">🌸 Розовый цветок</span>
                  <b className="text-pink-400 text-base">${RESOURCE_PRICES.pinkFlower.toLocaleString()}</b>
                </div>
              </div>
            </div>
          )}

          {tab === 'garage' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Автопарк корпорации APATHY
              </h3>
              {fleet.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-zinc-950 border border-white/10 text-zinc-500 font-mono-custom text-xs">
                  В автопарке пока нет добавленного транспорта.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-custom text-xs">
                  {fleet.map((v) => (
                    <div key={v.id} className="custom-card p-5 space-y-2">
                      <div className="flex justify-between items-center">
                        <b className="text-white text-sm">{v.modelName}</b>
                        <span className="text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">{v.plate}</span>
                      </div>
                      <div className="text-zinc-400">Багажник: {v.trunkKg} кг · {v.slot}</div>
                      <div className="text-emerald-400 font-bold">● {v.status} (Бак: {v.fuelPercent}%)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'fame' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Доска Почёта
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-custom text-xs">
                {hallOfFame.map((h) => (
                  <div key={h.id} className="custom-card p-5 text-center space-y-2">
                    <div className="text-3xl">{h.place === 1 ? '🥇' : h.place === 2 ? '🥈' : '🥉'}</div>
                    <div className="text-amber-400 font-bold">ТОП #{h.place}</div>
                    <div className="text-lg font-black text-white">{h.nickname}</div>
                    <div className="text-zinc-400">CID: {h.cid} · {h.rankTitle}</div>
                    <div className="text-cyan-400">Сдано: {h.totalMined} шт.</div>
                    <div className="text-emerald-400 font-bold text-sm">Премия: ${h.bonusReward.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useDatabase();
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  return (
    <div className="min-h-screen bg-[#050608] text-[#e7ebf0] grid-bg flex flex-col justify-between selection:bg-cyan-400 selection:text-black">
      {!currentUser ? (
        <StaffAuthScreen />
      ) : (
        <StaffPortalView />
      )}

      {/* Floating preview button for the public site - ONLY FOR OWNER */}
      {currentUser && currentUser.role === 'owner' && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowPublicPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-custom bg-black/80 hover:bg-zinc-900 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all shadow-xl cursor-pointer"
            title="Посмотреть, как данные отображаются на публичном сайте второго разработчика (только для Владельца)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Превью публичного сайта</span>
          </button>
        </div>
      )}

      <PublicSitePreviewModal
        isOpen={showPublicPreview}
        onClose={() => setShowPublicPreview(false)}
      />

      {/* System Overlays */}
      <SyncIndicator />
      <NotificationToastContainer />
      <ArchitectureExplainerModal />
    </div>
  );
};

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
