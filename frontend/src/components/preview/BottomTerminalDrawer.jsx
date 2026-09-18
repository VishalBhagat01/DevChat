import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../../utils/soundEffects';

const BottomTerminalDrawer = ({
  isOpen,
  onClose,
  runStatus = 'idle',
  runOutput = [],
  onRunProject,
  onStopProject,
  onClearLogs,
  fileTree = {},
  onOpenPreviewModal,
  iframeUrl,
}) => {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'package'
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (autoScroll && activeTab === 'terminal' && terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [runOutput, autoScroll, activeTab]);

  if (!isOpen) return null;

  // Parse package.json
  let packageJson = {};
  if (fileTree['package.json']?.file?.contents) {
    try {
      packageJson = JSON.parse(fileTree['package.json'].file.contents);
    } catch {
      packageJson = {};
    }
  }

  return (
    <div
      className={`flex flex-col border-t border-white/[0.08] bg-[#09090d] transition-all duration-200 select-none ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Header Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0d0d12] px-3">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'terminal'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'
            }`}
          >
            <i className="ri-terminal-box-line text-xs"></i>
            <span>Terminal</span>
            {runStatus !== 'idle' && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  runStatus === 'running' || runStatus === 'ready'
                    ? 'bg-emerald-400 animate-pulse'
                    : runStatus === 'installing'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('package')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'package'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'
            }`}
          >
            <i className="ri-archive-line text-xs"></i>
            <span>Package Info</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-neutral-500 mr-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                runStatus === 'running'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : runStatus === 'installing'
                  ? 'bg-amber-400'
                  : 'bg-neutral-600'
              }`}
            />
            <span className="capitalize">{runStatus}</span>
          </div>

          {/* Stop / Run Controls */}
          {runStatus === 'running' || runStatus === 'ready' ? (
            <button
              type="button"
              onClick={() => {
                onStopProject?.();
                sounds.playPop();
              }}
              title="Stop execution"
              className="flex h-6 items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-2 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 active:scale-95"
            >
              <i className="ri-stop-fill text-xs"></i>
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onRunProject?.();
                sounds.playClick();
              }}
              disabled={runStatus === 'installing'}
              className="flex h-6 items-center gap-1 rounded bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-500 active:scale-95 shadow-sm shadow-emerald-950/40"
            >
              <i className="ri-play-fill text-xs"></i>
              <span>{runStatus === 'installing' ? 'Installing...' : 'Run'}</span>
            </button>
          )}

          {/* Open Web Preview Modal */}
          <button
            type="button"
            onClick={onOpenPreviewModal}
            title="Open Web Preview Window"
            className="flex h-6 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.02] px-2 text-[11px] text-neutral-300 hover:bg-white/[0.06] hover:text-white"
          >
            <i className="ri-window-line text-xs text-blue-400"></i>
            <span className="hidden md:inline">Preview Window</span>
          </button>

          {/* Expand / Minimize */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse Height' : 'Expand Height'}
            className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-white/[0.06] hover:text-white text-xs"
          >
            <i className={isExpanded ? 'ri-contract-up-down-line' : 'ri-expand-up-down-line'}></i>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close Terminal Drawer"
            className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-white/[0.06] hover:text-white text-xs"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {activeTab === 'terminal' && (
        <div className="flex min-h-0 flex-1 flex-col bg-[#07070a]">
          {/* Sub-toolbar */}
          <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/[0.04] bg-[#0a0a0f] px-3 font-mono text-[10px] text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">bash - WebContainer</span>
              <span>•</span>
              <span>{runOutput.length} lines</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`transition-colors ${
                  autoScroll ? 'text-blue-400 font-medium' : 'hover:text-neutral-300'
                }`}
              >
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={onClearLogs}
                className="hover:text-neutral-300"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output log */}
          <div
            ref={terminalEndRef}
            className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 text-neutral-300 selection:bg-blue-500/30 scrollbar-none"
          >
            {runOutput.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-neutral-600">
                <i className="ri-terminal-line text-2xl mb-1 text-neutral-700"></i>
                <p>Click "Run" to install dependencies and boot the WebContainer node server.</p>
              </div>
            ) : (
              runOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={`whitespace-pre-wrap ${
                    line.includes('error') || line.includes('Error') || line.includes('FAIL')
                      ? 'text-rose-400 font-semibold'
                      : line.includes('warn') || line.includes('Warning')
                      ? 'text-amber-300'
                      : line.includes('Ready') || line.includes('ready') || line.includes('success')
                      ? 'text-emerald-300'
                      : 'text-neutral-300'
                  }`}
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Package Inspector Tab */}
      {activeTab === 'package' && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-[#07070a] space-y-3 scrollbar-none">
          <div className="rounded-xl border border-white/[0.06] bg-[#0d0d12] p-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
              <i className="ri-node-tree text-emerald-400"></i>
              <span>{packageJson.name || 'Project'}</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-neutral-400">
                v{packageJson.version || '1.0.0'}
              </span>
            </h4>

            {packageJson.scripts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-xs">
                {Object.entries(packageJson.scripts).map(([key, cmd]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1 text-neutral-300"
                  >
                    <span className="text-blue-400 font-medium">{key}</span>
                    <span className="text-neutral-500 truncate max-w-[140px]">{cmd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomTerminalDrawer;
