import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const { notifications, activeToastIds, dismissToast } = useDatabase();

  const visibleToasts = notifications.filter((n) => activeToastIds.includes(n.id)).slice(0, 4);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const getBorder = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-[#07130f]/95';
      case 'warning':
        return 'border-amber-500/40 bg-[#161208]/95';
      case 'alert':
        return 'border-rose-500/40 bg-[#19090c]/95';
      default:
        return 'border-cyan-500/40 bg-[#061219]/95';
    }
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-500 transform translate-y-0 animate-fadeIn ${getBorder(
            toast.type
          )}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {getIcon(toast.type)}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    {toast.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono-custom">
                    {toast.timestamp}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {toast.message}
                </p>
                {toast.actorName && (
                  <div className="text-[10px] text-zinc-500 font-mono-custom mt-1">
                    Сотрудник: <span className="text-cyan-400">{toast.actorName}</span>
                  </div>
                )}
                <div className="mt-2 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-[shrink_5s_linear_forwards]" />
                </div>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors p-1"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
