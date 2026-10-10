import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { FileText, Search, Lock, CheckCircle2 } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../../types/database';

export const StaffAuditLogsView: React.FC = () => {
  const { auditLogs, currentUser } = useDatabase();

  const userRole = currentUser?.role || 'employee';
  const canView = ROLE_DEFINITIONS[userRole].permissions.canViewAuditLogs;

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesModule = selectedModule === 'all' || log.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Журнал Действий Сотрудников (Audit Trail)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Неизменяемый реестр всех изменений в системе: начисление добычи, рапорты, казна, автопарк и профили.
          </p>
        </div>

        {!canView ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono-custom">
            <Lock className="w-3.5 h-3.5" />
            <span>Требуются права Администратора или Владельца</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono-custom">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Протокол безопасности: Активен (100% фиксация)</span>
          </div>
        )}
      </div>

      {!canView ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-white/5 space-y-3">
          <Lock className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Доступ к аудиту ограничен</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Журнал действий доступен только Владельцу и Администраторам корпорации.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по сотруднику, действию или деталям..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono-custom focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Все' },
                { id: 'farm', label: 'Добыча' },
                { id: 'bonus_report', label: 'Рапорты' },
                { id: 'treasury', label: 'Казна/KPI' },
                { id: 'fleet', label: 'Автопарк' },
                { id: 'users', label: 'Кадры' },
                { id: 'profile', label: 'Профили' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-custom shrink-0 transition-all cursor-pointer ${
                    selectedModule === m.id
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-custom text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400">
                    <th className="py-3 px-4 font-semibold">Время</th>
                    <th className="py-3 px-4 font-semibold">Сотрудник</th>
                    <th className="py-3 px-4 font-semibold">Роль</th>
                    <th className="py-3 px-4 font-semibold">Раздел</th>
                    <th className="py-3 px-4 font-semibold">Действие & Детали</th>
                    <th className="py-3 px-4 font-semibold">Значения (До / После)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-500 font-mono-custom text-xs">
                        Журнал аудита чист. Записи действий фиксируются автоматически при изменении данных.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const roleInfo = ROLE_DEFINITIONS[log.actorRole] || ROLE_DEFINITIONS.employee;
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 text-zinc-500 whitespace-nowrap text-[11px]">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {log.actorName}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${roleInfo.badgeColor}`}
                            >
                              {roleInfo.title.split(' ')[0]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-cyan-400 whitespace-nowrap uppercase text-[10px]">
                            {log.module}
                          </td>
                          <td className="py-3 px-4 max-w-md">
                            <div className="text-zinc-200 font-semibold">{log.action}</div>
                            <div className="text-[11px] text-zinc-400">{log.details}</div>
                          </td>
                          <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                            {log.oldValue && log.newValue ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 line-through">{log.oldValue}</span>
                                <span className="text-zinc-400">➔</span>
                                <span className="text-emerald-400 font-bold">{log.newValue}</span>
                              </div>
                            ) : log.newValue ? (
                              <span className="text-emerald-400">{log.newValue}</span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
