import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';

const WebPreviewModal = ({
  isOpen,
  onClose,
  iframeUrl,
  runStatus = 'idle',
  onRunProject,
  onStopProject,
}) => {
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [key, setKey] = useState(0); // For iframe reloading
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const handleReload = () => {
    setKey((prev) => prev + 1);
    sounds.playClick();
  };

  const getViewportWidth = () => {
    if (viewportMode === 'mobile') return 'w-[390px] h-[720px] rounded-3xl border-4 border-zinc-700 shadow-2xl';
    if (viewportMode === 'tablet') return 'w-[768px] h-[85%] rounded-2xl border-2 border-zinc-700 shadow-2xl';
    return 'w-full h-full';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0d0d12] shadow-2xl shadow-black transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none border-0' : 'w-full max-w-6xl h-[90vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Browser Window Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#111116] px-4">
          {/* Left: Window dots & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                title="Close Window (Esc)"
                className="h-3 w-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="h-3 w-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                title="Reset view"
                className="h-3 w-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
              />
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <i className="ri-window-line text-blue-400"></i>
              <span>Live Application Preview</span>
              {runStatus === 'running' && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Center: Browser Address Bar */}
          <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1.5 mx-3 text-xs text-neutral-300">
            <i className="ri-lock-2-line text-emerald-400 text-xs shrink-0"></i>
            <span className="truncate flex-1 font-mono text-[11px] text-neutral-400">
              {iframeUrl || 'http://localhost:3000'}
            </span>
            <button
              type="button"
              onClick={handleReload}
              title="Reload preview"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <i className="ri-refresh-line text-xs"></i>
            </button>
          </div>

          {/* Right: Device Viewport Switcher & Window Actions */}
          <div className="flex items-center gap-1.5">
            {/* Viewport Toggles */}
            <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 text-xs text-neutral-400">
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                title="Desktop View (Full)"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewportMode === 'desktop' ? 'bg-white/[0.1] text-white' : 'hover:text-white'
                }`}
              >
                <i className="ri-macbook-line"></i>
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('tablet')}
                title="Tablet View (768px)"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewportMode === 'tablet' ? 'bg-white/[0.1] text-white' : 'hover:text-white'
                }`}
              >
                <i className="ri-tablet-line"></i>
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                title="Mobile View (390px)"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  viewportMode === 'mobile' ? 'bg-white/[0.1] text-white' : 'hover:text-white'
                }`}
              >
                <i className="ri-smartphone-line"></i>
              </button>
            </div>

            {/* External Window Link */}
            {iframeUrl && (
              <a
                href={iframeUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new browser tab"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:bg-white/[0.06] hover:text-white text-xs"
              >
                <i className="ri-external-link-line"></i>
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close Preview Window"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:bg-white/[0.06] hover:text-white text-xs"
            >
              <i className="ri-close-line text-base"></i>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#07070a] p-4">
          {iframeUrl ? (
            <div className={`${getViewportWidth()} overflow-hidden bg-white transition-all duration-300`}>
              <iframe
                key={key}
                src={iframeUrl}
                title="Live Application Preview"
                className="h-full w-full border-0 bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#121217] text-blue-400 shadow-xl">
                <i className="ri-global-line text-2xl"></i>
              </div>
              <h4 className="text-sm font-semibold text-white">
                Server is not running yet
              </h4>
              <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-500">
                Click Run to install project dependencies and start the live WebContainer dev server.
              </p>
              <button
                type="button"
                onClick={() => {
                  onRunProject?.();
                  sounds.playClick();
                }}
                disabled={runStatus === 'installing'}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 active:scale-95 transition-all"
              >
                {runStatus === 'installing' ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    <span>Installing Packages...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-play-fill"></i>
                    <span>Run Project</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebPreviewModal;
