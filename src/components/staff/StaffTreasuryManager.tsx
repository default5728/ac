import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { DollarSign, Lock, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export const StaffTreasuryManager: React.FC = () => {
  const { financials, adjustTreasury, currentUser, hallOfFame } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const isOwner = userRole === 'owner';

  const [amountStr, setAmountStr] = useState('250000');
  const [reason, setReason] = useState('Дивиденды инвесторам / Премиальный фонд');
  const [actionType, setActionType] = useState<'add' | 'sub'>('add');

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const num = parseInt(amountStr, 10);
    if (isNaN(num) || num <= 0) return;

    adjustTreasury(actionType === 'add' ? num : -num, reason);
    setAmountStr('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Казна Корпорации & Сейф Главы [Ранг 10]
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Прямое управление финансовыми резервами, дивидендами и призовыми фондами конкурсов.
          </p>
        </div>

        {!isOwner ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono-custom">
            <Lock className="w-3.5 h-3.5" />
            <span>Доступ только для Владельца [Ранг 10]</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono-custom">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Управление казной активно</span>
          </div>
        )}
      </div>

      {/* Main Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 to-black border border-amber-500/40">
          <span className="text-[10px] font-mono-custom text-amber-400 uppercase tracking-wider">
            Баланс Главной Казны
          </span>
          <div className="text-3xl font-black text-white mt-1 mb-2">
            ${financials.treasuryBalance.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-400 font-mono-custom">
            ▲ +${financials.weeklyGain.toLocaleString()} за текущую неделю
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase tracking-wider">
            Оборот по 50/50
          </span>
          <div className="text-3xl font-black text-cyan-400 mt-1 mb-2">
            ${(financials.treasuryBalance * 2).toLocaleString()}
          </div>
          <span className="text-xs text-zinc-500 font-mono-custom">
            Суммарно: сотрудники + казна (50/50)
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
          <span className="text-[10px] font-mono-custom text-zinc-400 uppercase tracking-wider">
            Призовой фонд Доски Почёта
          </span>
          <div className="text-3xl font-black text-purple-400 mt-1 mb-2">
            ${hallOfFame.reduce((acc, h) => acc + h.bonusReward, 0).toLocaleString()}
          </div>
          <span className="text-xs text-zinc-500 font-mono-custom">
            Сумма премий ТОП-1, ТОП-2, ТОП-3
          </span>
        </div>
      </div>

      {/* Transaction Controls (Owner Only) */}
      {isOwner ? (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-white/10">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Внесение / Списание средств из казны
          </h3>

          <form onSubmit={handleTransaction} className="space-y-4 max-w-xl">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActionType('add')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono-custom font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  actionType === 'add'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Пополнить казну (+)
              </button>
              <button
                type="button"
                onClick={() => setActionType('sub')}
                className={`flex-1 py-2 rounded-xl text-xs font-mono-custom font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  actionType === 'sub'
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Списать из казны (-)
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                Сумма транзакции ($):
              </label>
              <input
                type="number"
                required
                min="1000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                Обоснование / Назначение:
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Закупка запчастей / Выплата дивидендов..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Провести операцию с казной
            </button>
          </form>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-white/5 text-zinc-500 font-mono-custom text-xs">
          Доступ к сейфу и казне имеет исключительно Владелец (Лидер) фракции APATHY.
        </div>
      )}
    </div>
  );
};
