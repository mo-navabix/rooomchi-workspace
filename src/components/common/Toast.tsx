import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useApp();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    info: 'bg-slate-900 text-white border-slate-800',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-300 shrink-0" />,
  };

  return (
    <div
      id="toast-notification"
      className="fixed bottom-6 left-6 z-50 max-w-md w-full shadow-2xl transition-all duration-300 transform translate-y-0"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-lg ${bgColors[toast.type]}`}
      >
        {icons[toast.type]}
        <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
        <button
          id="btn-close-toast"
          onClick={hideToast}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          aria-label="بستن اعلان"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
