import React from 'react';

export const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'border-rose-500/30 bg-rose-950/80 text-rose-200'
              : toast.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
              : 'border-indigo-500/30 bg-neutral-900/90 text-neutral-200'
          }`}
        >
          <i
            className={`text-sm ${
              toast.type === 'error'
                ? 'ri-error-warning-line text-rose-400'
                : toast.type === 'success'
                ? 'ri-checkbox-circle-line text-emerald-400'
                : 'ri-information-line text-indigo-400'
            }`}
          />
          <span className="font-medium">{toast.message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-2 text-neutral-400 hover:text-white"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
