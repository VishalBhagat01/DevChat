import React from 'react';
import { getFileDetails } from '../../utils/fileIcons';

const EditorStatusBar = ({
  currentFile,
  cursorPos = { line: 1, col: 1 },
  isDirty = false,
  webContainerReady = false,
  runStatus = 'idle',
  onSave,
}) => {
  const { language } = getFileDetails(currentFile || '');

  return (
    <footer className="flex h-7 shrink-0 select-none items-center justify-between border-t border-white/[0.08] bg-[#0c0c10] px-3 font-mono text-[11px] text-neutral-400">
      {/* Left: File position & save status */}
      <div className="flex items-center gap-3">
        {currentFile ? (
          <>
            <button
              type="button"
              onClick={onSave}
              className={`flex items-center gap-1.5 transition-colors ${
                isDirty
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={isDirty ? 'Click or press Ctrl+S to save' : 'File is saved'}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span>{isDirty ? 'Unsaved (Ctrl+S)' : 'Saved'}</span>
            </button>
            <span className="text-neutral-700">|</span>
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
          </>
        ) : (
          <span className="text-neutral-600">DevChat Cloud IDE</span>
        )}
      </div>

      {/* Right: Runtime & language info */}
      <div className="flex items-center gap-3">
        {/* WebContainer Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              webContainerReady
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-neutral-600'
            }`}
          />
          <span className="text-neutral-500">
            {runStatus === 'running'
              ? 'Server Live'
              : runStatus === 'installing'
              ? 'Installing deps'
              : webContainerReady
              ? 'WebContainer Active'
              : 'Container Booting'}
          </span>
        </div>

        <span className="text-neutral-700">|</span>
        <span>Spaces: 2</span>
        <span className="text-neutral-700">|</span>
        <span>UTF-8</span>
        {currentFile && (
          <>
            <span className="text-neutral-700">|</span>
            <span className="capitalize text-blue-400 font-medium">
              {language}
            </span>
          </>
        )}
      </div>
    </footer>
  );
};

export default EditorStatusBar;
