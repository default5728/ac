import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { X, Database, ShieldCheck, Radio, Bell, FileText, CheckCircle2 } from 'lucide-react';

export const ArchitectureExplainerModal: React.FC = () => {
  const { isArchitectureModalOpen, closeArchitectureModal } = useDatabase();

  if (!isArchitectureModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Архитектура Системы APATHY RP
                <span className="text-[11px] font-mono-custom px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  Full-Duplex Real-Time
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Единая база данных → 2 ответвления (Публичный сайт + Закрытый портал RBAC)
              </p>
            </div>
          </div>
          <button
            onClick={closeArchitectureModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          <div className="p-5 rounded-xl bg-black/60 border border-zinc-800">
            <div className="text-xs font-mono-custom text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              Интерактивная диаграмма связей в реальном времени
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/60 flex flex-col justify-between h-48">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-custom uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded">
                      Ответвление #1
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono-custom">READ-ONLY</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Публичный Сайт</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">
                    Виден всем гостям и смотрителям. Показывает метрики корпорации, автопарк, Доску Почёта и калькулятор выплат.
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-emerald-400 flex items-center gap-1 font-mono-custom">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Мгновенный Live-Update
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/60 to-zinc-900 border-2 border-cyan-500/40 flex flex-col justify-between h-52 text-center shadow-lg shadow-cyan-950/40">
                <div className="mx-auto w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                  <Database className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ЕДИНАЯ БАЗА ДАННЫХ</h3>
                  <div className="text-[10px] font-mono-custom text-cyan-300 mt-0.5">
                    Single Source of Truth
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-2 font-mono-custom space-y-0.5">
                    <div>• users & pin credentials</div>
                    <div>• farm & resources</div>
                    <div>• treasury & fleet & audit</div>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 border-t border-cyan-900/40 pt-1 font-mono-custom">
                  Шина событий: React Context + Broadcast
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex flex-col justify-between h-48">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-custom uppercase tracking-wider text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded">
                      Ответвление #2
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono-custom">RBAC PROTECTED</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">Закрытый Портал Персонала</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-snug">
                    Скрыт от посторонних глаз. Доступ по ролям к редактированию выработки, статуса смены, автопарка и казны.
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/60 text-[11px] text-purple-300 flex items-center gap-1 font-mono-custom">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  5 Ролей: Владелец, Админ, Менеджер, HR, Сотрудник
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                1. Разграничение Прав (RBAC)
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Каждый пользователь обладает строгой ролью:
                <br /><b className="text-purple-300">• Владелец [10]:</b> Регистрирует сотрудников, рассматривает рапорты на премии, редактирует аналитику, автопарк, транспорт/заметки в профилях и казну.
                <br /><b className="text-red-300">• Администратор [09]:</b> Редактирует аналитику, закреплённый транспорт/служебные заметки, добычу персонала и автопарк.
                <br /><b className="text-pink-300">• Отдел Кадров [05]:</b> Контроль штата и редактирование добычи ресурсов у персонала.
                <br /><b className="text-cyan-300">• Менеджер [06]:</b> Просмотр штата и аналитики.
                <br /><b className="text-emerald-300">• Сотрудник [04]:</b> Личный рабочий профиль, подача рапортов на премирование и калькулятор расчёта выплат.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                2. Как связать и синхронизировать?
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                В основе лежит <b className="text-white">единое реактивное хранилище</b>.
                Все изменения казны, аналитики, доски почёта и автопарка мгновенно формируют Live JSON в шлюзе интеграции для публичного сайта второго разработчика.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                3. Журнал Действий (Audit Trail)
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Любое изменение в базе данных фиксируется в журнале аудита: кто, в какое время, какое поле было изменено, старое и новое значение.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 text-white font-semibold mb-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                4. Система Уведомлений и Рапортов
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Мгновенные оповещения при подаче рапорта на премирование, изменении добычи или корректировке казны.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-xs font-mono-custom text-zinc-400">
            Готовая реализация активна в данном приложении
          </span>
          <button
            onClick={closeArchitectureModal}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-md shadow-cyan-500/20"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
