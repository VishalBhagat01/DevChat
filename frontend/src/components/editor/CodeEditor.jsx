import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { getFileDetails, FileIcon } from '../../utils/fileIcons';
import { sounds } from '../../utils/soundEffects';

const CodeEditor = ({
  currentFile,
  fileContent = '',
  onChangeContent,
  onSave,
  isDirty = false,
  projectName = 'DevChat',
  onCursorChange,
  onAskAiToCreate,
  onNewFileClick,
}) => {
  const editorRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [wordWrap, setWordWrap] = useState('on');

  const { language } = getFileDetails(currentFile || '');

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define Silicon Valley Obsidian Monaco Theme
    monaco.editor.defineTheme('obsidian-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'e06c75' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
        { token: 'delimiter', foreground: 'abb2bf' },
      ],
      colors: {
        'editor.background': '#09090d',
        'editor.foreground': '#f4f4f5',
        'editor.lineHighlightBackground': '#14141d',
        'editor.selectionBackground': '#3e445177',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editorCursor.foreground': '#3b82f6',
        'editorWhitespace.foreground': '#27272a',
        'editorWidget.background': '#111118',
        'editorWidget.border': '#27272a',
      },
    });

    monaco.editor.setTheme('obsidian-dark');

    // Cursor position listener
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({ line: e.position.lineNumber, col: e.position.column });
      }
    });

    // Custom Keybinding: Ctrl+S or Cmd+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave) {
        onSave();
        sounds.playClick();
      }
    });
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      sounds.playClick();
    }
  };

  const handleCopy = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent);
      setCopied(true);
      sounds.playPop();
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    if (!currentFile || !fileContent) return;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playClick();
  };

  if (!currentFile) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#09090b] px-6 text-center">
        {/* Sleek icon card */}
        <div className="relative mb-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#121217] text-blue-400 shadow-2xl">
            <i className="ri-code-s-slash-line text-3xl"></i>
          </div>
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          DevChat Code Studio
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-5 text-neutral-400">
          Open a file from the Explorer on the left, or prompt DevChat AI to generate a full stack codebase.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onNewFileClick}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-neutral-200 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
          >
            <i className="ri-add-line text-sm text-blue-400"></i>
            <span>Create New File</span>
          </button>

          <button
            type="button"
            onClick={() => onAskAiToCreate?.('Create a full Express server with REST API routes and package.json')}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/15 px-3.5 py-2 text-xs font-medium text-blue-300 transition-all hover:bg-blue-600/25 hover:text-white active:scale-95"
          >
            <i className="ri-sparkling-fill text-sm text-blue-400"></i>
            <span>Ask AI for Express App</span>
          </button>
        </div>

        <div className="mt-10 flex items-center gap-4 text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-400">
              Ctrl+K
            </kbd>
            Command Palette
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 text-[10px] text-neutral-400">
              Ctrl+S
            </kbd>
            Save File
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#09090d]">
      {/* Editor Sub-Header Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0c0c10] px-3">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <i className="ri-folder-3-line text-neutral-500"></i>
          <span className="text-neutral-500">{projectName}</span>
          <span className="text-neutral-600">/</span>
          <FileIcon filename={currentFile} className="text-xs" />
          <span className="font-medium text-neutral-200">{currentFile}</span>
          {isDirty && (
            <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-medium text-amber-300">
              Unsaved
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 text-neutral-400">
          {/* Save Button */}
          <button
            type="button"
            onClick={onSave}
            title="Save file (Ctrl+S)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/40'
                : 'hover:bg-white/[0.06] hover:text-neutral-200 text-neutral-400'
            }`}
          >
            <i className="ri-save-3-line text-xs"></i>
            <span className="text-[11px] font-medium">Save</span>
          </button>

          {/* Format */}
          <button
            type="button"
            onClick={handleFormat}
            title="Format Document (Shift+Alt+F)"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-neutral-200 text-xs"
          >
            <i className="ri-code-box-line"></i>
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-neutral-200 text-xs"
          >
            {copied ? (
              <i className="ri-check-line text-emerald-400"></i>
            ) : (
              <i className="ri-file-copy-line"></i>
            )}
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/[0.06] hover:text-neutral-200 text-xs"
          >
            <i className="ri-download-2-line"></i>
          </button>

          {/* Minimap toggle */}
          <button
            type="button"
            onClick={() => setMinimap(!minimap)}
            title={minimap ? 'Hide Minimap' : 'Show Minimap'}
            className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
              minimap ? 'text-indigo-400 hover:bg-white/[0.06]' : 'text-neutral-500 hover:bg-white/[0.06]'
            }`}
          >
            <i className="ri-map-2-line"></i>
          </button>

          {/* Word Wrap toggle */}
          <button
            type="button"
            onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
            title={wordWrap === 'on' ? 'Disable Word Wrap' : 'Enable Word Wrap'}
            className={`flex h-7 w-7 items-center justify-center rounded text-xs transition-colors ${
              wordWrap === 'on' ? 'text-indigo-400 hover:bg-white/[0.06]' : 'text-neutral-500 hover:bg-white/[0.06]'
            }`}
          >
            <i className="ri-text-wrap"></i>
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="relative min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={fileContent}
          theme="obsidian-dark"
          onChange={(value) => onChangeContent(value || '')}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex h-full items-center justify-center bg-[#09090d] text-xs text-neutral-500">
              <i className="ri-loader-4-line mr-2 animate-spin text-indigo-400"></i>
              Loading Monaco Editor...
            </div>
          }
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            tabSize: 2,
            insertSpaces: true,
            minimap: { enabled: minimap },
            wordWrap: wordWrap,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            suggestOnTriggerCharacters: true,
            folding: true,
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
