import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import {
  initializeSocket,
  disconnectSocket,
  sendMessage,
  receiveMessage,
} from '../config/socket';
import { getWebContainer } from '../config/webcontainer';
import JSZip from 'jszip';

// Modular Components
import ChatPanel from '../components/chat/ChatPanel';
import FileExplorer from '../components/editor/FileExplorer';
import EditorTabs from '../components/editor/EditorTabs';
import CodeEditor from '../components/editor/CodeEditor';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import TerminalPreviewPanel from '../components/preview/TerminalPreviewPanel';
import CommandPalette from '../components/common/CommandPalette';
import ShortcutsModal from '../components/common/ShortcutsModal';
import CollaboratorsModal from '../components/common/CollaboratorsModal';
import ToastContainer from '../components/common/ToastContainer';

// Utilities
import { sounds } from '../utils/soundEffects';

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const projectId = location.state?.project?._id;

  // Workspace State
  const [project, setProject] = useState(location.state?.project || null);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [dirtyFiles, setDirtyFiles] = useState(new Set());
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Chat & AI State
  const [messages, setMessages] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [projectCommands, setProjectCommands] = useState({});

  // WebContainer & Live Execution
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [runStatus, setRunStatus] = useState('idle'); // 'idle' | 'installing' | 'running' | 'ready' | 'error'
  const [runOutput, setRunOutput] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  // Collaborators & Modals
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Layout & Resizing
  const [chatWidth, setChatWidth] = useState(380);
  const [isDraggingChat, setIsDraggingChat] = useState(false);

  // Notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /* =========================================================
     SOCKET & INITIAL DATA FETCH
  ========================================================= */

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }

    initializeSocket(projectId);

    // Boot WebContainer
    getWebContainer()
      .then((container) => {
        setWebContainer(container);
      })
      .catch((err) => {
        console.error('WebContainer boot error:', err);
      });

    // Listen for real-time messages
    const cleanupMessageListener = receiveMessage('project-message', (data) => {
      if (data.sender?._id === 'ai') {
        setIsAiThinking(false);
        sounds.playChime();

        try {
          const aiMessage =
            typeof data.message === 'string'
              ? JSON.parse(data.message)
              : data.message;

          if (aiMessage?.fileTree) {
            setFileTree((prevTree) => {
              const updated = { ...prevTree, ...aiMessage.fileTree };
              saveFileTree(updated);
              return updated;
            });

            // Open the first generated file if none open
            const newFiles = Object.keys(aiMessage.fileTree);
            if (newFiles.length > 0) {
              const target = newFiles.includes('app.js') ? 'app.js' : newFiles[0];
              setCurrentFile(target);
              setOpenFiles((prev) => Array.from(new Set([...prev, target])));
            }

            showToast(`DevChat Copilot created/updated ${newFiles.length} files`, 'success');
          }

          if (aiMessage?.startCommand?.mainItem && Array.isArray(aiMessage.startCommand.commands)) {
            setProjectCommands({ startCommand: aiMessage.startCommand });
          }
        } catch {
          // Plaintext AI response
        }

        setMessages((prev) => [...prev, data]);
      } else {
        sounds.playPop();
        setMessages((prev) => [...prev, data]);
      }
    });

    // Fetch Project
    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        setProject(res.data);
        const ft = res.data.fileTree || {};
        setFileTree(ft);

        const keys = Object.keys(ft);
        if (keys.length > 0 && !currentFile) {
          const defaultFile = keys.includes('app.js') ? 'app.js' : keys[0];
          setCurrentFile(defaultFile);
          setOpenFiles([defaultFile]);
        }
      })
      .catch((err) => {
        console.error('Error fetching project:', err);
      });

    // Fetch Users for Invites
    axios
      .get('/users/all')
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
      });

    return () => {
      if (cleanupMessageListener) cleanupMessageListener();
      disconnectSocket();
    };
  }, [projectId, navigate]);

  // WebContainer Server Ready listener
  useEffect(() => {
    if (!webContainer) return;

    const handleServerReady = (_port, url) => {
      setIframeUrl(url);
      setRunStatus('ready');
      setIsPreviewOpen(true);
      showToast(`Server ready at ${url}`, 'success');
    };

    webContainer.on('server-ready', handleServerReady);
    return () => webContainer.off('server-ready', handleServerReady);
  }, [webContainer, showToast]);

  /* =========================================================
     GLOBAL KEYBOARD SHORTCUTS
  ========================================================= */

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }

      // Cmd+Enter or Ctrl+Enter -> Run Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runProject();
      }

      // ? or Cmd+/ -> Shortcuts Modal
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [webContainer, fileTree]);

  /* =========================================================
     CHAT ACTIONS
  ========================================================= */

  const handleSendMessage = (content) => {
    if (!content.trim()) return;

    const isAi = content.includes('@ai');
    if (isAi) {
      setIsAiThinking(true);
    }

    const payload = {
      message: content,
      sender: user,
    };

    sendMessage('project-message', payload);
    setMessages((prev) => [...prev, payload]);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages in the chat view?')) {
      setMessages([]);
      sounds.playPop();
    }
  };

  /* =========================================================
     FILE OPERATIONS
  ========================================================= */

  const saveFileTree = (ft) => {
    if (!project?._id) return;

    axios
      .put('/projects/update-file-tree', {
        projectId: project._id,
        fileTree: ft,
      })
      .then(() => {
        setDirtyFiles(new Set());
      })
      .catch((err) => {
        console.error('Save file tree error:', err);
      });
  };

  const handleSelectFile = (filename) => {
    setCurrentFile(filename);
    setOpenFiles((prev) => Array.from(new Set([...prev, filename])));
  };

  const handleCloseFile = (filename) => {
    const nextOpen = openFiles.filter((f) => f !== filename);
    setOpenFiles(nextOpen);

    if (currentFile === filename) {
      setCurrentFile(nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null);
    }
  };

  const handleCloseOtherFiles = () => {
    if (!currentFile) return;
    setOpenFiles([currentFile]);
    sounds.playClick();
  };

  const handleCloseAllFiles = () => {
    setOpenFiles([]);
    setCurrentFile(null);
    sounds.playClick();
  };

  const handleContentChange = (newContent) => {
    if (!currentFile) return;

    const updatedTree = {
      ...fileTree,
      [currentFile]: {
        file: { contents: newContent },
      },
    };

    setFileTree(updatedTree);
    setDirtyFiles((prev) => new Set([...prev, currentFile]));
  };

  const handleSaveCurrentFile = () => {
    if (!currentFile) return;
    saveFileTree(fileTree);
    showToast(`Saved ${currentFile}`, 'success');
  };

  const handleCreateFile = (filename) => {
    if (!filename) return;

    const defaultContent = filename.endsWith('.json')
      ? '{\n  \n}'
      : filename.endsWith('.html')
      ? '<!doctype html>\n<html>\n  <head><title>App</title></head>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>'
      : '// ' + filename + '\n';

    const updatedTree = {
      ...fileTree,
      [filename]: {
        file: { contents: defaultContent },
      },
    };

    setFileTree(updatedTree);
    saveFileTree(updatedTree);
    setCurrentFile(filename);
    setOpenFiles((prev) => Array.from(new Set([...prev, filename])));
    showToast(`Created ${filename}`, 'success');
  };

  const handleDeleteFile = (filename) => {
    const updatedTree = { ...fileTree };
    delete updatedTree[filename];

    setFileTree(updatedTree);
    saveFileTree(updatedTree);
    handleCloseFile(filename);
    showToast(`Deleted ${filename}`, 'info');
  };

  const handleRenameFile = (oldName, newName) => {
    if (!newName || oldName === newName) return;

    const updatedTree = { ...fileTree };
    updatedTree[newName] = updatedTree[oldName];
    delete updatedTree[oldName];

    setFileTree(updatedTree);
    saveFileTree(updatedTree);

    setOpenFiles((prev) => prev.map((f) => (f === oldName ? newName : f)));
    if (currentFile === oldName) {
      setCurrentFile(newName);
    }
    showToast(`Renamed to ${newName}`, 'success');
  };

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      Object.entries(fileTree).forEach(([name, data]) => {
        zip.file(name, data?.file?.contents || '');
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}-source.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Project ZIP downloaded', 'success');
    } catch (err) {
      console.error('ZIP export error:', err);
      showToast('Failed to export ZIP', 'error');
    }
  };

  // Open code from chat inside Monaco Editor
  const handleOpenCodeInEditor = (code, lang) => {
    const ext = lang === 'javascript' ? 'js' : lang === 'json' ? 'json' : lang === 'html' ? 'html' : 'js';
    const tempName = `snippet-${Date.now()}.${ext}`;
    handleCreateFile(tempName);
    handleContentChange(code);
    showToast(`Snippet opened in ${tempName}`, 'success');
  };

  /* =========================================================
     WEBCONTAINER EXECUTION
  ========================================================= */

  const appendRunOutput = (chunk) => {
    setRunOutput((prev) => [...prev, String(chunk)].slice(-300));
  };

  const runProject = async () => {
    if (!webContainer) {
      setRunStatus('error');
      appendRunOutput('WebContainer is booting. Please wait a few seconds.');
      setIsPreviewOpen(true);
      return;
    }

    if (!Object.keys(fileTree).length) {
      setRunStatus('error');
      appendRunOutput('No project files available. Ask AI to generate an application first.');
      setIsPreviewOpen(true);
      return;
    }

    setRunStatus('installing');
    setRunOutput([]);
    setIframeUrl(null);
    setIsPreviewOpen(true);

    try {
      appendRunOutput('Mounting file tree to WebContainer...\n');
      await webContainer.mount(fileTree);

      if (runProcess) {
        runProcess.kill();
        setRunProcess(null);
      }

      // Check package.json
      const packageContents = fileTree['package.json']?.file?.contents;
      let packageJson = {};
      if (packageContents) {
        try {
          packageJson = JSON.parse(packageContents);
        } catch {
          throw new Error('package.json contains invalid JSON syntax.');
        }
      }

      appendRunOutput('$ npm install\n');
      const installProcess = await webContainer.spawn('npm', ['install']);
      const installOutput = installProcess.output.pipeTo(
        new WritableStream({ write: appendRunOutput })
      );
      const installExitCode = await installProcess.exit;
      await installOutput;

      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }

      // Start command determination
      const configuredCommand = projectCommands.startCommand;
      const script = packageJson.scripts?.dev
        ? ['run', 'dev', '--', '--host', '0.0.0.0']
        : packageJson.scripts?.start
        ? ['run', 'start']
        : null;

      const command = configuredCommand
        ? [configuredCommand.mainItem, configuredCommand.commands]
        : script
        ? ['npm', script]
        : ['node', [packageJson.main || 'app.js']];

      setRunStatus('running');
      appendRunOutput(`$ ${command[0]} ${command[1].join(' ')}\n`);

      const nextProcess = await webContainer.spawn(command[0], command[1]);
      nextProcess.output.pipeTo(
        new WritableStream({ write: appendRunOutput })
      );
      setRunProcess(nextProcess);
    } catch (error) {
      console.error('Execution error:', error);
      setRunStatus('error');
      appendRunOutput(`\n[Execution Error] ${error.message || 'Failed to run project'}`);
      sounds.playError();
      showToast('Execution error: ' + error.message, 'error');
    }
  };

  const stopProject = () => {
    if (runProcess) {
      runProcess.kill();
      setRunProcess(null);
      setRunStatus('idle');
      appendRunOutput('\nProcess terminated by user.\n');
      showToast('Server stopped', 'info');
    }
  };

  /* =========================================================
     COLLABORATORS MANAGEMENT
  ========================================================= */

  const handleUserToggle = (id) => {
    setSelectedUserId((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCollaborators = () => {
    if (!projectId || selectedUserId.size === 0) return;

    axios
      .put('/projects/add-user', {
        projectId,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        setProject(res.data.project || project);
        setIsModalOpen(false);
        setSelectedUserId(new Set());
        showToast('Collaborators added successfully', 'success');
      })
      .catch((err) => {
        console.error('Error adding collaborators:', err);
        showToast('Failed to add collaborators', 'error');
      });
  };

  /* =========================================================
     CHAT RESIZING
  ========================================================= */

  const handleMouseDownChatResizer = () => {
    setIsDraggingChat(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingChat) return;
      const newWidth = Math.max(280, Math.min(650, e.clientX));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingChat(false);
    };

    if (isDraggingChat) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingChat]);

  const currentFileContent = fileTree[currentFile]?.file?.contents || '';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#09090d] text-white">
      {/* Top Workspace Header Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0c0c12] px-4">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Return to Projects Dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <h1 className="text-xs font-semibold text-white tracking-wide">
              {project?.name || 'Workspace'}
            </h1>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-neutral-400">
              DevChat 2.0
            </span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          type="button"
          onClick={() => {
            setIsCommandPaletteOpen(true);
            sounds.playClick();
          }}
          className="hidden md:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-400 hover:border-indigo-500/40 hover:bg-white/[0.06] hover:text-neutral-200 transition-all shadow-sm"
        >
          <i className="ri-search-line text-neutral-500"></i>
          <span>Search or jump to file...</span>
          <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Actions, Run, & Collaborators */}
        <div className="flex items-center gap-2">
          {/* Run Button in Navbar */}
          <button
            type="button"
            onClick={runProject}
            disabled={!webContainer || runStatus === 'installing'}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <i className="ri-play-fill text-xs"></i>
            <span>Run</span>
            <kbd className="hidden lg:inline rounded bg-emerald-700/60 px-1 py-0.2 text-[9px] font-mono">
              ⌘↵
            </kbd>
          </button>

          {/* Toggle Preview Panel */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            title={isPreviewOpen ? 'Hide Terminal & Preview' : 'Show Terminal & Preview'}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
              isPreviewOpen
                ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300'
                : 'border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white'
            }`}
          >
            <i className="ri-layout-right-line text-sm"></i>
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Collaborator Avatars */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex cursor-pointer items-center -space-x-1.5 pl-2 hover:opacity-90"
            title="Manage Collaborators"
          >
            {project?.users?.slice(0, 3).map((u, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c0c12] bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white shadow-sm"
              >
                {(typeof u === 'object' ? u?.email : u)?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {(project?.users?.length || 0) > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c0c12] bg-neutral-800 text-[10px] text-neutral-300 font-medium">
                +{project.users.length - 3}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts (?) */}
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.08] text-xs"
          >
            <i className="ri-question-line"></i>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* 1. Left Panel: Chat & AI Copilot */}
        <div
          style={{ width: `${chatWidth}px` }}
          className="hidden md:flex h-full shrink-0 flex-col overflow-hidden"
        >
          <ChatPanel
            project={project}
            messages={messages}
            currentUser={user}
            onSendMessage={handleSendMessage}
            isAiThinking={isAiThinking}
            onOpenFile={handleSelectFile}
            onOpenInEditor={handleOpenCodeInEditor}
            onOpenCollaborators={() => setIsModalOpen(true)}
            onClearChat={handleClearChat}
          />
        </div>

        {/* Resizer Handle between Chat and IDE */}
        <div
          onMouseDown={handleMouseDownChatResizer}
          className={`hidden md:flex w-1 cursor-col-resize items-center justify-center hover:bg-indigo-500/60 transition-colors select-none ${
            isDraggingChat ? 'bg-indigo-500' : 'bg-transparent'
          }`}
        />

        {/* 2. Center Panel: IDE (Explorer + Monaco Editor) */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1">
            {/* File Explorer */}
            <FileExplorer
              fileTree={fileTree}
              currentFile={currentFile}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onExportZip={handleExportZip}
            />

            {/* Monaco Editor Studio */}
            <div className="flex min-w-0 flex-1 flex-col bg-[#09090d]">
              {/* Multi-file Tabs */}
              <EditorTabs
                openFiles={openFiles}
                currentFile={currentFile}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
                onCloseOthers={handleCloseOtherFiles}
                onCloseAll={handleCloseAllFiles}
                dirtyFiles={dirtyFiles}
                projectName={project?.name}
              />

              {/* Editor Workspace */}
              <div className="min-h-0 flex-1">
                <CodeEditor
                  currentFile={currentFile}
                  fileContent={currentFileContent}
                  onChangeContent={handleContentChange}
                  onSave={handleSaveCurrentFile}
                  isDirty={dirtyFiles.has(currentFile)}
                  projectName={project?.name}
                  onCursorChange={setCursorPos}
                  onAskAiToCreate={(prompt) => handleSendMessage(`@ai ${prompt}`)}
                  onNewFileClick={() => handleCreateFile('index.js')}
                />
              </div>

              {/* Status Bar */}
              <EditorStatusBar
                currentFile={currentFile}
                cursorPos={cursorPos}
                isDirty={dirtyFiles.has(currentFile)}
                webContainerReady={Boolean(webContainer)}
                runStatus={runStatus}
                onSave={handleSaveCurrentFile}
              />
            </div>
          </div>
        </div>

        {/* 3. Right Panel: Terminal & Live Web Preview */}
        {isPreviewOpen && (
          <div className="hidden lg:flex w-[460px] xl:w-[540px] shrink-0 flex-col overflow-hidden">
            <TerminalPreviewPanel
              webContainer={webContainer}
              iframeUrl={iframeUrl}
              runStatus={runStatus}
              runOutput={runOutput}
              onRunProject={runProject}
              onStopProject={stopProject}
              onClearLogs={() => setRunOutput([])}
              fileTree={fileTree}
              onUrlChange={setIframeUrl}
              onClose={() => setIsPreviewOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        fileTree={fileTree}
        onSelectFile={handleSelectFile}
        onRunProject={runProject}
        onNewFile={() => handleCreateFile('newFile.js')}
        onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
        onOpenInvite={() => setIsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportZip={handleExportZip}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CollaboratorsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
        users={users}
        selectedUserId={selectedUserId}
        onUserToggle={handleUserToggle}
        onAddCollaborators={handleAddCollaborators}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default Project;