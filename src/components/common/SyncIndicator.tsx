import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Layers } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
  const { syncEventCount, openArchitectureModal, currentUser } = useDatabase();
  const [pulse, setPulse] = useState(false);

  React.useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 800);
    return () => clearTimeout(timer);
  }, [syncEventCount]);

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono-custom border backdrop-blur-md transition-all duration-300 ${
          pulse
            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 scale-105'
            : 'bg-zinc-950/80 border-zinc-800 text-zinc-300'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            pulse ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'
          }`}
        />
        <span className="hidden sm:inline">База данных:</span>
        <span className="text-cyan-400 font-semibold">Live Sync</span>
        <span className="text-[10px] text-zinc-500 hidden md:inline">
          (#{syncEventCount})
        </span>
      </div>

      {currentUser.role === 'owner' && (
        <button
          onClick={openArchitectureModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-custom bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all shadow-md"
          title="Посмотреть архитектурную схему взаимодействия со вторым разработчиком"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Архитектура & API</span>
        </button>
      )}
    </div>
  );
};
