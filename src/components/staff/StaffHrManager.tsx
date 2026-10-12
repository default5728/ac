import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Filter,
  Truck,
  FileText,
  Coins,
  Save,
  X,
  PlusCircle,
  Inbox,
  ExternalLink,
  Clock,
  XCircle,
  UserCheck,
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  UserRole,
  UserProfile,
  CandidateApplication,
  isProfileOnline,
  RANK_LADDER,
  RANK_OPTIONS,
} from '../../types/database';

const NOTIFY_APPLICANT_URL = 'https://ac-p.vercel.app/api/notify-applicant';

// ЛС кандидату от бота APATHY (вердикт HR + реквизиты). Best effort: на статус заявки
// не влияет. Без VITE_PORTAL_NOTIFY_SECRET или без подтверждённого Discord — тихий скип.
const notifyApplicant = async (
  target: CandidateApplication,
  decision: 'approved' | 'rejected',
  extra: { pin?: string; roleTitle?: string; reason?: string }
): Promise<boolean> => {
  const secret = import.meta.env.VITE_PORTAL_NOTIFY_SECRET;
  if (!secret || !target.discordVerifiedId) return false;
  try {
    const res = await fetch(NOTIFY_APPLICANT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-notify-secret': secret },
      body: JSON.stringify({
        applicationId: target.id,
        publicCode: target.publicCode || '',
        decision,
        discordId: target.discordVerifiedId,
        nick: target.nick,
        cid: target.cid,
        phone: target.phone,
        discord: target.discord,
        pin: extra.pin || '',
        roleTitle: extra.roleTitle || '',
        reason: extra.reason || '',
      }),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return Boolean(res.ok && json?.ok);
  } catch {
    return false;
  }
};

export const StaffHrManager: React.FC = () => {
  const {
    users,
    fleet,
    currentUser,
    applications,
    createUserByAdmin,
    updateUserCredentialsByOwner,
    deleteUser,
    updateStaffFarmStats,
    recordFarmSubmission,
    updateStaffVehicleAndNotes,
    approveCandidateApplication,
    rejectCandidateApplication,
    presenceNow,
  } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const isOwner = userRole === 'owner';
  const canEditStaffFarm = ROLE_DEFINITIONS[userRole].permissions.canEditStaffFarm; // owner, admin, hr
  const canEditVehAndNotes = ROLE_DEFINITIONS[userRole].permissions.canEditStaffVehicleAndNotes; // owner, admin

  const [activeTab, setActiveTab] = useState<'roster' | 'create' | 'applications'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // New User Form State (Owner only)
  const [newNick, setNewNick] = useState('');
  const [newCid, setNewCid] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDiscord, setNewDiscord] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newDepartment, setNewDepartment] = useState('Цех добычи');
  const [newRankNumber, setNewRankNumber] = useState<number>(4);

  const [createError, setCreateError] = useState('');
  const [createdCredentialsCard, setCreatedCredentialsCard] = useState<{
    nick: string;
    cid: string;
    phone: string;
    discord: string;
    pin: string;
    roleTitle: string;
  } | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Edit PIN state (Owner only)
  const [editingPinUserId, setEditingPinUserId] = useState<string | null>(null);
  const [editPinValue, setEditPinValue] = useState('');

  // Edit Vehicle & BioNotes state (Owner & Admin ONLY)
  const [editingNotesUserId, setEditingNotesUserId] = useState<string | null>(null);
  const [editNotesVal, setEditNotesVal] = useState('');

  // Edit Farm Stats state (Owner, Admin, HR ONLY)
  const [editingFarmUser, setEditingFarmUser] = useState<UserProfile | null>(null);
  const [farmEditMode, setFarmEditMode] = useState<'add' | 'exact'>('add');
  const [farmRock, setFarmRock] = useState('0');
  const [farmWood, setFarmWood] = useState('0');
  const [farmBlue, setFarmBlue] = useState('0');
  const [farmRed, setFarmRed] = useState('0');
  const [farmPink, setFarmPink] = useState('0');
  const [farmWallet, setFarmWallet] = useState('0');

  // Recruitment queue (applications from the public portal)
  const [applicationFilter, setApplicationFilter] = useState<'pending' | 'all'>('pending');
  const [reviewTargetId, setReviewTargetId] = useState<string | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [reviewPin, setReviewPin] = useState('');
  const [reviewRole, setReviewRole] = useState<UserRole>('employee');
  const [reviewDepartment, setReviewDepartment] = useState('Цех добычи');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [approvedCard, setApprovedCard] = useState<{
    nick: string;
    cid: string;
    phone: string;
    discord: string;
    pin: string;
    roleTitle: string;
    botNotified?: boolean;
  } | null>(null);
  const [copiedApproved, setCopiedApproved] = useState(false);

  const pendingApplications = applications.filter((a) => a.status === 'pending');
  const visibleApplications =
    applicationFilter === 'pending' ? pendingApplications : applications;

  const startReview = (appId: string, mode: 'approve' | 'reject') => {
    setReviewTargetId(appId);
    setReviewMode(mode);
    setReviewError('');
    setReviewPin('');
    setReviewReason('');
    setReviewRole('employee');
    setReviewDepartment('Цех добычи');
  };

  const cancelReview = () => {
    setReviewTargetId(null);
    setReviewError('');
  };

  const handleApproveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetId) return;
    const target = applications.find((a) => a.id === reviewTargetId);
    if (!target) return;

    if (!reviewPin.trim()) {
      setReviewError('Введите PIN-код, по которому сотрудник будет входить в портал.');
      return;
    }

    setReviewBusy(true);
    setReviewError('');
    const result = await approveCandidateApplication(reviewTargetId, {
      pin: reviewPin.trim(),
      role: reviewRole,
      department: reviewDepartment.trim() || 'Цех добычи',
    });
    setReviewBusy(false);

    if (!result.success) {
      setReviewError(result.error || 'Не удалось принять заявку.');
      return;
    }

    const botNotified = target.discordVerifiedId
      ? await notifyApplicant(target, 'approved', {
          pin: reviewPin.trim(),
          roleTitle: ROLE_DEFINITIONS[reviewRole].title,
        })
      : undefined;

    setApprovedCard({
      nick: target.nick,
      cid: target.cid,
      phone: target.phone,
      discord: target.discord,
      pin: reviewPin.trim(),
      roleTitle: ROLE_DEFINITIONS[reviewRole].title,
      botNotified,
    });
    cancelReview();
  };

  const handleRejectApplication = async () => {
    if (!reviewTargetId) return;
    const target = applications.find((a) => a.id === reviewTargetId);
    if (!target) return;
    setReviewBusy(true);
    setReviewError('');
    const result = await rejectCandidateApplication(reviewTargetId, reviewReason);
    setReviewBusy(false);
    if (!result.success) {
      setReviewError(result.error || 'Не удалось отклонить заявку.');
      return;
    }
    if (target.discordVerifiedId) {
      await notifyApplicant(target, 'rejected', {
        reason: reviewReason.trim() || 'Отклонено без комментария.',
      });
    }
    cancelReview();
  };

  const handleCopyApproved = () => {
    if (!approvedCard) return;
    const text = `Реквизиты для входа в портал APATHY:
Ник: ${approvedCard.nick}
CID: ${approvedCard.cid}
Телефон: ${approvedCard.phone}
Discord: ${approvedCard.discord}
PIN-код: ${approvedCard.pin}
Роль: ${approvedCard.roleTitle}`;
    navigator.clipboard.writeText(text);
    setCopiedApproved(true);
    setTimeout(() => setCopiedApproved(false), 2500);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreatedCredentialsCard(null);

    if (!newNick.trim() || !newCid.trim() || !newPhone.trim() || !newDiscord.trim() || !newPin.trim()) {
      setCreateError('Все 5 полей (NickName, CID, Телефон, Discord, PIN) обязательны для заполнения!');
      return;
    }

    const result = await createUserByAdmin({
      displayName: newNick.trim(),
      cid: newCid.trim().toUpperCase(),
      phone: newPhone.trim(),
      discord: newDiscord.trim(),
      pin: newPin.trim(),
      role: newRole,
      rankNumber: Number(newRankNumber) || 4,
      department: newDepartment.trim() || 'Цех добычи',
    });

    if (!result.success) {
      setCreateError(result.error || 'Не удалось создать сотрудника.');
      return;
    }

    setCreatedCredentialsCard({
      nick: newNick.trim(),
      cid: newCid.trim().toUpperCase(),
      phone: newPhone.trim(),
      discord: newDiscord.trim(),
      pin: newPin.trim(),
      roleTitle: ROLE_DEFINITIONS[newRole].title,
    });

    setNewNick('');
    setNewCid('');
    setNewPhone('');
    setNewDiscord('');
    setNewPin('');
    setNewRole('employee');
  };

  const handleCopyCredentials = () => {
    if (!createdCredentialsCard) return;
    const text = `Реквизиты для входа в портал APATHY:
Ник: ${createdCredentialsCard.nick}
CID: ${createdCredentialsCard.cid}
Телефон: ${createdCredentialsCard.phone}
Discord: ${createdCredentialsCard.discord}
PIN-код: ${createdCredentialsCard.pin}
Роль: ${createdCredentialsCard.roleTitle}`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleRoleChange = (userId: string, targetRole: UserRole) => {
    if (!isOwner) return;
    updateUserCredentialsByOwner(userId, { role: targetRole });
  };

  const handleRankChange = (userId: string, nextRank: number) => {
    if (!isOwner) return;
    updateUserCredentialsByOwner(userId, { rankNumber: nextRank });
  };

  const handleSavePin = (userId: string) => {
    if (!isOwner) return;
    if (!editPinValue.trim()) return;
    updateUserCredentialsByOwner(userId, { pin: editPinValue.trim() });
    setEditingPinUserId(null);
    setEditPinValue('');
  };

  const handleOpenFarmModal = (u: UserProfile, mode: 'add' | 'exact') => {
    setEditingFarmUser(u);
    setFarmEditMode(mode);
    if (mode === 'add') {
      setFarmRock('0');
      setFarmWood('0');
      setFarmBlue('0');
      setFarmRed('0');
      setFarmPink('0');
      setFarmWallet(String(u.walletBalance || 0));
    } else {
      setFarmRock(String(u.farmStats?.rock || 0));
      setFarmWood(String(u.farmStats?.wood || 0));
      setFarmBlue(String(u.farmStats?.blueFlower || 0));
      setFarmRed(String(u.farmStats?.redFlower || 0));
      setFarmPink(String(u.farmStats?.pinkFlower || 0));
      setFarmWallet(String(u.walletBalance || 0));
    }
  };

  const handleSaveFarmModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmUser || !canEditStaffFarm) return;

    const r = Math.max(0, parseInt(farmRock, 10) || 0);
    const w = Math.max(0, parseInt(farmWood, 10) || 0);
    const b = Math.max(0, parseInt(farmBlue, 10) || 0);
    const rd = Math.max(0, parseInt(farmRed, 10) || 0);
    const p = Math.max(0, parseInt(farmPink, 10) || 0);

    if (farmEditMode === 'add') {
      recordFarmSubmission(editingFarmUser.id, {
        rock: r,
        wood: w,
        blueFlower: b,
        redFlower: rd,
        pinkFlower: p,
      });
    } else {
      updateStaffFarmStats(editingFarmUser.id, {
        rock: r,
        wood: w,
        blueFlower: b,
        redFlower: rd,
        pinkFlower: p,
        walletBalance: Math.max(0, parseInt(farmWallet, 10) || 0),
      });
    }

    setEditingFarmUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.cid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.discord.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Управление Персоналом & Реестр Аккаунтов
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isOwner
              ? 'Регистрация сотрудников (Владелец), закрепление авто и заметок (Владелец/Админ), управление добычей (Владелец/Админ/HR).'
              : canEditVehAndNotes
              ? 'Закрепление транспорта из автопарка, служебные заметки и редактирование добычи ресурсов.'
              : canEditStaffFarm
              ? 'Реестр сотрудников и управление добычей ресурсов персонала (Отдел кадров HR).'
              : 'Служебный реестр сотрудников, должностей и текущей выработки.'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 font-mono-custom text-xs">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-cyan-500 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Штат сотрудников ({users.length})
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Зарегистрировать сотрудника</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>
              Заявки{pendingApplications.length > 0 ? ` (${pendingApplications.length})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Farm Editor Modal (Owner, Admin, HR) */}
      {canEditStaffFarm && editingFarmUser && (
        <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/40 shadow-2xl animate-fadeIn font-mono-custom text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase">
                  Добыча ресурсов сотрудника: {editingFarmUser.displayName} (CID: {editingFarmUser.cid})
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Доступно только Владельцу, Администратору и Отделу кадров (HR)
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingFarmUser(null)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleOpenFarmModal(editingFarmUser, 'add')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                farmEditMode === 'add'
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              + Добавить сданную добычу (по прайсу в баланс и казну)
            </button>
            <button
              type="button"
              onClick={() => handleOpenFarmModal(editingFarmUser, 'exact')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                farmEditMode === 'exact'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              Изменить точные значения в профиле
            </button>
          </div>

          <form onSubmit={handleSaveFarmModal} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-amber-400 mb-1 text-[11px]">🪨 Порода (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={farmRock}
                  onChange={(e) => setFarmRock(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-cyan-400 mb-1 text-[11px]">🪵 Дерево (шт.):</label>
                <input
                  type="number"
                  min="0"
                  value={farmWood}
                  onChange={(e) => setFarmWood(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-blue-400 mb-1 text-[11px]">💠 Синий цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={farmBlue}
                  onChange={(e) => setFarmBlue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-rose-400 mb-1 text-[11px]">🌺 Красный цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={farmRed}
                  onChange={(e) => setFarmRed(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-pink-400 mb-1 text-[11px]">🌸 Розовый цв.:</label>
                <input
                  type="number"
                  min="0"
                  value={farmPink}
                  onChange={(e) => setFarmPink(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                />
              </div>
              {farmEditMode === 'exact' && (
                <div>
                  <label className="block text-emerald-400 mb-1 text-[11px]">💰 Баланс ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={farmWallet}
                    onChange={(e) => setFarmWallet(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingFarmUser(null)}
                className="px-4 py-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer"
              >
                {farmEditMode === 'add' ? 'Начислить добычу' : 'Сохранить точные значения'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: RECRUITMENT APPLICATIONS (from the public portal) */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono-custom text-zinc-400">
              <Inbox className="w-4 h-4 text-emerald-400" />
              <span>
                Анкеты кандидатов с публичного сайта APATHY. Принятие заявки выпускает
                учетную запись сотрудника с указанным вами PIN-кодом.
              </span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 font-mono-custom text-xs">
              <button
                onClick={() => setApplicationFilter('pending')}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  applicationFilter === 'pending'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ожидают решения ({pendingApplications.length})
              </button>
              <button
                onClick={() => setApplicationFilter('all')}
                className={`px-3 py-1 rounded-lg cursor-pointer ${
                  applicationFilter === 'all'
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Все ({applications.length})
              </button>
            </div>
          </div>

          {!isOwner && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px] font-mono-custom">
              Просмотр очереди заявок. Принимать и отклонять анкеты может только Владелец корпорации.
            </div>
          )}

          {approvedCard && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 shadow-xl animate-fadeIn font-mono-custom">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <UserCheck className="w-5 h-5" />
                  <span>
                    Заявка принята — {approvedCard.nick} зачислен(а) в штат.
                    {approvedCard.botNotified === true
                      ? ' Бот отправил реквизиты кандидату в Discord:'
                      : approvedCard.botNotified === false
                      ? ' Бот не смог доставить сообщение — передайте реквизиты вручную:'
                      : ' Передайте реквизиты в Discord:'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyApproved}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedApproved ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedApproved ? 'Скопировано!' : 'Скопировать'}
                  </button>
                  <button
                    onClick={() => setApprovedCard(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-black/50 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">NickName</span>
                  <b className="text-white text-sm">{approvedCard.nick}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">CID</span>
                  <b className="text-cyan-400 text-sm">{approvedCard.cid}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Телефон</span>
                  <b className="text-zinc-200 text-sm">{approvedCard.phone}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Discord</span>
                  <b className="text-blue-300 text-sm">{approvedCard.discord}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">PIN-код</span>
                  <b className="text-amber-400 text-sm">{approvedCard.pin}</b>
                </div>
              </div>
            </div>
          )}

          {visibleApplications.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-zinc-950 border border-white/10">
              <Clock className="w-8 h-8 mx-auto mb-3 text-zinc-600" />
              <p className="text-xs font-mono-custom text-zinc-500">
                {applications.length === 0
                  ? 'Заявок пока нет. Анкеты с публичного сайта появятся здесь автоматически, без перезагрузки страницы.'
                  : 'Нет заявок с этим статусом.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono-custom text-xs">
              {visibleApplications.map((app) => {
                const isReviewed = app.status !== 'pending';
                const statusBadge =
                  app.status === 'approved'
                    ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40'
                    : app.status === 'rejected'
                    ? 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                    : 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40';
                const statusLabel =
                  app.status === 'approved'
                    ? 'Принята'
                    : app.status === 'rejected'
                    ? 'Отклонена'
                    : 'Ожидает решения';

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl bg-zinc-950 border flex flex-col gap-3 shadow-lg ${
                      app.status === 'pending' ? 'border-emerald-500/25' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{app.nick}</h4>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          CID: <b className="text-cyan-400">{app.cid}</b> · {app.submittedAt.replace('T', ' ').slice(0, 16)}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                      <div className="flex justify-between text-zinc-400">
                        <span>Телефон:</span>
                        <span className="text-zinc-200">{app.phone}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Discord для связи:</span>
                        <span className="text-blue-300">{app.discord}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 text-zinc-400 pt-1 border-t border-white/5">
                        <span>Скрин документов:</span>
                        <a
                          href={app.docs}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-white underline flex items-center gap-1 truncate max-w-[60%]"
                        >
                          <span className="truncate">{app.docs}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    {isReviewed && (
                      <div className="text-[11px] text-zinc-500 border-t border-white/5 pt-2">
                        Обработано: {app.reviewedAt || '—'}
                        {app.reviewerNotes ? ` · Причина: ${app.reviewerNotes}` : ''}
                      </div>
                    )}

                    {isOwner && !isReviewed && reviewTargetId !== app.id && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => startReview(app.id, 'approve')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Принять</span>
                        </button>
                        <button
                          onClick={() => startReview(app.id, 'reject')}
                          className="flex-1 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Отклонить</span>
                        </button>
                      </div>
                    )}

                    {isOwner && reviewTargetId === app.id && reviewMode === 'approve' && (
                      <form
                        onSubmit={handleApproveApplication}
                        className="space-y-3 p-3 rounded-xl bg-black/50 border border-emerald-500/30"
                      >
                        <div className="text-[11px] text-emerald-300">
                          Учетная запись будет создана по данным заявки. Введите PIN-код для входа сотрудника.
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-zinc-400 mb-1 text-[10px]">
                              PIN-код для входа: <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={reviewPin}
                              onChange={(e) => setReviewPin(e.target.value)}
                              placeholder="1234"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1 text-[10px]">Роль в корпорации:</label>
                            <select
                              value={reviewRole}
                              onChange={(e) => setReviewRole(e.target.value as UserRole)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                            >
                              <option value="employee">Сотрудник / Фармер</option>
                              <option value="hr">Отдел кадров (HR)</option>
                              <option value="manager">Менеджер / Логист</option>
                              <option value="admin">Администратор / Зам</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-zinc-400 mb-1 text-[10px]">Отдел:</label>
                            <input
                              type="text"
                              value={reviewDepartment}
                              onChange={(e) => setReviewDepartment(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>
                        {reviewError && (
                          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px]">
                            {reviewError}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={reviewBusy}
                            className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                            <span>{reviewBusy ? 'Создание учетной записи...' : 'Создать учетную запись'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={cancelReview}
                            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </form>
                    )}

                    {isOwner && reviewTargetId === app.id && reviewMode === 'reject' && (
                      <div className="space-y-3 p-3 rounded-xl bg-black/50 border border-rose-500/30">
                        <div className="text-[11px] text-rose-300">
                          Причина отказа сохранится в карточке заявки и в журнале аудита.
                        </div>
                        <input
                          type="text"
                          value={reviewReason}
                          onChange={(e) => setReviewReason(e.target.value)}
                          placeholder="Например: документы нечитаемы, CID не совпадает"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-rose-500/40 text-white text-xs focus:outline-none focus:border-rose-400"
                        />
                        {reviewError && (
                          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px]">
                            {reviewError}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectApplication}
                            disabled={reviewBusy}
                            className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold cursor-pointer"
                          >
                            {reviewBusy ? 'Обработка...' : 'Подтвердить отказ'}
                          </button>
                          <button
                            onClick={cancelReview}
                            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CREATE USER (OWNER ONLY) */}
      {isOwner && activeTab === 'create' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-purple-500/40 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Регистрация новой учетной записи
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono-custom">
                    Данные сохраняются в единую БД. Сотрудник входит по этим точным реквизитам.
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono-custom px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                ПРАВА ВЛАДЕЛЬЦА
              </span>
            </div>

            {createError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono-custom">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-custom text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">
                    Игровой NickName: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    placeholder="Alex_Mason"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    CID в игре: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCid}
                    onChange={(e) => setNewCid(e.target.value)}
                    placeholder="0042"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Телефон в игре: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="555-789"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Discord тег: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newDiscord}
                    onChange={(e) => setNewDiscord(e.target.value)}
                    placeholder="alex#0042"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Персональный PIN-код: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">
                    Роль в корпорации: <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="admin">Администратор / Зам</option>
                    <option value="manager">Менеджер / Логист</option>
                    <option value="hr">Отдел кадров (HR)</option>
                    <option value="employee">Сотрудник / Фармер</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Отдел:</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="Цех добычи"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Ранг:</label>
                  <select
                    value={newRankNumber}
                    onChange={(e) => setNewRankNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-purple-400"
                  >
                    {[...RANK_OPTIONS].reverse().map((n) => (
                      <option key={n} value={n}>
                        [{String(n).padStart(2, '0')}] {RANK_LADDER[n]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono-custom text-zinc-500">
                  Все 5 полей будут строго проверяться при входе в закрытый портал.
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-500 hover:bg-purple-400 text-white transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Зарегистрировать сотрудника
                </button>
              </div>
            </form>
          </div>

          {createdCredentialsCard && (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 shadow-xl animate-fadeIn font-mono-custom">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Сотрудник успешно создан! Передайте ему реквизиты для входа:</span>
                </div>
                <button
                  onClick={handleCopyCredentials}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedNotice ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedNotice ? 'Скопировано!' : 'Скопировать для Discord'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-black/50 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">NickName</span>
                  <b className="text-white text-sm">{createdCredentialsCard.nick}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">CID</span>
                  <b className="text-cyan-400 text-sm">{createdCredentialsCard.cid}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Телефон</span>
                  <b className="text-zinc-200 text-sm">{createdCredentialsCard.phone}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Discord</span>
                  <b className="text-blue-300 text-sm">{createdCredentialsCard.discord}</b>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">PIN-код</span>
                  <b className="text-amber-400 text-sm">{createdCredentialsCard.pin}</b>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROSTER & STAFF LIST */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по NickName, CID или Discord..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Все роли ({users.length})</option>
                <option value="owner">Владельцы</option>
                <option value="admin">Администраторы</option>
                <option value="manager">Менеджеры</option>
                <option value="hr">Отдел кадров</option>
                <option value="employee">Сотрудники / Фармеры</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const roleInfo = ROLE_DEFINITIONS[u.role];
              const isRootOwner = u.role === 'owner';
              const totalFlowers =
                (u.farmStats?.blueFlower || 0) +
                (u.farmStats?.redFlower || 0) +
                (u.farmStats?.pinkFlower || 0);

              return (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{u.displayName}</h4>
                        <div className="text-[11px] font-mono-custom text-zinc-400 mt-0.5">
                          CID: <b className="text-cyan-400">{u.cid}</b> · Ранг [{u.rankNumber}] {u.rankName}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono-custom px-2 py-0.5 rounded-full border ${roleInfo.badgeColor}`}>
                        {roleInfo.title.split(' ')[0]}
                      </span>
                    </div>

                    {/* Contact & Credentials Details */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono-custom text-xs space-y-1.5 mb-3">
                      <div className="flex justify-between text-zinc-400">
                        <span>Телефон:</span>
                        <span className="text-zinc-200">{u.phone}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Discord:</span>
                        <span className="text-blue-300">{u.discord}</span>
                      </div>
                      {isOwner && (
                        <div className="flex justify-between text-zinc-400 pt-1 border-t border-white/5">
                          <span>PIN для входа:</span>
                          <span className="text-amber-400 font-bold">{u.pin}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-400">
                        <span>Статус:</span>
                        <span
                          className={
                            isProfileOnline(u.lastActive, u.status, presenceNow)
                              ? 'text-emerald-400 font-bold'
                              : 'text-zinc-500'
                          }
                        >
                          {isProfileOnline(u.lastActive, u.status, presenceNow)
                            ? '● В сети'
                            : '○ Не в сети'}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Vehicle & Service Notes (Editable ONLY by Owner & Admin) */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono-custom text-[11px] space-y-2 mb-3">
                      <div>
                        <div className="text-zinc-500 flex items-center gap-1 text-[10px] mb-1">
                          <Truck className="w-3 h-3 text-cyan-400" />
                          <span>Закреплённый транспорт (из автопарка):</span>
                        </div>
                        {canEditVehAndNotes ? (
                          <select
                            value={u.assignedVehicle || '-'}
                            onChange={(e) =>
                              updateStaffVehicleAndNotes(u.id, { assignedVehicle: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-[11px] focus:outline-none focus:border-cyan-400"
                          >
                            <option value="-">— Не закреплён —</option>
                            {fleet.map((veh) => {
                              const label = `${veh.modelName} [${veh.plate}]`;
                              return (
                                <option key={veh.id} value={label}>
                                  {veh.modelName} [{veh.plate}] ({veh.trunkKg} кг)
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <div className="text-zinc-200 font-semibold">
                            {u.assignedVehicle && u.assignedVehicle !== '-'
                              ? u.assignedVehicle
                              : '— Не закреплён —'}
                          </div>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-white/5">
                        <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-cyan-400" />
                            Служебные заметки:
                          </span>
                          {canEditVehAndNotes && editingNotesUserId !== u.id && (
                            <button
                              onClick={() => {
                                setEditingNotesUserId(u.id);
                                setEditNotesVal(u.bioNotes || '');
                              }}
                              className="text-cyan-400 hover:underline cursor-pointer"
                            >
                              Изменить
                            </button>
                          )}
                        </div>

                        {canEditVehAndNotes && editingNotesUserId === u.id ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={editNotesVal}
                              onChange={(e) => setEditNotesVal(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-zinc-900 border border-cyan-500/40 text-white text-[11px] focus:outline-none"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  updateStaffVehicleAndNotes(u.id, { bioNotes: editNotesVal });
                                  setEditingNotesUserId(null);
                                }}
                                className="px-2.5 py-1 rounded bg-cyan-500 text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3 h-3" />
                                Сохранить
                              </button>
                              <button
                                onClick={() => setEditingNotesUserId(null)}
                                className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-300 leading-snug">
                            {u.bioNotes || '—'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Real Farm Stats (Editable by Owner, Admin, HR) */}
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 font-mono-custom text-[11px] space-y-1 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-wider">
                          Добыча ресурсов (Фарм):
                        </span>
                        {canEditStaffFarm && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenFarmModal(u, 'add')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900 flex items-center gap-0.5 cursor-pointer"
                              title="Начислить сданную добычу по прайсу"
                            >
                              <PlusCircle className="w-2.5 h-2.5" />
                              <span>+Добыча</span>
                            </button>
                            <button
                              onClick={() => handleOpenFarmModal(u, 'exact')}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 cursor-pointer"
                              title="Редактировать точные цифры добычи"
                            >
                              Ред.
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>🪨 Порода ($5.000):</span>
                        <b className="text-white">{u.farmStats?.rock || 0} шт.</b>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>🪵 Дерево ($2.500):</span>
                        <b className="text-white">{u.farmStats?.wood || 0} шт.</b>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>🌸 Цветы ($1.500):</span>
                        <b className="text-white">{totalFlowers} шт.</b>
                      </div>
                      <div className="flex justify-between text-emerald-400 pt-1 border-t border-white/5 font-bold">
                        <span>Баланс выплат:</span>
                        <span>${u.walletBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="pt-3 border-t border-white/10 space-y-2 font-mono-custom text-xs">
                      {!isRootOwner ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 shrink-0">Роль:</span>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                            >
                              <option value="admin">Администратор</option>
                              <option value="manager">Менеджер</option>
                              <option value="hr">Отдел кадров</option>
                              <option value="employee">Сотрудник</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-500 shrink-0">Ранг:</span>
                            <select
                              value={u.rankNumber}
                              onChange={(e) => handleRankChange(u.id, Number(e.target.value))}
                              className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400"
                            >
                              {[...RANK_OPTIONS].reverse().map((n) => (
                                <option key={n} value={n}>
                                  [{String(n).padStart(2, '0')}] {RANK_LADDER[n]}
                                </option>
                              ))}
                            </select>
                          </div>

                          {editingPinUserId === u.id ? (
                            <div className="flex gap-1 pt-1">
                              <input
                                type="text"
                                value={editPinValue}
                                onChange={(e) => setEditPinValue(e.target.value)}
                                placeholder="Новый PIN"
                                className="w-24 px-2 py-1 rounded bg-black border border-amber-500/40 text-amber-300 text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleSavePin(u.id)}
                                className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px] cursor-pointer"
                              >
                                Сохранить
                              </button>
                              <button
                                onClick={() => setEditingPinUserId(null)}
                                className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPinUserId(u.id);
                                setEditPinValue(u.pin);
                              }}
                              className="w-full py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-amber-300 text-center block transition-colors cursor-pointer"
                            >
                              Сменить PIN-код ({u.pin})
                            </button>
                          )}

                          <button
                            onClick={() => deleteUser(u.id)}
                            className="w-full py-1 rounded bg-rose-950/40 hover:bg-rose-950 border border-rose-500/30 text-[10px] text-rose-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Забрать доступ (Удалить)
                          </button>
                        </>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-purple-400 text-center">
                            Аккаунт Владельца корпорации
                          </div>
                          {editingPinUserId === u.id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={editPinValue}
                                onChange={(e) => setEditPinValue(e.target.value)}
                                placeholder="Новый PIN"
                                className="w-24 px-2 py-1 rounded bg-black border border-amber-500/40 text-amber-300 text-xs focus:outline-none"
                              />
                              <button
                                onClick={() => handleSavePin(u.id)}
                                className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px] cursor-pointer"
                              >
                                Сохранить
                              </button>
                              <button
                                onClick={() => setEditingPinUserId(null)}
                                className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] cursor-pointer"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPinUserId(u.id);
                                setEditPinValue(u.pin);
                              }}
                              className="w-full py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-amber-300 text-center block transition-colors cursor-pointer"
                            >
                              Сменить PIN Владельца ({u.pin})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
