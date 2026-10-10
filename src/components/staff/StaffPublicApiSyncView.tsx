import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Copy, Check, Globe, Download, Lock } from 'lucide-react';
import { RESOURCE_PRICES } from '../../types/database';

export const StaffPublicApiSyncView: React.FC = () => {
  const { financials, fleet, hallOfFame, currentUser } = useDatabase();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'snippet'>('feed');

  if (currentUser?.role !== 'owner') {
    return (
      <div className="p-8 rounded-2xl bg-zinc-950 border border-white/10 text-center font-mono-custom text-xs">
        <Lock className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white mb-1">Доступ ограничен</h3>
        <p className="text-zinc-400">Шлюз интеграции доступен исключительно Владельцу корпорации.</p>
      </div>
    );
  }

  const publicPayload = {
    updatedAt: new Date().toISOString(),
    status: 'online',
    corporation: {
      name: 'APATHY',
      server: 'Radmir GTA 5 RP · Сервер 1',
      radioFrequency: financials.radioFrequency,
      treasuryBalance: financials.treasuryBalance,
      weeklyGain: financials.weeklyGain,
      activeWorkersCount: financials.activeWorkersCount,
      resourcePrices: RESOURCE_PRICES,
      totalMined: financials.totalMined,
    },
    fleet: fleet.map((v) => ({
      id: v.id,
      modelName: v.modelName,
      plate: v.plate,
      trunkKg: v.trunkKg,
      rankRequired: v.rankRequired,
      slot: v.slot,
      status: v.status,
      fuelPercent: v.fuelPercent,
    })),
    hallOfFame: hallOfFame.map((h) => ({
      place: h.place,
      nickname: h.nickname,
      cid: h.cid,
      rankTitle: h.rankTitle,
      totalMined: h.totalMined,
      bonusReward: h.bonusReward,
    })),
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(publicPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadJsonFile = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(publicPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apathy_corp_public_feed.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const integrationSnippet = `// Пример подключения публичного сайта второго разработчика к БД APATHY:
async function fetchApathyCorporateFeed() {
  const response = await fetch('/api/apathy/live-feed');
  const data = await response.json();
  
  // Данные казны, тарифов фарма, автопарка и доски почёта:
  console.log("Казна корпорации:", data.corporation.treasuryBalance);
  console.log("Тарифы фарма:", data.corporation.resourcePrices);
  console.log("Доска почёта:", data.hallOfFame);
  console.log("Автопарк:", data.fleet);
  
  return data;
}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            Шлюз Интеграции для Второго Разработчика (Public API)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Кабинет Владельца: передача живых метрик фарма, казны, автопарка и доски почёта на публичный сайт.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyJson}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono-custom font-bold bg-purple-500 hover:bg-purple-400 text-white flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Скопировано!' : 'Копировать Live JSON'}
          </button>
          <button
            onClick={downloadJsonFile}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono-custom bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Скачать .json
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('feed')}
          className={`py-2 px-3 text-xs font-mono-custom transition-all cursor-pointer ${
            activeTab === 'feed'
              ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Live JSON Feed (Живые данные)
        </button>
        <button
          onClick={() => setActiveTab('snippet')}
          className={`py-2 px-3 text-xs font-mono-custom transition-all cursor-pointer ${
            activeTab === 'snippet'
              ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Код для публичного сайта (JS/TS)
        </button>
      </div>

      {activeTab === 'feed' && (
        <div className="rounded-2xl bg-black border border-white/10 overflow-hidden font-mono-custom text-xs shadow-2xl">
          <div className="px-4 py-2 bg-zinc-900/80 border-b border-white/10 flex justify-between items-center text-zinc-400 text-[11px]">
            <span>GET /api/apathy/live-feed · Status 200 OK</span>
            <span className="text-emerald-400">Синхронизировано в реальном времени</span>
          </div>
          <pre className="p-4 text-cyan-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(publicPayload, null, 2)}
          </pre>
        </div>
      )}

      {activeTab === 'snippet' && (
        <div className="rounded-2xl bg-black border border-white/10 overflow-hidden font-mono-custom text-xs shadow-2xl">
          <div className="px-4 py-2 bg-zinc-900/80 border-b border-white/10 text-zinc-400 text-[11px]">
            TypeScript / JavaScript Fetch Client
          </div>
          <pre className="p-4 text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {integrationSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
