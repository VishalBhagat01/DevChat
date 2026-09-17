import React, { useState, useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import AiThinkingIndicator from './AiThinkingIndicator';
import ChatInput from './ChatInput';
import { sounds } from '../../utils/soundEffects';

const ChatPanel = ({
  project,
  messages = [],
  currentUser,
  onSendMessage,
  isAiThinking = false,
  onOpenFile,
  onOpenInEditor,
  onOpenCollaborators,
  onClearChat,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'ai' | 'team'
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const scrollRef = useRef(null);

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiThinking, isAtBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAtBottom(true);
    }
  };

  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundEnabled(newState);
  };

  const handleExportChat = () => {
    const markdown = messages
      .map((m) => {
        const sender = m.sender?._id === 'ai' ? 'DevChat Copilot' : m.sender?.email || 'User';
        let content = m.message;
        if (m.sender?._id === 'ai') {
          try {
            const parsed = typeof m.message === 'string' ? JSON.parse(m.message) : m.message;
            content = parsed.text || JSON.stringify(parsed);
          } catch {
            content = String(m.message);
          }
        }
        return `### ${sender}\n\n${content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'project'}-chat-export.md`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playPop();
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (filter === 'ai' && m.sender?._id !== 'ai') return false;
    if (filter === 'team' && m.sender?._id === 'ai') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const content = typeof m.message === 'string' ? m.message.toLowerCase() : JSON.stringify(m.message).toLowerCase();
      return content.includes(q);
    }
    return true;
  });

  return (
    <aside className="relative flex h-full min-w-0 flex-col border-r border-white/[0.08] bg-[#0d0d12]">
      {/* Chat Top Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0f0f16] px-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
            <i className="ri-sparkling-fill text-xs"></i>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold text-white">
              {project?.name || 'Collaboration Workspace'}
            </h2>
            <p className="text-[10px] text-neutral-500">
              Copilot • {project?.users?.length || 1} online
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-neutral-400">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setIsSearching(!isSearching)}
            title="Search messages"
            className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
              isSearching ? 'bg-white/[0.1] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <i className="ri-search-line"></i>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-white text-xs"
          >
            <i
              className={soundEnabled ? 'ri-volume-up-line text-indigo-400' : 'ri-volume-mute-line text-neutral-500'}
            ></i>
          </button>

          {/* Export Chat */}
          <button
            type="button"
            onClick={handleExportChat}
            title="Export chat as Markdown"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-white text-xs"
          >
            <i className="ri-download-2-line"></i>
          </button>

          {/* Invite Collaborators */}
          <button
            type="button"
            onClick={onOpenCollaborators}
            title="Manage Collaborators"
            className="flex h-7 items-center gap-1 rounded bg-indigo-600/20 px-2 text-[11px] font-medium text-indigo-300 hover:bg-indigo-600/30 hover:text-white transition-colors"
          >
            <i className="ri-user-add-line text-xs"></i>
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </header>

      {/* Message Filter Tabs / Search Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.05] bg-[#0b0b10] px-3 py-1.5 text-[11px]">
        {isSearching ? (
          <div className="flex w-full items-center gap-1.5">
            <i className="ri-search-line text-neutral-500 text-xs"></i>
            <input
              type="text"
              placeholder="Search chat..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
              className="text-neutral-500 hover:text-white"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  filter === 'all'
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                All ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('ai')}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 transition-colors ${
                  filter === 'ai'
                    ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <i className="ri-sparkling-line text-[10px]"></i>
                AI Only
              </button>
              <button
                type="button"
                onClick={() => setFilter('team')}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  filter === 'team'
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Team
              </button>
            </div>

            {messages.length > 0 && onClearChat && (
              <button
                type="button"
                onClick={onClearChat}
                className="text-[10px] text-neutral-600 hover:text-neutral-400"
              >
                Clear
              </button>
            )}
          </>
        )}
      </div>

      {/* Messages Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-none"
      >
        {filteredMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="relative mb-3">
              <div className="absolute -inset-3 rounded-full bg-indigo-500/10 blur-xl" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#12121c] text-indigo-400">
                <i className="ri-sparkling-fill text-xl"></i>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-white">
              DevChat AI Pair Programmer
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-neutral-400">
              Ask AI to generate entire projects, write backend APIs, create UI components, or discuss architecture with your team.
            </p>
          </div>
        )}

        {filteredMessages.map((msg, index) => (
          <MessageItem
            key={index}
            msg={msg}
            currentUser={currentUser}
            onOpenFile={onOpenFile}
            onOpenInEditor={onOpenInEditor}
          />
        ))}

        {isAiThinking && <AiThinkingIndicator />}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {!isAtBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-24 right-5 flex h-7 items-center gap-1 rounded-full border border-white/10 bg-[#151520] px-2.5 text-[11px] text-neutral-300 shadow-xl hover:bg-white/[0.1] hover:text-white"
        >
          <i className="ri-arrow-down-line text-xs"></i>
          <span>New messages</span>
        </button>
      )}

      {/* Chat Input */}
      <ChatInput onSendMessage={onSendMessage} isAiThinking={isAiThinking} />
    </aside>
  );
};

export default ChatPanel;
