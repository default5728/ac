import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Shield, LogIn, Lock, AlertCircle, Cloud } from 'lucide-react';

export const StaffAuthScreen: React.FC = () => {
  const { loginWithCredentials } = useDatabase();

  const [nick, setNick] = useState('');
  const [cid, setCid] = useState('');
  const [phone, setPhone] = useState('');
  const [discord, setDiscord] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nick.trim() || !cid.trim() || !phone.trim() || !discord.trim() || !pin.trim()) {
      setErrorMsg('Необходимо указать все 5 параметров: NickName, CID, Телефон, Discord тег и PIN-код.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithCredentials({
      displayName: nick.trim(),
      cid: cid.trim().toUpperCase(),
      phone: phone.trim(),
      discord: discord.trim(),
      pin: pin.trim(),
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Ошибка доступа: данные не найдены.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="galaxy-bg opacity-70" />
      <div className="milkyway-band opacity-60" />

      {/* Corporate Header Badge */}
      <div className="relative z-10 text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono-custom text-xs mb-3 shadow-lg shadow-cyan-950/40">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>ЗАКРЫТЫЙ ПОРТАЛ КОРПОРАЦИИ APATHY · RADMIR RP</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black chrome-text tracking-widest">
          APATHY INTRANET
        </h1>
        <p className="font-mono-custom text-xs text-zinc-400 mt-2 tracking-wider">
          ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ FIREBASE · ЗАЩИТА ДАННЫХ SHA-256
        </p>
      </div>

      {/* Main Login Card (No open registration, no exposed owner credentials) */}
      <div className="relative z-10 w-full max-w-lg bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono-custom font-bold text-white uppercase tracking-wider">
              Авторизация сотрудника
            </span>
          </div>
          <span className="text-[10px] font-mono-custom text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            CLOUD DB REAL-TIME
          </span>
        </div>

        <div className="p-6">
          <p className="text-xs text-zinc-400 mb-4 font-mono-custom leading-relaxed">
            Вход разрешён исключительно сотрудникам, предварительно зарегистрированным <b className="text-white">Владельцем корпорации</b>. Все PIN-коды зашифрованы (SHA-256).
          </p>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono-custom flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                  Игровой NickName: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="Name_Surname"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                  CID в игре: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  placeholder="XXXX"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                  Телефон в игре: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="000-000"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                  Discord тег: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="username"
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono-custom text-zinc-400 mb-1">
                Персональный PIN-код: <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-xs bg-cyan-400 hover:bg-cyan-300 text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Проверка в облачной БД...' : 'Войти в корпоративный портал'}
            </button>
          </form>
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center font-mono-custom text-[11px] text-zinc-500">
        Корпорация APATHY · Облачная синхронизация Google Firebase Firestore
      </div>
    </div>
  );
};
