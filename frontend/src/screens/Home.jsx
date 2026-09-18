import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import { sounds } from '../utils/soundEffects';

const TEMPLATES = [
  {
    title: 'Express REST Server',
    desc: 'Node.js backend with Express routing, JSON parser, and healthcheck.',
    tag: 'Backend',
    icon: 'ri-server-line text-emerald-400',
    starterName: 'express-api',
  },
  {
    title: 'Modern Fullstack Studio',
    desc: 'Modular collaboration workspace configured for AI code generation.',
    tag: 'Fullstack',
    icon: 'ri-stack-line text-indigo-400',
    starterName: 'fullstack-studio',
  },
  {
    title: 'Frontend Web Application',
    desc: 'Responsive HTML5/CSS3 client with modern interactions.',
    tag: 'Frontend',
    icon: 'ri-layout-3-line text-cyan-400',
    starterName: 'web-client',
  },
];

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  function fetchProjects() {
    setIsLoading(true);
    axios
      .get('/projects/all')
      .then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Fetch projects error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleCreateProject(name) {
    const normalizedName = (name || projectName).trim();
    if (!normalizedName) return;

    axios
      .post('/projects/create', { name: normalizedName })
      .then((res) => {
        const created = res.data;
        if (created?._id) {
          setProjects((prev) => [created, ...prev]);
          navigate('/project', { state: { project: created } });
        } else {
          fetchProjects();
        }
        setProjectName('');
        setIsModalOpen(false);
        sounds.playChime();
      })
      .catch((error) => {
        console.error('Project creation error:', error);
        sounds.playError();
      });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (setUser) setUser(null);
    sounds.playPop();
    navigate('/login');
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#0c0c10]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-white/10">
              <i className="ri-code-box-fill text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  DevChat
                </span>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.2 text-[10px] font-semibold text-blue-400">
                  Cloud IDE
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                AI Pair Programming & Execution Sandbox
              </p>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] py-1 px-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs text-neutral-300 font-medium">
                {user?.email || 'Developer'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
            >
              <i className="ri-logout-box-r-line"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10 space-y-12">
        {/* Hero Banner */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.06] pb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 mb-3">
              <i className="ri-sparkling-fill text-xs"></i>
              <span>Powered by Google Gemini 3.1 & WebContainers</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Collaborative Cloud Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Build fullstack applications in seconds. Write code with Microsoft Monaco, run real-time Node servers directly in browser sandbox, and pair-program with AI copilot.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsModalOpen(true);
              sounds.playClick();
            }}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-all hover:bg-blue-500 active:scale-95 shrink-0"
          >
            <i className="ri-add-line text-lg transition-transform duration-200 group-hover:rotate-90"></i>
            <span>New Workspace</span>
          </button>
        </div>

        {/* Starter Templates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Quick Start Templates
            </h2>
            <span className="text-xs text-neutral-600">Click to launch workspace</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TEMPLATES.map((tpl, idx) => (
              <div
                key={idx}
                onClick={() => handleCreateProject(tpl.starterName)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0e13] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-[#121218] hover:shadow-2xl hover:shadow-black/60"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10">
                    <i className={`${tpl.icon} text-lg`} />
                  </div>
                  <span className="rounded-full bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                    {tpl.tag}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {tpl.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  {tpl.desc}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Create from template</span>
                  <i className="ri-arrow-right-line"></i>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Project List Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Your Workspaces
              </h2>
              <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-neutral-400 font-medium">
                {projects.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="flex w-full sm:w-72 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs focus-within:border-blue-500/40 focus-within:bg-white/[0.05]">
              <i className="ri-search-line text-neutral-500"></i>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder:text-neutral-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-500 hover:text-white"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
          </div>

          {/* Grid of Projects */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-neutral-500">
              <i className="ri-loader-4-line mr-2 animate-spin text-blue-400 text-lg"></i>
              Loading workspaces...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-16 px-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-neutral-600">
                <i className="ri-folder-open-line text-2xl"></i>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {searchQuery ? 'No matching workspaces found' : 'No workspaces yet'}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                {searchQuery
                  ? 'Try searching with a different keyword.'
                  : 'Get started by creating your first collaborative workspace.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <i className="ri-add-line"></i>
                  <span>Create Workspace</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => {
                    navigate('/project', { state: { project: proj } });
                    sounds.playClick();
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c11] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-[#111118] hover:shadow-xl hover:shadow-black/60"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 group-hover:scale-105 transition-transform">
                      <i className="ri-folder-code-line text-lg"></i>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-neutral-500 group-hover:text-blue-400 transition-colors">
                      <span>Launch Studio</span>
                      <i className="ri-arrow-right-up-line"></i>
                    </div>
                  </div>

                  <h3 className="truncate text-base font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {proj.name}
                  </h3>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <i className="ri-group-line"></i>
                      <span>{proj.users?.length || 1} member{proj.users?.length === 1 ? '' : 's'}</span>
                    </div>

                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px]">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => {
            setIsModalOpen(false);
            setProjectName('');
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#111116] shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/[0.08] px-6 py-5 bg-[#14141c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-inset ring-blue-500/30">
                    <i className="ri-folder-add-line text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Create Workspace
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Configure your cloud development environment
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-white/[0.08] hover:text-white"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateProject(projectName);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. ai-travel-agent"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!projectName.trim()}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500 disabled:opacity-40 transition-all active:scale-95"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;