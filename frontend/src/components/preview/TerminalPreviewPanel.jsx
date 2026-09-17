import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/soundEffects';

const TerminalPreviewPanel = ({
  webContainer,
  iframeUrl,
  runStatus = 'idle', // 'idle' | 'installing' | 'running' | 'ready' | 'error'
  runOutput = [],
  onRunProject,
  onStopProject,
  onClearLogs,
  fileTree = {},
  onUrlChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(iframeUrl ? 'preview' : 'terminal');
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef(null);

  // Auto-switch to preview when iframeUrl becomes available
  useEffect(() => {
    if (iframeUrl) {
      setActiveTab('preview');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.8 },
      });
      sounds.playChime();
    }
  }, [iframeUrl]);

  // Terminal auto-scroll
  useEffect(() => {
    if (autoScroll && activeTab === 'terminal' && terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [runOutput, autoScroll, activeTab]);

  // Parse package.json
  let packageJson = {};
  if (fileTree['package.json']?.file?.contents) {
    try {
      packageJson = JSON.parse(fileTree['package.json'].file.contents);
    } catch {
      packageJson = {};
    }
  }

  const getViewportWidth = () => {
    if (viewportMode === 'mobile') return 'max-w-[390px]';
    if (viewportMode === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="flex h-full flex-col bg-[#0b0b10] border-l border-white/[0.08]">
      {/* Top Header Bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0e0e14] px-3">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'terminal'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
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
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
            }`}
          >
            <i className="ri-window-line text-xs"></i>
            <span>Web Preview</span>
            {iframeUrl && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('package')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'package'
                ? 'bg-white/[0.1] text-white shadow-sm'
                : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
            }`}
          >
            <i className="ri-archive-line text-xs"></i>
            <span>Package Info</span>
          </button>
        </div>

        {/* Run Controls */}
        <div className="flex items-center gap-2">
          {runStatus === 'running' || runStatus === 'ready' ? (
            <button
              type="button"
              onClick={() => {
                onStopProject?.();
                sounds.playPop();
              }}
              title="Stop server"
              className="flex h-7 items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all"
            >
              <i className="ri-stop-fill text-xs"></i>
              <span>Stop</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onRunProject();
              sounds.playClick();
            }}
            disabled={!webContainer || runStatus === 'installing'}
            className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white shadow-lg transition-all active:scale-95 ${
              runStatus === 'installing'
                ? 'bg-amber-600/80 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30'
            }`}
          >
            {runStatus === 'installing' ? (
              <>
                <i className="ri-loader-4-line animate-spin text-xs"></i>
                <span>Installing...</span>
              </>
            ) : runStatus === 'running' ? (
              <>
                <i className="ri-restart-line text-xs"></i>
                <span>Restart</span>
              </>
            ) : (
              <>
                <i className="ri-play-fill text-xs"></i>
                <span>Run</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.08] text-neutral-400 hover:text-white text-xs"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Terminal Console */}
      {activeTab === 'terminal' && (
        <div className="flex min-h-0 flex-1 flex-col bg-[#08080c]">
          {/* Terminal Action Bar */}
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0c0c12] px-3 text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <i className="ri-checkbox-blank-circle-fill text-[8px] text-emerald-400"></i>
                <span>bash - WebContainer</span>
              </span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-500">
                {runOutput.length} lines logged
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-[10px] ${
                  autoScroll ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={onClearLogs}
                className="hover:text-white text-neutral-400"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          <div
            ref={terminalEndRef}
            className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs leading-5 text-neutral-300 selection:bg-indigo-500/30"
          >
            {runOutput.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-neutral-600">
                <i className="ri-terminal-line text-2xl mb-1 text-neutral-700"></i>
                <p>Click "Run" above to install packages and start the dev server.</p>
              </div>
            ) : (
              runOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={`whitespace-pre-wrap ${
                    line.includes('error') || line.includes('Error') || line.includes('FAIL')
                      ? 'text-rose-400'
                      : line.includes('warn') || line.includes('WARN')
                      ? 'text-amber-400'
                      : line.includes('ready') || line.includes('running') || line.includes('success')
                      ? 'text-emerald-400 font-semibold'
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

      {/* Tab 2: Live Web Preview */}
      {activeTab === 'preview' && (
        <div className="flex min-h-0 flex-1 flex-col bg-[#0e0e14]">
          {/* Browser Address Bar & Responsive Mode */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#121218] px-3 gap-2">
            {/* Window Dots */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            {/* URL Input */}
            <div className="flex min-w-0 flex-1 items-center rounded-md border border-white/[0.08] bg-black/40 px-2.5 py-1 text-xs">
              <i className="ri-lock-line mr-1.5 text-neutral-500 text-[10px]"></i>
              <input
                type="text"
                value={iframeUrl || 'http://localhost:3000'}
                onChange={(e) => onUrlChange?.(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full bg-transparent text-neutral-300 outline-none text-xs"
              />
            </div>

            {/* Responsive Viewport Switcher */}
            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 text-neutral-400">
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                title="Desktop View"
                className={`p-1 rounded text-xs ${
                  viewportMode === 'desktop' ? 'bg-white/10 text-white' : 'hover:bg-white/[0.06]'
                }`}
              >
                <i className="ri-macbook-line"></i>
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('tablet')}
                title="Tablet View (768px)"
                className={`p-1 rounded text-xs ${
                  viewportMode === 'tablet' ? 'bg-white/10 text-white' : 'hover:bg-white/[0.06]'
                }`}
              >
                <i className="ri-tablet-line"></i>
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                title="Mobile View (390px)"
                className={`p-1 rounded text-xs ${
                  viewportMode === 'mobile' ? 'bg-white/10 text-white' : 'hover:bg-white/[0.06]'
                }`}
              >
                <i className="ri-smartphone-line"></i>
              </button>
            </div>

            {/* Open in external tab */}
            {iframeUrl && (
              <a
                href={iframeUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new window"
                className="flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:bg-white/[0.08] hover:text-white text-xs"
              >
                <i className="ri-external-link-line"></i>
              </a>
            )}
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#07070a] p-3">
            {iframeUrl ? (
              <div
                className={`h-full ${getViewportWidth()} overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl transition-all duration-300`}
              >
                <iframe
                  src={iframeUrl}
                  title="Application Preview"
                  className="h-full w-full border-0 bg-white"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#12121c] text-indigo-400 shadow-xl">
                  <i className="ri-global-line text-2xl"></i>
                </div>
                <h4 className="text-sm font-semibold text-white">
                  No preview available yet
                </h4>
                <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">
                  Run the project to launch your server inside the WebContainer sandbox.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRunProject();
                    sounds.playClick();
                  }}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 active:scale-95 transition-all"
                >
                  <i className="ri-play-fill"></i>
                  <span>Launch Application</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Package Inspector */}
      {activeTab === 'package' && (
        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#101018] p-4">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-3">
              <i className="ri-node-tree text-emerald-400"></i>
              <span>{packageJson.name || 'Application'}</span>
              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-neutral-400">
                v{packageJson.version || '1.0.0'}
              </span>
            </h4>

            {packageJson.scripts && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Scripts
                </span>
                <div className="grid grid-cols-1 gap-1 font-mono text-xs">
                  {Object.entries(packageJson.scripts).map(([key, cmd]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5 text-neutral-300"
                    >
                      <span className="text-indigo-400 font-semibold">{key}</span>
                      <span className="text-neutral-500 truncate max-w-[200px]">{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {packageJson.dependencies && (
              <div className="mt-4 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Dependencies ({Object.keys(packageJson.dependencies).length})
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {Object.entries(packageJson.dependencies).map(([pkg, ver]) => (
                    <span
                      key={pkg}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] text-neutral-300"
                    >
                      <span className="text-white">{pkg}</span>{' '}
                      <span className="text-neutral-500">{ver}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalPreviewPanel;
