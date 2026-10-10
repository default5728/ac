import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Trophy,
  Award,
  CheckCircle2,
  Send,
  FileText,
  Check,
  X,
  Trash2,
  Clock,
  DollarSign,
} from 'lucide-react';

export const StaffHallOfFameView: React.FC = () => {
  const {
    hallOfFame,
    updateHallOfFameWinner,
    currentUser,
    bonusReports,
    submitBonusReport,
    reviewBonusReport,
    deleteBonusReport,
  } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const isOwner = userRole === 'owner';
  const canEdit = userRole === 'owner' || userRole === 'admin';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNick, setNewNick] = useState('');
  const [newCid, setNewCid] = useState('');
  const [newRank, setNewRank] = useState('');
  const [newTotalMined, setNewTotalMined] = useState('');
  const [newBonus, setNewBonus] = useState('');

  // Bonus Report Submission Modal / Form state
  const [showReportModal, setShowReportModal] = useState(false);
  const [requestedAmount, setRequestedAmount] = useState('150000');
  const [reportComment, setReportComment] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleStartEdit = (entry: typeof hallOfFame[0]) => {
    setEditingId(entry.id);
    setNewNick(entry.nickname === 'none' ? '' : entry.nickname);
    setNewCid(entry.cid === '-' ? '' : entry.cid);
    setNewRank(entry.rankTitle === '-' ? '' : entry.rankTitle);
    setNewTotalMined(entry.totalMined.toString());
    setNewBonus(entry.bonusReward.toString());
  };

  const handleSaveEdit = (entryId: string) => {
    updateHallOfFameWinner(entryId, {
      nickname: newNick.trim() || 'none',
      cid: newCid.trim() || '-',
      rankTitle: newRank.trim() || '-',
      totalMined: parseInt(newTotalMined, 10) || 0,
      bonusReward: parseInt(newBonus, 10) || 0,
    });
    setEditingId(null);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(requestedAmount, 10) || 0;
    submitBonusReport({
      requestedAmount: amount,
      comment: reportComment,
    });
    setShowReportModal(false);
    setReportComment('');
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 5000);
  };

  const pendingReportsCount = bonusReports.filter((r) => r.status === 'pending').length;
  const myReports = bonusReports.filter((r) => r.userId === currentUser?.id);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Доска Почёта & Премиальный Фонд Фарма
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Рейтинг лидеров по объёму сданных ресурсов (порода, дерево, цветы). Рапорты на премирование поступают напрямую Владельцу.
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(!showReportModal)}
          className="px-4 py-2 rounded-xl text-xs font-mono-custom font-bold bg-amber-400 hover:bg-amber-300 text-black flex items-center gap-1.5 shadow-md shadow-amber-400/20 transition-all cursor-pointer"
        >
          <Award className="w-4 h-4" />
          Подать рапорт на премирование
        </button>
      </div>

      {/* Report Submission Form */}
      {showReportModal && currentUser && (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-2xl animate-fadeIn font-mono-custom text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase">
                Новый рапорт Владельцу на премирование
              </h3>
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/50 border border-white/5">
              <div>
                <span className="text-[10px] text-zinc-500 block">Сотрудник:</span>
                <b className="text-white">{currentUser.displayName} (CID: {currentUser.cid})</b>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Должность:</span>
                <b className="text-cyan-400">[{String(currentUser.rankNumber).padStart(2, '0')}] {currentUser.rankName}</b>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Ваша текущая выработка в профиле:</span>
                <b className="text-emerald-400">
                  Порода: {currentUser.farmStats?.rock || 0} | Дерево: {currentUser.farmStats?.wood || 0} | Цветы:{' '}
                  {(currentUser.farmStats?.blueFlower || 0) +
                    (currentUser.farmStats?.redFlower || 0) +
                    (currentUser.farmStats?.pinkFlower || 0)}
                </b>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">
                  Запрашиваемая сумма премии ($): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="150000"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Основание / Комментарий к рапорту: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Выполнил норму по породе и дереву, прошу рассмотреть премию..."
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Отправить рапорт Владельцу
              </button>
            </div>
          </form>
        </div>
      )}

      {requestSent && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono-custom flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Рапорт на премирование успешно отправлен и отображается в панели Владельца корпорации!
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hallOfFame.map((entry) => {
          const isTop1 = entry.place === 1;
          const isTop2 = entry.place === 2;

          const medal = isTop1 ? '🥇' : isTop2 ? '🥈' : '🥉';
          const title = isTop1 ? 'ТОП 1 МЕСЯЦА' : isTop2 ? 'ТОП 2 МЕСЯЦА' : 'ТОП 3 МЕСЯЦА';
          const borderClass = isTop1
            ? 'border-amber-400/50 shadow-xl shadow-amber-400/10'
            : isTop2
            ? 'border-zinc-400/40'
            : 'border-orange-500/40';

          return (
            <div
              key={entry.id}
              className={`p-6 rounded-2xl bg-zinc-950 border text-center flex flex-col justify-between ${borderClass}`}
            >
              <div>
                <div className="text-4xl mb-2">{medal}</div>
                <div className="text-xs font-mono-custom font-bold text-amber-400 tracking-wider">
                  {title}
                </div>

                {editingId === entry.id ? (
                  <div className="space-y-2 my-3 text-left font-mono-custom text-xs">
                    <div>
                      <label className="text-[10px] text-zinc-400">Никнейм:</label>
                      <input
                        type="text"
                        value={newNick}
                        onChange={(e) => setNewNick(e.target.value)}
                        placeholder="Alex_Mason"
                        className="w-full px-2 py-1 rounded bg-black border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">CID:</label>
                      <input
                        type="text"
                        value={newCid}
                        onChange={(e) => setNewCid(e.target.value)}
                        placeholder="0042"
                        className="w-full px-2 py-1 rounded bg-black border border-white/10 text-white uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Должность / Ранг:</label>
                      <input
                        type="text"
                        value={newRank}
                        onChange={(e) => setNewRank(e.target.value)}
                        placeholder="[04] Старший Фармер"
                        className="w-full px-2 py-1 rounded bg-black border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Всего добыто (шт.):</label>
                      <input
                        type="number"
                        value={newTotalMined}
                        onChange={(e) => setNewTotalMined(e.target.value)}
                        placeholder="1200"
                        className="w-full px-2 py-1 rounded bg-black border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400">Премия ($):</label>
                      <input
                        type="number"
                        value={newBonus}
                        onChange={(e) => setNewBonus(e.target.value)}
                        placeholder="500000"
                        className="w-full px-2 py-1 rounded bg-black border border-white/10 text-white"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        className="flex-1 py-1.5 rounded bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-white mt-2 mb-1">{entry.nickname}</h3>
                    <div className="text-xs font-mono-custom text-zinc-400 mb-4">
                      CID: <b className="text-cyan-400">{entry.cid}</b> · {entry.rankTitle}
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono-custom text-xs text-left space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Сдано сырья:</span>
                        <b className="text-cyan-400">
                          {entry.totalMined > 0 ? `${entry.totalMined.toLocaleString()} шт.` : '-'}
                        </b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Премия за месяц:</span>
                        <b className="text-emerald-400">${entry.bonusReward.toLocaleString()}</b>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {canEdit && editingId !== entry.id && (
                <button
                  onClick={() => handleStartEdit(entry)}
                  className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono-custom text-amber-300 transition-colors cursor-pointer"
                >
                  Редактировать лидера
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* OWNER ONLY: BONUS REPORTS INBOX */}
      {isOwner && (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-purple-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Входящие рапорты на премирование
                  {pendingReportsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      Новых: {pendingReportsCount}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono-custom">
                  Видно только Владельцу корпорации. Вы можете одобрить рапорт (с выплатой премии или без) либо отклонить его.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono-custom px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 self-start sm:self-auto">
              КАБИНЕТ ВЛАДЕЛЬЦА
            </span>
          </div>

          {bonusReports.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-black/40 border border-white/5 text-zinc-500 font-mono-custom text-xs">
              Поданных рапортов на премирование пока нет. Когда сотрудник нажмёт «Подать рапорт на премирование», заявка появится здесь.
            </div>
          ) : (
            <div className="space-y-3 font-mono-custom text-xs">
              {bonusReports.map((rep) => {
                const flowers =
                  rep.farmSnapshot.blueFlower +
                  rep.farmSnapshot.redFlower +
                  rep.farmSnapshot.pinkFlower;

                return (
                  <div
                    key={rep.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row justify-between gap-4 ${
                      rep.status === 'pending'
                        ? 'bg-amber-950/15 border-amber-500/40'
                        : rep.status === 'approved'
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-rose-950/15 border-rose-500/30 opacity-75'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{rep.nickname}</span>
                        <span className="text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded text-[11px]">
                          CID: {rep.cid}
                        </span>
                        <span className="text-zinc-400 text-[11px]">{rep.rankTitle}</span>
                        <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rep.createdAt}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : rep.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {rep.status === 'pending'
                            ? 'На рассмотрении'
                            : rep.status === 'approved'
                            ? 'Одобрено'
                            : 'Отклонено'}
                        </span>
                      </div>

                      <div className="text-zinc-200 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        <span className="text-zinc-500">Комментарий сотрудника: </span>
                        {rep.comment}
                      </div>

                      <div className="flex flex-wrap gap-4 text-[11px] text-zinc-400">
                        <span>
                          Запрошена премия:{' '}
                          <b className="text-amber-400 text-xs">${rep.requestedAmount.toLocaleString()}</b>
                        </span>
                        <span>
                          Выработка сотрудника: Порода <b className="text-white">{rep.farmSnapshot.rock}</b> · Дерево{' '}
                          <b className="text-white">{rep.farmSnapshot.wood}</b> · Цветы{' '}
                          <b className="text-white">{flowers}</b> (Всего: {rep.farmSnapshot.totalMinedItems} шт.)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-end lg:self-center">
                      {rep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => reviewBonusReport(rep.id, 'approved', true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Одобрить рапорт и начислить премию сотруднику из казны"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Одобрить + Выплатить</span>
                          </button>
                          <button
                            onClick={() => reviewBonusReport(rep.id, 'approved', false)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Одобрить рапорт без автоматического списания"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Одобрить</span>
                          </button>
                          <button
                            onClick={() => reviewBonusReport(rep.id, 'rejected', false)}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Отклонить</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteBonusReport(rep.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Удалить рапорт из списка"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Non-owner view of their own submitted reports */}
      {!isOwner && myReports.length > 0 && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-3 font-mono-custom text-xs">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Мои поданные рапорты Владельцу ({myReports.length})
          </h3>
          <div className="space-y-2">
            {myReports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div>
                  <div className="text-white font-bold">
                    Запрос на премию: <span className="text-amber-400">${rep.requestedAmount.toLocaleString()}</span>
                    <span className="text-zinc-500 text-[10px] ml-2">{rep.createdAt}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">{rep.comment}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    rep.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : rep.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {rep.status === 'pending'
                    ? 'Передано Владельцу'
                    : rep.status === 'approved'
                    ? 'Одобрено Владельцем'
                    : 'Отклонено'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
