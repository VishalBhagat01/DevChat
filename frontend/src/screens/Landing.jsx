import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeCanvas from '../components/ThreeCanvas';
import InteractiveIDEPreview from '../components/InteractiveIDEPreview';
import { sounds } from '../utils/soundEffects';
import {
  Sparkles,
  Zap,
  Terminal,
  Users,
  Code2,
  ArrowRight,
  Cpu,
  ShieldCheck,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  GitBranch,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [soundActive, setSoundActive] = useState(sounds.isEnabled());
  const [activeSection, setActiveSection] = useState('');
  const containerRef = useRef(null);
  const token = localStorage.getItem('token');

  const handleStartNow = () => {
    sounds.playChime();
    navigate('/login');
  };

  const handleToggleSound = () => {
    const newState = sounds.toggle();
    setSoundActive(newState);
  };

  // Buttery-smooth programmatic scrolling with audio feedback
  const scrollToSection = (id) => {
    sounds.playClick();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      title: 'AI Pair Programming',
      description:
        'Context-aware AI partner that writes code, fixes bugs, explains complex logic, and generates modular components on the fly.',
      badge: 'Gemini 2.5 Powered',
      borderColor: 'hover:border-cyan-500/50',
    },
    {
      icon: <Terminal className="w-6 h-6 text-emerald-400" />,
      title: 'In-Browser WebContainer',
      description:
        'Run real Node.js runtimes, install npm packages, and spin up microservices directly in your browser with zero remote server latency.',
      badge: 'Node.js in Browser',
      borderColor: 'hover:border-emerald-500/50',
    },
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: 'Multiplayer Real-Time Sync',
      description:
        'Collaborate with developers across the globe simultaneously. Real-time cursor tracking, live typing, and instant file synchronization.',
      badge: 'WebSocket 60Hz',
      borderColor: 'hover:border-purple-500/50',
    },
    {
      icon: <Code2 className="w-6 h-6 text-blue-400" />,
      title: 'Monaco Professional Editor',
      description:
        'The same editor engine powering VS Code. Full syntax highlighting, intelligent auto-complete, multi-file workspace, and hot-reload preview.',
      badge: 'VS Code Engine',
      borderColor: 'hover:border-blue-500/50',
    },
  ];

  const stats = [
    { value: '0 ms', label: 'Cloud VM Boot Delay', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { value: '60 FPS', label: 'Hardware 3D Engine', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
    { value: '100%', label: 'In-Browser Execution', icon: <Cpu className="w-4 h-4 text-purple-400" /> },
    { value: 'End-to-End', label: 'Encrypted Multi-Tenant', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-y-auto overflow-x-hidden scroll-smooth bg-[#070709] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Optimized 3D WebGL Canvas Layer (Three.js) */}
      <ThreeCanvas className="fixed inset-0" interactive={true} />

      {/* Cyber Grid Pattern */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* High-Performance Radial Ambient Lighting (Zero Blur Pass Overhead) */}
      <div 
        className="pointer-events-none fixed inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.06) 0%, transparent 40%)
          `,
        }}
      />

      {/* Floating Header Navigation */}
      <header className="sticky top-0 z-50 w-full bg-[#070709]/80 backdrop-blur-md border-b border-white/[0.08] transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => {
              sounds.playPop();
              containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-200">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0a0a10]">
                <i className="ri-code-box-fill text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  DevChat
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold tracking-wide">
                  3D AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                Collaborative Cloud Workspace
              </p>
            </div>
          </div>

          {/* Animated Smooth Scroll Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button
              onClick={() => scrollToSection('features')}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${
                activeSection === 'features' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('preview')}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${
                activeSection === 'preview' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Live Demo
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className={`hover:text-cyan-300 transition-colors cursor-pointer ${
                activeSection === 'architecture' ? 'text-cyan-400 font-semibold' : ''
              }`}
            >
              Architecture
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundActive ? 'Mute Interface Sounds' : 'Unmute Interface Sounds'}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              {soundActive ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {/* Quick dashboard jump if token exists */}
            {token ? (
              <button
                onClick={() => { sounds.playChime(); navigate('/dashboard'); }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/[0.12] bg-white/[0.05] text-zinc-200 hover:bg-white/[0.1] transition-all cursor-pointer"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStartNow}
                className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Primary "Start Now" Button */}
            <button
              id="header-start-now-btn"
              onClick={handleStartNow}
              className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <span className="relative flex items-center gap-2">
                Start Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">

        {/* HERO SECTION */}
        <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center max-w-5xl mx-auto">
          
          {/* Top Pill Beacon */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-xs font-mono text-cyan-300 mb-8 shadow-inner shadow-cyan-500/20">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>DevChat 2.0 • WebContainer Powered Real-Time IDE</span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">Zero Setup Required</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Code Together in Real Time.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Build in 3D Space.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-10">
            An ultra-fast cloud developer workspace with in-browser Node.js WebContainers, 
            intelligent AI pair programming, and multi-user live synchronization. No VMs to configure.
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {/* START NOW BUTTON (Direct redirect to /login) */}
            <button
              id="hero-start-now-btn"
              onClick={handleStartNow}
              className="w-full sm:w-auto relative group overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <span>Start Now — It&apos;s Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Smooth Animated Live Preview Button */}
            <button
              onClick={() => scrollToSection('preview')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 text-base font-medium rounded-2xl border border-white/[0.12] bg-[#101118]/90 hover:bg-white/[0.08] text-zinc-200 hover:text-white transition-all duration-200 cursor-pointer"
            >
              <span>Explore Live Demo</span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Tech Stack Pills Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">POWERED BY:</span>
            {['Three.js WebGL', 'WebContainer API', 'Gemini AI', 'Monaco Editor', 'Socket.io', 'React 19'].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>

        </section>

        {/* 3D INTERACTIVE IDE PREVIEW SECTION */}
        <section id="preview" className="relative px-6 py-16 max-w-6xl mx-auto scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Live Sandbox Simulation
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Interactive 3D Workspace Experience
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
              Hover and tilt the workspace window to interact with real-time collaborative coding, 
              AI assistance, and instant in-browser terminal compilation.
            </p>
          </div>

          {/* Render 3D Perspective IDE */}
          <InteractiveIDEPreview />
        </section>

        {/* STATS HIGHLIGHT BAR */}
        <section className="relative px-6 py-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90 text-center hover:border-cyan-500/30 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CORE FEATURES GRID */}
        <section id="features" className="relative px-6 py-20 max-w-6xl mx-auto scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/30 text-xs font-mono text-blue-400 mb-4">
              <Cpu className="w-3.5 h-3.5" /> Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Engineered for Modern Developers
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Everything you need to write, run, debug, and ship production-ready applications with your team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                onMouseEnter={() => sounds.playClick()}
                className={`group relative p-8 rounded-3xl border border-white/[0.08] ${feat.borderColor} bg-[#0e0f17]/90 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-default`}
              >
                <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/[0.1] shadow-md">
                        {feat.icon}
                      </div>
                      <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Active in DevChat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS / ARCHITECTURE SECTION */}
        <section id="architecture" className="relative px-6 py-20 max-w-5xl mx-auto scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-3">
              How DevChat Works
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              From zero to running full-stack applications in three frictionless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90">
              <div className="text-3xl font-mono font-black text-cyan-400/50 mb-3">01</div>
              <h4 className="text-lg font-bold text-white mb-2">Create Workspace</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Initialize projects instantly. DevChat creates an isolated secure room with WebSockets and auto-synchronization.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90">
              <div className="text-3xl font-mono font-black text-purple-400/50 mb-3">02</div>
              <h4 className="text-lg font-bold text-white mb-2">Collaborate & Code</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Type simultaneously with teammates or summon DevChat AI to generate components, tests, and database queries.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/90">
              <div className="text-3xl font-mono font-black text-emerald-400/50 mb-3">03</div>
              <h4 className="text-lg font-bold text-white mb-2">Instant In-Browser Run</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                WebContainers run Node.js natively in your browser tab. View live terminal output and hot-reloading dev servers with 0 latency.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION BANNER */}
        <section className="relative px-6 py-24 max-w-5xl mx-auto">
          <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#0a1526] via-[#0d0e17] to-[#160d26] p-8 sm:p-14 text-center overflow-hidden shadow-2xl shadow-cyan-950/40">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="inline-block text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                Get Started In Seconds
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to Experience Next-Gen Collaborative Coding?
              </h2>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                Join developers building, collaborating, and experimenting in 3D real-time cloud space.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  id="bottom-start-now-btn"
                  onClick={handleStartNow}
                  className="w-full sm:w-auto relative group overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Now — Go to Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#050608] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="font-bold text-zinc-300 font-sans text-sm">DevChat</span>
            <span>•</span>
            <span>Open Source 3D Collaborative IDE</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={handleStartNow}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Sign In / Login
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" /> GitHub
            </a>
            <span>© {new Date().getFullYear()} DevChat. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
