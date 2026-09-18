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

// Modular Workspace Components
import ChatPanel from '../components/chat/ChatPanel';
import TeamSidebarPanel from '../components/chat/TeamSidebarPanel';
import FileExplorer from '../components/editor/FileExplorer';
import EditorTabs from '../components/editor/EditorTabs';
import CodeEditor from '../components/editor/CodeEditor';
import EditorStatusBar from '../components/editor/EditorStatusBar';
import BottomTerminalDrawer from '../components/preview/BottomTerminalDrawer';
import WebPreviewModal from '../components/preview/WebPreviewModal';

// Modals & Common UI
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

  // WebContainer & Live Execution State
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [runStatus, setRunStatus] = useState('idle'); // 'idle' | 'installing' | 'running' | 'ready' | 'error'
  const [runOutput, setRunOutput] = useState([]);

  // Layout Management: Activity Bar & Windows (Eliminates congestion)
  const [activeSidebar, setActiveSidebar] = useState('explorer'); // 'explorer' | 'chat' | 'team'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Modals
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

            showToast(`DevChat Copilot generated ${newFiles.length} file(s)`, 'success');
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
      setIsPreviewModalOpen(true);
      sounds.playChime();
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

      // Cmd+B or Ctrl+B -> Toggle Primary Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        sounds.playClick();
      }

      // Cmd+` or Ctrl+` or Ctrl+J -> Toggle Bottom Terminal
      if (
        ((e.metaKey || e.ctrlKey) && e.key === '`') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j')
      ) {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        sounds.playClick();
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
     CHAT & COPILOT ACTIONS
  ========================================================= */

  const handleSendMessage = (content) => {
    if (!content.trim()) return;

    const isAi = content.includes('@ai');
    if (isAi) {
      setIsAiThinking(true);
      // Auto switch sidebar to chat so user sees Copilot response
      if (!isSidebarOpen || activeSidebar !== 'chat') {
        setActiveSidebar('chat');
        setIsSidebarOpen(true);
      }
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
      ? '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>DevChat App</title>\n  </head>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>'
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
    setRunOutput((prev) => [...prev, String(chunk)].slice(-400));
  };

  const runProject = async () => {
    // Open terminal drawer so user can monitor real-time output
    setIsTerminalOpen(true);

    if (!webContainer) {
      setRunStatus('error');
      appendRunOutput('WebContainer is booting. Please wait a few seconds.');
      return;
    }

    if (!Object.keys(fileTree).length) {
      setRunStatus('error');
      appendRunOutput('No project files found. Ask AI Copilot to scaffold an application first.');
      return;
    }

    setRunStatus('installing');
    setRunOutput([]);
    setIframeUrl(null);

    try {
      appendRunOutput('Mounting file tree to WebContainer runtime...\n');
      await webContainer.mount(fileTree);

      if (runProcess) {
        runProcess.kill();
        setRunProcess(null);
      }

      // Parse package.json
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

      // Determine command to run
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
      appendRunOutput('\nServer terminated by user.\n');
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
     SIDEBAR RESIZING & TAB SWITCHING
  ========================================================= */

  const handleTabClick = (tab) => {
    if (activeSidebar === tab && isSidebarOpen) {
      // Toggle off if clicking the currently open tab
      setIsSidebarOpen(false);
    } else {
      setActiveSidebar(tab);
      setIsSidebarOpen(true);
    }
    sounds.playClick();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSidebar) return;
      // Activity Bar is 48px
      const newWidth = Math.max(220, Math.min(560, e.clientX - 48));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    if (isDraggingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const currentFileContent = fileTree[currentFile]?.file?.contents || '';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#09090b] text-neutral-200">
      {/* 1. TOP WORKSPACE HEADER */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0c0c10] px-3 select-none">
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
            <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <h1 className="text-xs font-semibold text-white tracking-wide truncate max-w-[160px] sm:max-w-[240px]">
              {project?.name || 'Workspace'}
            </h1>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-neutral-400">
              DevChat
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
          className="hidden md:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs text-neutral-400 hover:border-blue-500/40 hover:bg-white/[0.06] hover:text-neutral-200 transition-all shadow-sm"
        >
          <i className="ri-search-line text-neutral-500"></i>
          <span>Search or jump to file...</span>
          <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Right: Run, Preview Window, Terminal, & Collaborators */}
        <div className="flex items-center gap-2">
          {/* Run / Stop Button */}
          {runStatus === 'running' ? (
            <button
              type="button"
              onClick={stopProject}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 active:scale-95 transition-all"
            >
              <i className="ri-stop-fill text-xs"></i>
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={runProject}
              disabled={!webContainer || runStatus === 'installing'}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
            >
              {runStatus === 'installing' ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-xs"></i>
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <i className="ri-play-fill text-xs"></i>
                  <span>Run</span>
                  <kbd className="hidden lg:inline rounded bg-emerald-700/60 px-1 py-0.2 text-[9px] font-mono">
                    ⌘↵
                  </kbd>
                </>
              )}
            </button>
          )}

          {/* Dedicated Live Web Preview Modal Launcher */}
          <button
            type="button"
            onClick={() => {
              setIsPreviewModalOpen(true);
              sounds.playClick();
            }}
            title="Open Live Web Preview Window"
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
              iframeUrl
                ? 'border-blue-500/40 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
                : 'border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white'
            }`}
          >
            <i className="ri-window-line text-sm"></i>
            <span className="hidden sm:inline">Preview Window</span>
            {iframeUrl && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Toggle Bottom Terminal Drawer */}
          <button
            type="button"
            onClick={() => {
              setIsTerminalOpen(!isTerminalOpen);
              sounds.playClick();
            }}
            title="Toggle Bottom Terminal (Ctrl+`)"
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all ${
              isTerminalOpen
                ? 'border-blue-500/40 bg-blue-600/20 text-blue-300'
                : 'border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:text-white'
            }`}
          >
            <i className="ri-terminal-box-line text-sm"></i>
            <span className="hidden sm:inline">Terminal</span>
          </button>

          {/* Collaborator Avatars */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="flex cursor-pointer items-center -space-x-1.5 pl-1 hover:opacity-90 transition-opacity"
            title="Manage Collaborators"
          >
            {project?.users?.slice(0, 3).map((u, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c0c10] bg-gradient-to-br from-blue-600 to-cyan-600 text-[10px] font-bold text-white shadow-sm"
              >
                {(typeof u === 'object' ? u?.email : u)?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {(project?.users?.length || 0) > 3 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c0c10] bg-neutral-800 text-[10px] text-neutral-300 font-medium">
                +{project.users.length - 3}
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Trigger */}
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

      {/* 2. MAIN WORKSPACE ROW */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* =========================================================
            ACTIVITY BAR RAIL (48px left rail)
        ========================================================= */}
        <aside className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-white/[0.08] bg-[#0c0c10] py-2.5 select-none z-10">
          {/* Top Activity Buttons */}
          <div className="flex flex-col items-center gap-2">
            {/* File Explorer Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('explorer')}
              title="File Explorer (Ctrl+Shift+E)"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isSidebarOpen && activeSidebar === 'explorer'
                  ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              <i className="ri-folder-2-line text-lg"></i>
              {isSidebarOpen && activeSidebar === 'explorer' && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-blue-500" />
              )}
            </button>

            {/* AI Copilot Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('chat')}
              title="DevChat AI Copilot"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isSidebarOpen && activeSidebar === 'chat'
                  ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              <i className="ri-sparkling-line text-lg"></i>
              {isAiThinking && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              )}
              {isSidebarOpen && activeSidebar === 'chat' && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-blue-500" />
              )}
            </button>

            {/* Team Members Tab */}
            <button
              type="button"
              onClick={() => handleTabClick('team')}
              title="Team & Collaborators"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isSidebarOpen && activeSidebar === 'team'
                  ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              <i className="ri-team-line text-lg"></i>
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-neutral-300">
                {project?.users?.length || 1}
              </span>
              {isSidebarOpen && activeSidebar === 'team' && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-blue-500" />
              )}
            </button>
          </div>

          {/* Bottom Activity Buttons */}
          <div className="flex flex-col items-center gap-2">
            {/* Live Web Preview Window Trigger */}
            <button
              type="button"
              onClick={() => {
                setIsPreviewModalOpen(true);
                sounds.playClick();
              }}
              title="Open Live Web Preview Window"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isPreviewModalOpen
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              <i className="ri-window-line text-lg"></i>
              {iframeUrl && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Terminal Drawer Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsTerminalOpen(!isTerminalOpen);
                sounds.playClick();
              }}
              title="Toggle Terminal Drawer (Ctrl+`)"
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                isTerminalOpen
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
              }`}
            >
              <i className="ri-terminal-box-line text-lg"></i>
            </button>

            <div className="h-px w-6 bg-white/[0.08]" />

            {/* Toggle Primary Sidebar */}
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
                sounds.playClick();
              }}
              title={isSidebarOpen ? 'Collapse Primary Sidebar (Ctrl+B)' : 'Expand Primary Sidebar (Ctrl+B)'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all"
            >
              <i className={isSidebarOpen ? 'ri-layout-left-fill text-base' : 'ri-layout-left-line text-base'}></i>
            </button>
          </div>
        </aside>

        {/* =========================================================
            PRIMARY SIDEBAR CONTAINER (Only renders 1 view at a time!)
        ========================================================= */}
        {isSidebarOpen && (
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="flex h-full shrink-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#0c0c10] select-none"
          >
            {activeSidebar === 'explorer' && (
              <FileExplorer
                fileTree={fileTree}
                currentFile={currentFile}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onExportZip={handleExportZip}
              />
            )}

            {activeSidebar === 'chat' && (
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
            )}

            {activeSidebar === 'team' && (
              <TeamSidebarPanel
                project={project}
                currentUser={user}
                onOpenInviteModal={() => setIsModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Sidebar Resizer Handle */}
        {isSidebarOpen && (
          <div
            onMouseDown={() => setIsDraggingSidebar(true)}
            className={`w-1 cursor-col-resize hover:bg-blue-500/60 transition-colors select-none z-10 ${
              isDraggingSidebar ? 'bg-blue-500' : 'bg-transparent'
            }`}
          />
        )}

        {/* =========================================================
            MAIN STUDIO WORKSPACE (Editor + Tabs + Bottom Terminal Drawer)
        ========================================================= */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#09090b]">
          {/* Multi-file Tabs Bar */}
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

          {/* Monaco Code Editor Workspace */}
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

          {/* Collapsible Bottom Terminal Drawer */}
          <BottomTerminalDrawer
            isOpen={isTerminalOpen}
            onClose={() => setIsTerminalOpen(false)}
            runStatus={runStatus}
            runOutput={runOutput}
            onRunProject={runProject}
            onStopProject={stopProject}
            onClearLogs={() => setRunOutput([])}
            fileTree={fileTree}
            onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
            iframeUrl={iframeUrl}
          />

          {/* Editor Status Bar */}
          <EditorStatusBar
            currentFile={currentFile}
            cursorPos={cursorPos}
            isDirty={dirtyFiles.has(currentFile)}
            webContainerReady={Boolean(webContainer)}
            runStatus={runStatus}
            onSave={handleSaveCurrentFile}
          />
        </main>
      </div>

      {/* =========================================================
          MODALS & FLOATING WINDOWS
      ========================================================= */}

      {/* 1. Live Web Preview Window Modal */}
      <WebPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        iframeUrl={iframeUrl}
        runStatus={runStatus}
        onRunProject={runProject}
        onStopProject={stopProject}
      />

      {/* 2. Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        fileTree={fileTree}
        onSelectFile={handleSelectFile}
        onRunProject={runProject}
        onNewFile={() => handleCreateFile('newFile.js')}
        onTogglePreview={() => setIsPreviewModalOpen((prev) => !prev)}
        onOpenInvite={() => setIsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportZip={handleExportZip}
      />

      {/* 3. Keyboard Shortcuts Modal (?) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* 4. Collaborators Modal */}
      <CollaboratorsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
        users={users}
        selectedUserId={selectedUserId}
        onUserToggle={handleUserToggle}
        onAddCollaborators={handleAddCollaborators}
      />

      {/* 5. Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default Project;