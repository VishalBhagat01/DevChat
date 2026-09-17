import React from 'react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Open Command Palette (Files & Actions)' },
  { keys: ['Ctrl', 'S'], desc: 'Save current active file' },
  { keys: ['Ctrl', 'Enter'], desc: 'Run / Restart WebContainer project' },
  { keys: ['Shift', 'Alt', 'F'], desc: 'Format active document in editor' },
  { keys: ['Enter'], desc: 'Send message to Copilot or team' },
  { keys: ['Shift', 'Enter'], desc: 'Insert new line in chat input' },
  { keys: ['Esc'], desc: 'Close dialogs, menus, and modals' },
];

const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12121a] p-5 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <i className="ri-keyboard-line text-sm"></i>
            </div>
            <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-white/[0.08] hover:text-white text-xs"
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>

        <div className="space-y-2.5">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2 text-xs"
            >
              <span className="text-neutral-300">{item.desc}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white/[0.08] py-2 text-xs font-medium text-white hover:bg-white/[0.12] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
