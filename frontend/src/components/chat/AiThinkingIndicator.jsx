import React from 'react';

const AiThinkingIndicator = () => {
  return (
    <div className="flex w-full justify-start py-2">
      <div className="flex max-w-[85%] flex-col rounded-2xl rounded-bl-sm border border-indigo-500/20 bg-[#12121c] p-4 shadow-xl shadow-indigo-950/20">
        {/* Header with pulsing spark */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
            <span className="absolute -inset-0.5 rounded-lg bg-indigo-500/40 blur-sm animate-pulse" />
            <i className="ri-sparkling-fill text-xs relative"></i>
          </div>
          <span className="text-xs font-semibold text-indigo-300">
            DevChat AI is thinking...
          </span>
        </div>

        {/* Shimmer placeholders */}
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded-md bg-white/[0.06] animate-shimmer" />
          <div className="h-3 w-5/6 rounded-md bg-white/[0.04] animate-shimmer" />
          <div className="h-3 w-1/2 rounded-md bg-white/[0.05] animate-shimmer" />
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
          <i className="ri-cpu-line text-indigo-400"></i>
          <span>Generating architecture and code files...</span>
        </div>
      </div>
    </div>
  );
};

export default AiThinkingIndicator;
