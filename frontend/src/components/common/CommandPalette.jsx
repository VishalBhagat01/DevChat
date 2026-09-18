import React, { useState, useEffect, useRef } from 'react';
import { FileIcon } from '../../utils/fileIcons';
import { sounds } from '../../utils/soundEffects';

const CommandPalette = ({
  isOpen,
  onClose,
  fileTree = {},
  onSelectFile,
  onRunProject,
  onNewFile,
  onTogglePreview,
  onOpenInvite,
  onOpenShortcuts,
  onExportZip,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const files = Object.keys(fileTree || {});

  // Built-in commands
  const defaultCommands = [
    {
      id: 'run',
      title: 'Run Project (Start Server)',
      category: 'Actions',
      icon: 'ri-play-fill text-emerald-400',
      action: () => onRunProject(),
    },
    {
      id: 'new-file',
      title: 'Create New File...',
      category: 'Actions',
      icon: 'ri-file-add-line text-blue-400',
      action: () => onNewFile(),
    },
    {
      id: 'preview',
      title: 'Toggle Web Preview & Terminal',
      category: 'View',
      icon: 'ri-window-line text-sky-400',
      action: () => onTogglePreview(),
    },
    {
      id: 'invite',
      title: 'Invite Collaborators...',
      category: 'Collaboration',
      icon: 'ri-user-add-line text-neutral-400',
      action: () => onOpenInvite(),
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts Cheat Sheet',
      category: 'Help',
      icon: 'ri-keyboard-line text-neutral-400',
      action: () => onOpenShortcuts(),
    },
    {
      id: 'export',
      title: 'Download Project ZIP',
      category: 'Project',
      icon: 'ri-download-cloud-2-line text-blue-400',
      action: () => onExportZip(),
    },
  ];

  // File commands
  const fileCommands = files.map((file) => ({
    id: `file-${file}`,
    title: file,
    category: 'Files',
    file: file,
    action: () => onSelectFile(file),
  }));

  const allItems = [...defaultCommands, ...fileCommands];
  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase().trim())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        sounds.playClick();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.12] bg-[#121217] shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3 bg-[#14141c]">
          <i className="ri-search-line text-neutral-400"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search files..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
          />
          <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 scrollbar-none space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching commands or files
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    sounds.playClick();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/15 text-white border border-blue-500/30'
                      : 'text-neutral-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.file ? (
                      <FileIcon filename={item.file} className="text-xs" />
                    ) : (
                      <i className={`${item.icon} text-sm`} />
                    )}
                    <span className="font-medium">{item.title}</span>
                  </div>

                  <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#0d0d12] px-4 py-2 text-[10px] text-neutral-500">
          <span>Navigate with ↑↓</span>
          <span>Select with ↵</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
