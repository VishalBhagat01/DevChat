import React, { useState } from 'react';
import { sounds } from '../../utils/soundEffects';

const CollaboratorsModal = ({
  isOpen,
  onClose,
  project,
  users = [],
  selectedUserId,
  onUserToggle,
  onAddCollaborators,
}) => {
  const [search, setSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentMembers = project?.users || [];
  const currentMemberIds = new Set(
    currentMembers.map((u) => (typeof u === 'object' ? u?._id?.toString() || u?._id : u))
  );

  const availableUsers = users.filter((u) => {
    const id = u._id?.toString() || u._id;
    const matchesSearch = u.email?.toLowerCase().includes(search.toLowerCase());
    return !currentMemberIds.has(id) && matchesSearch;
  });

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    sounds.playPop();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12121c] shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-[#14141c]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-inset ring-blue-500/30">
              <i className="ri-user-add-line text-base"></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Project Collaborators
              </h3>
              <p className="text-[11px] text-neutral-400">
                Invite teammates to real-time coding & chat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.08] hover:text-white"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </header>

        {/* Copy Link Bar */}
        <div className="border-b border-white/[0.06] p-3 bg-black/20">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-2">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <i className="ri-link text-blue-400"></i>
              <span className="truncate max-w-[220px] text-[11px]">
                {window.location.href}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-2.5 py-1 text-[11px] font-medium text-blue-300 hover:bg-blue-600/30 hover:text-white transition-colors"
            >
              {copiedLink ? (
                <>
                  <i className="ri-check-line text-emerald-400"></i>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <i className="ri-file-copy-line"></i>
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Users Input */}
        <div className="p-3 pb-1">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs">
            <i className="ri-search-line text-neutral-500"></i>
            <input
              type="text"
              placeholder="Search users to invite by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none"
            />
          </div>
        </div>

        {/* User Selection List */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Available Users ({availableUsers.length})
          </span>

          {availableUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              {search ? 'No users matching search query.' : 'All users are already collaborators.'}
            </div>
          ) : (
            availableUsers.map((u) => {
              const id = u._id?.toString() || u._id;
              const isSelected = selectedUserId.has(id);

              return (
                <div
                  key={id}
                  onClick={() => {
                    onUserToggle(id);
                    sounds.playClick();
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition-all ${
                    isSelected
                      ? 'border-blue-500/40 bg-blue-600/15 text-white shadow-sm'
                      : 'border-transparent text-neutral-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {u.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="font-medium">{u.email}</span>
                  </div>

                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-neutral-700 bg-transparent'
                    }`}
                  >
                    {isSelected && <i className="ri-check-line text-xs"></i>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-white/[0.08] bg-[#101018] px-5 py-3.5">
          <span className="text-xs text-neutral-400">
            {selectedUserId.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:bg-white/[0.05] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onAddCollaborators();
                sounds.playPop();
              }}
              disabled={selectedUserId.size === 0}
              className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Add Selected
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CollaboratorsModal;
