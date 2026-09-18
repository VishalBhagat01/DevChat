import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';

const TeamSidebarPanel = ({
  project,
  currentUser,
  onOpenInviteModal,
}) => {
  const [copied, setCopied] = useState(false);
  const users = project?.users || [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0c0c10] select-none">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] px-3.5 bg-[#0e0e13]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <i className="ri-group-line text-blue-400"></i>
          <span>Team & Collaborators</span>
        </div>

        <button
          type="button"
          onClick={onOpenInviteModal}
          className="flex h-7 items-center gap-1 rounded bg-blue-600/20 px-2 text-[11px] font-medium text-blue-300 hover:bg-blue-600/30 hover:text-white transition-colors"
        >
          <i className="ri-user-add-line text-xs"></i>
          <span>Invite</span>
        </button>
      </div>

      {/* Shareable Project URL */}
      <div className="border-b border-white/[0.06] p-3 bg-black/20">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-neutral-400">Workspace Link</span>
            <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.2">
              Live Sync
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-mono text-neutral-500">
              {window.location.href}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="shrink-0 rounded px-2 py-1 text-[11px] font-medium text-blue-400 hover:bg-white/[0.06] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Collaborators ({users.length})
        </span>

        {users.map((u, i) => {
          const email = typeof u === 'object' ? u?.email : u;
          const isCurrent = (typeof u === 'object' ? u?._id : u) === (currentUser?._id?.toString() || currentUser?._id);

          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30 text-xs font-bold">
                  {email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-200">
                    {email}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {isCurrent ? 'You (Current)' : 'Collaborator'}
                  </p>
                </div>
              </div>

              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamSidebarPanel;
