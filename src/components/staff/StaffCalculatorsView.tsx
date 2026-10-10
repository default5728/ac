import React, { useState } from 'react';
import { Calculator, Coins, RotateCcw, Copy, Check, Info } from 'lucide-react';
import { RESOURCE_PRICES } from '../../types/database';

export const StaffCalculatorsView: React.FC = () => {
  const [rockCount, setRockCount] = useState<number>(0);
  const [woodCount, setWoodCount] = useState<number>(0);
  const [blueCount, setBlueCount] = useState<number>(0);
  const [redCount, setRedCount] = useState<number>(0);
  const [pinkCount, setPinkCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Прямой подсчёт по фиксированному прайсу (без 50/50)
  const rockTotal = (rockCount || 0) * RESOURCE_PRICES.rock;
  const woodTotal = (woodCount || 0) * RESOURCE_PRICES.wood;
  const blueTotal = (blueCount || 0) * RESOURCE_PRICES.blueFlower;
  const redTotal = (redCount || 0) * RESOURCE_PRICES.redFlower;
  const pinkTotal = (pinkCount || 0) * RESOURCE_PRICES.pinkFlower;

  const flowersCount = (blueCount || 0) + (redCount || 0) + (pinkCount || 0);
  const flowersTotal = blueTotal + redTotal + pinkTotal;
  const totalMinedItems = (rockCount || 0) + (woodCount || 0) + flowersCount;
  const totalPayout = rockTotal + woodTotal + flowersTotal;

  const handleReset = () => {
    setRockCount(0);
    setWoodCount(0);
    setBlueCount(0);
    setRedCount(0);
    setPinkCount(0);
  };

  const handleCopySummary = () => {
    const text = `Расчёт добычи APATHY:
• Горная порода: ${rockCount || 0} шт. — $${rockTotal.toLocaleString()}
• Дерево: ${woodCount || 0} шт. — $${woodTotal.toLocaleString()}
• Цветы (Синий/Красный/Розовый): ${flowersCount} шт. — $${flowersTotal.toLocaleString()}
Всего ресурсов: ${totalMinedItems} шт.
Итого к выплате рабочему: $${totalPayout.toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            Калькулятор Добычи Ресурсов (Фарм)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Прямой подсчёт выплаты рабочему по фиксированным расценкам за единицу ресурса.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono-custom">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Режим подсчёта (без записи в аналитику)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono-custom text-xs">
        <div className="p-3 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] text-zinc-400 block uppercase">Горная порода</span>
          <b className="text-amber-400 text-sm">$5,000</b>
          <span className="text-[10px] text-zinc-500 block">за 1 шт.</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] text-zinc-400 block uppercase">Дерево</span>
          <b className="text-cyan-400 text-sm">$2,500</b>
          <span className="text-[10px] text-zinc-500 block">за 1 шт.</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950 border border-blue-500/30">
          <span className="text-[10px] text-blue-300 block uppercase">Синий цветок</span>
          <b className="text-blue-400 text-sm">$1,500</b>
          <span className="text-[10px] text-zinc-500 block">за 1 шт.</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30">
          <span className="text-[10px] text-rose-300 block uppercase">Красный цветок</span>
          <b className="text-rose-400 text-sm">$1,500</b>
          <span className="text-[10px] text-zinc-500 block">за 1 шт.</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-950 border border-pink-500/30 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-pink-300 block uppercase">Розовый цветок</span>
          <b className="text-pink-400 text-sm">$1,500</b>
          <span className="text-[10px] text-zinc-500 block">за 1 шт.</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-950 border border-cyan-500/30 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Подсчёт добычи и итоговой выплаты
            </h3>
          </div>
          <span className="text-[11px] font-mono-custom text-emerald-400">
            Чистая выплата по прайсу
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3.5 font-mono-custom text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
              <div>
                <span className="font-bold text-white block">🪨 Горная порода ($5,000 / шт.)</span>
                <span className="text-[10px] text-zinc-500">
                  Начислено: <b className="text-amber-400">${rockTotal.toLocaleString()}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={rockCount || ''}
                  onChange={(e) => setRockCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-right font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-zinc-500 w-8">шт.</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
              <div>
                <span className="font-bold text-white block">🪵 Дерево ($2,500 / шт.)</span>
                <span className="text-[10px] text-zinc-500">
                  Начислено: <b className="text-cyan-400">${woodTotal.toLocaleString()}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={woodCount || ''}
                  onChange={(e) => setWoodCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-right font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-zinc-500 w-8">шт.</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-blue-500/20">
              <div>
                <span className="font-bold text-blue-300 block">💠 Синий цветок ($1,500 / шт.)</span>
                <span className="text-[10px] text-zinc-500">
                  Начислено: <b className="text-blue-400">${blueTotal.toLocaleString()}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={blueCount || ''}
                  onChange={(e) => setBlueCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-right font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-zinc-500 w-8">шт.</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-rose-500/20">
              <div>
                <span className="font-bold text-rose-300 block">🌺 Красный цветок ($1,500 / шт.)</span>
                <span className="text-[10px] text-zinc-500">
                  Начислено: <b className="text-rose-400">${redTotal.toLocaleString()}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={redCount || ''}
                  onChange={(e) => setRedCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-right font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-zinc-500 w-8">шт.</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-pink-500/20">
              <div>
                <span className="font-bold text-pink-300 block">🌸 Розовый цветок ($1,500 / шт.)</span>
                <span className="text-[10px] text-zinc-500">
                  Начислено: <b className="text-pink-400">${pinkTotal.toLocaleString()}</b>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={pinkCount || ''}
                  onChange={(e) => setPinkCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="0"
                  className="w-24 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-right font-bold focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-zinc-500 w-8">шт.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between font-mono-custom">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
                Итоговая выплата рабочему на руки:
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 my-2">
                ${totalPayout.toLocaleString()}
              </div>

              <div className="space-y-2 text-xs text-zinc-400 border-t border-emerald-900/40 pt-3 mt-3">
                <div className="flex justify-between">
                  <span>Всего единиц сырья:</span>
                  <b className="text-white">{totalMinedItems} шт.</b>
                </div>
                <div className="flex justify-between">
                  <span>Горная порода ({rockCount || 0} шт.):</span>
                  <span className="text-amber-300">${rockTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Дерево ({woodCount || 0} шт.):</span>
                  <span className="text-cyan-300">${woodTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Цветы всех сортов ({flowersCount} шт.):</span>
                  <span className="text-pink-300">${flowersTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                disabled={totalPayout <= 0}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  totalPayout > 0
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Скопировано!' : 'Скопировать расчёт'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Сбросить все поля"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сброс</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
