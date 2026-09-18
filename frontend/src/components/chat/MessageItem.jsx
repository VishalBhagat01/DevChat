import React, { useState } from 'react';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { FileIcon } from '../../utils/fileIcons';
import { sounds } from '../../utils/soundEffects';

// Custom syntax-highlighted code block with Copy & Open in Editor
const ChatCodeBlock = ({ children, className, onOpenInEditor }) => {
  const [copied, setCopied] = useState(false);
  const codeContent = typeof children === 'string' ? children : String(children?.props?.children || children || '');
  const langMatch = className?.match(/lang-([a-zA-Z0-9_-]+)/);
  const lang = langMatch ? langMatch[1] : 'code';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 1600);
  };

  let highlightedHtml = '';
  try {
    if (langMatch && hljs.getLanguage(lang)) {
      highlightedHtml = hljs.highlight(codeContent, { language: lang }).value;
    } else {
      highlightedHtml = hljs.highlightAuto(codeContent).value;
    }
  } catch {
    highlightedHtml = codeContent;
  }

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-white/10 bg-[#09090e]">
      {/* Code Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#101017] px-3 py-1.5 text-xs text-neutral-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-indigo-400">
          {lang}
        </span>

        <div className="flex items-center gap-1.5">
          {onOpenInEditor && (
            <button
              type="button"
              onClick={() => {
                onOpenInEditor(codeContent, lang);
                sounds.playClick();
              }}
              title="Open or paste code into editor"
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-white/[0.08] hover:text-white"
            >
              <i className="ri-external-link-line text-xs"></i>
              <span>Open in Editor</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-white/[0.08] hover:text-white"
          >
            {copied ? (
              <>
                <i className="ri-check-line text-emerald-400"></i>
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <i className="ri-file-copy-line"></i>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body */}
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 scrollbar-none">
        <code
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          className="hljs !bg-transparent !p-0"
        />
      </pre>
    </div>
  );
};

const MessageItem = ({ msg, currentUser, onOpenFile, onOpenInEditor }) => {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isAI = msg.sender?._id === 'ai';
  const isCurrentUser =
    msg.sender?._id === currentUser?._id?.toString() ||
    msg.sender?._id === currentUser?._id;

  // Safe parse AI message object
  let parsedAi = null;
  if (isAI) {
    try {
      parsedAi = typeof msg.message === 'string' ? JSON.parse(msg.message) : msg.message;
    } catch {
      parsedAi = { text: String(msg.message) };
    }
  }

  const messageText = isAI ? (parsedAi?.text || '') : (msg.message || '');
  const generatedFiles = parsedAi?.fileTree ? Object.keys(parsedAi.fileTree) : [];
  const startCommand = parsedAi?.startCommand;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMsg(true);
    sounds.playPop();
    setTimeout(() => setCopiedMsg(false), 1600);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(messageText.replace(/[#*`_]/g, ''));
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const senderInitial = isAI
    ? 'AI'
    : (msg.sender?.email?.charAt(0)?.toUpperCase() || '?');

  return (
    <div
      className={`group flex w-full flex-col ${
        isCurrentUser ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender Header */}
      <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-neutral-500">
        {!isCurrentUser && (
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
              isAI
                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {senderInitial}
          </div>
        )}
        <span className="font-medium text-neutral-400">
          {isAI ? 'DevChat Copilot' : isCurrentUser ? 'You' : msg.sender?.email || 'Team'}
        </span>
        {isAI && (
          <span className="rounded-full bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-blue-400 border border-blue-500/20">
            Gemini 3.1
          </span>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative max-w-[92%] rounded-2xl p-3.5 text-xs sm:max-w-[85%] ${
          isCurrentUser
            ? 'rounded-tr-sm bg-[#161620] border border-blue-500/30 text-white shadow-lg shadow-black/50'
            : isAI
            ? 'rounded-tl-sm border border-white/[0.08] bg-[#0f0f14] text-neutral-200 shadow-xl shadow-black/40'
            : 'rounded-tl-sm border border-white/[0.06] bg-[#121218] text-neutral-200'
        }`}
      >
        {/* Message Content */}
        {isAI ? (
          <div className="space-y-3 leading-relaxed">
            <div className="prose prose-invert prose-xs max-w-none text-neutral-200">
              <Markdown
                options={{
                  overrides: {
                    code: {
                      component: ChatCodeBlock,
                      props: { onOpenInEditor },
                    },
                  },
                }}
              >
                {messageText}
              </Markdown>
            </div>

            {/* Generated Files Pill Bar */}
            {generatedFiles.length > 0 && (
              <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-300">
                    <i className="ri-folder-check-line text-sm text-blue-400"></i>
                    Files Updated ({generatedFiles.length})
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Click file to view in editor
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {generatedFiles.map((file) => (
                    <button
                      key={file}
                      type="button"
                      onClick={() => {
                        onOpenFile?.(file);
                        sounds.playClick();
                      }}
                      className="group/file flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0d0d14] px-2.5 py-1 text-[11px] text-neutral-300 transition-all hover:border-blue-500/50 hover:bg-blue-600/20 hover:text-white"
                    >
                      <FileIcon filename={file} className="text-xs" />
                      <span className="font-medium">{file}</span>
                      <i className="ri-arrow-right-up-line text-neutral-500 group-hover/file:text-blue-300 text-[10px]"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Command Pill */}
            {startCommand?.commands && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0c0c12] px-3 py-1.5 font-mono text-[11px] text-neutral-400">
                <i className="ri-terminal-line text-emerald-400"></i>
                <span className="text-neutral-500">Run:</span>
                <span className="text-emerald-300">
                  {startCommand.mainItem} {startCommand.commands.join(' ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-6">
            {msg.message}
          </p>
        )}

        {/* Floating Message Quick Actions */}
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-neutral-500 opacity-60 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopyMessage}
            title="Copy message text"
            className="flex items-center gap-1 rounded p-1 hover:bg-white/[0.08] hover:text-neutral-300"
          >
            {copiedMsg ? (
              <i className="ri-check-line text-emerald-400"></i>
            ) : (
              <i className="ri-file-copy-line"></i>
            )}
          </button>

          {isAI && typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleSpeak}
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
              className={`flex items-center gap-1 rounded p-1 hover:bg-white/[0.08] ${
                isSpeaking ? 'text-blue-400 animate-pulse' : 'hover:text-neutral-300'
              }`}
            >
              <i
                className={
                  isSpeaking ? 'ri-volume-vibrate-line' : 'ri-volume-up-line'
                }
              ></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
