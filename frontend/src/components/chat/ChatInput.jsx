import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../../utils/soundEffects';

const QUICK_PROMPTS = [
  { label: '🚀 Express Server', prompt: '@ai Create an Express server with REST API routes and package.json' },
  { label: '⚛️ React Component', prompt: '@ai Create a modern React dashboard component with clean state' },
  { label: '🐛 Debug Code', prompt: '@ai Review the open file for potential bugs, syntax issues, and edge cases' },
  { label: '📝 Explain Architecture', prompt: '@ai Explain the project architecture and what each file does' },
];

const ChatInput = ({ onSendMessage, isAiThinking = false }) => {
  const [text, setText] = useState('');
  const [aiMode, setAiMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  // Web Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (e) => {
          const transcript = e.results[0][0].transcript;
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
          sounds.playPop();
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        sounds.playClick();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isAiThinking) return;

    let finalMessage = trimmed;
    if (aiMode && !finalMessage.includes('@ai')) {
      finalMessage = `@ai ${finalMessage}`;
    }

    onSendMessage(finalMessage);
    setText('');
    sounds.playPop();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectQuickPrompt = (prompt) => {
    setText(prompt.replace('@ai ', ''));
    setAiMode(true);
    sounds.playClick();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="shrink-0 border-t border-white/[0.08] bg-[#0c0c12] p-3">
      {/* Quick Prompt Chips */}
      <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectQuickPrompt(item.prompt)}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-400 transition-all hover:border-indigo-500/40 hover:bg-indigo-600/10 hover:text-white active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative rounded-2xl border border-white/[0.1] bg-[#12121a] p-2 transition-all focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
        {/* Top bar inside input: Mode toggle & Voice */}
        <div className="flex items-center justify-between px-2 pb-1.5 border-b border-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setAiMode(!aiMode);
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
              aiMode
                ? 'border border-indigo-500/40 bg-indigo-600/20 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                : 'border border-white/10 bg-white/[0.04] text-neutral-500 hover:text-neutral-300'
            }`}
            title="When active, messages automatically prompt the Gemini Copilot"
          >
            <i
              className={`text-xs ${
                aiMode ? 'ri-sparkling-fill text-indigo-400' : 'ri-chat-1-line'
              }`}
            ></i>
            <span>{aiMode ? 'AI Copilot Active' : 'Team Chat Only'}</span>
          </button>

          <div className="flex items-center gap-1">
            {/* Voice Dictation */}
            <button
              type="button"
              onClick={toggleSpeech}
              title={isListening ? 'Listening... click to stop' : 'Voice dictation'}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs transition-colors ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-neutral-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <i className="ri-mic-line"></i>
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            aiMode
              ? 'Ask AI to generate code, fix bugs, or build features...'
              : 'Message team members...'
          }
          className="w-full resize-none bg-transparent px-2.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none max-h-36 scrollbar-none font-sans"
        />

        {/* Bottom bar inside input */}
        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-[10px] text-neutral-600">
            Enter to send • Shift+Enter for newline
          </span>

          <div className="flex items-center gap-2">
            {text && (
              <button
                type="button"
                onClick={() => setText('')}
                className="text-neutral-600 hover:text-neutral-400 text-xs"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || isAiThinking}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                text.trim() && !isAiThinking
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95'
                  : 'bg-white/[0.05] text-neutral-600 cursor-not-allowed'
              }`}
            >
              {isAiThinking ? (
                <i className="ri-loader-4-line animate-spin text-xs"></i>
              ) : (
                <i className="ri-arrow-up-line text-sm"></i>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
