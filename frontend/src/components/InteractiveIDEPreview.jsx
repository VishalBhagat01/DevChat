import React, { useState } from 'react';
import { Play, Terminal, Sparkles, Code2, Users, CheckCircle2 } from 'lucide-react';

const CODE_SNIPPETS = {
  'server.js': `// DevChat Real-Time Collaboration Server
import { createServer } from 'http';
import { Server } from 'socket.io';
import { aiAssistant } from './ai.service.js';

const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('⚡ Peer connected:', socket.id);

  socket.on('project-message', async (data) => {
    // Broadcast real-time edit to active collaborators
    socket.broadcast.to(data.roomId).emit('peer-update', data);
    
    // AI context evaluation & continuous compilation
    if (data.promptAi) {
      const response = await aiAssistant.generateCode(data.context);
      io.to(data.roomId).emit('ai-response', response);
    }
  });
});`,
  'ai.service.js': `// DevChat High-Speed LLM Inference Engine
import { GoogleGenAI } from '@google/genai';

export const aiAssistant = {
  async generateCode(prompt, context) {
    const model = new GoogleGenAI().getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are DevChat AI: Pair programming partner.'
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return result.response.text();
  }
};`
};

const TERMINAL_LOGS = [
  '⚡ [WebContainer] Initializing Node.js v20.12.0 in-browser runtime...',
  '📦 [npm] Packages installed in 420ms (zero-install cache hit)',
  '🚀 [DevChat] Socket server listening on port 3000',
  '🟢 [Presence] User @alex connected to room #devchat-core',
  '🤖 [DevChat AI] Context index updated: 14 files indexed',
  '✨ [Build] Webpack/Vite hot reload active: 0 errors, ready',
];

const InteractiveIDEPreview = () => {
  const [activeTab, setActiveTab] = useState('server.js');
  const [isHovered, setIsHovered] = useState(false);

  const currentCode = CODE_SNIPPETS[activeTab];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative mx-auto w-full max-w-4xl transition-transform duration-500 ease-out will-change-transform"
      style={{
        transform: isHovered
          ? 'perspective(1200px) rotateX(1deg) rotateY(0deg) scale(1.01)'
          : 'perspective(1200px) rotateX(4deg) rotateY(-2deg) scale(0.99)',
      }}
    >
      {/* Ambient Multi-Color Backglow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-600/15 to-purple-600/20 blur-xl opacity-60 pointer-events-none" />

      {/* Main Editor Container */}
      <div className="relative rounded-2xl border border-white/[0.12] bg-[#0c0d13] shadow-2xl shadow-black/80 overflow-hidden">
        
        {/* Top Window Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#12131b] px-4 py-3">
          {/* Window Buttons */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80 border border-red-400/40" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80 border border-yellow-400/40" />
            <span className="h-3 w-3 rounded-full bg-green-500/80 border border-green-400/40" />
            <span className="ml-3 text-xs font-mono text-zinc-400 font-medium hidden sm:inline">
              DevChat Studio • Cloud Workspace
            </span>
          </div>

          {/* File Tabs */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('server.js')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                activeTab === 'server.js'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              server.js
            </button>
            <button
              onClick={() => setActiveTab('ai.service.js')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                activeTab === 'ai.service.js'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              ai.service.js
            </button>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>WebContainer Active</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-mono">
              <Play className="w-3 h-3 fill-current" /> Run
            </div>
          </div>
        </div>

        {/* Code View Area */}
        <div className="relative grid grid-cols-1 md:grid-cols-12 min-h-[300px] font-mono text-xs text-zinc-300">
          {/* Main Code Editor */}
          <div className="md:col-span-8 p-4 relative overflow-hidden bg-[#090a0f]">
            {/* Real-Time Collaborator Tag */}
            <div className="absolute top-10 right-6 z-20 flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/90 px-3 py-1 shadow-lg shadow-cyan-950/50">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-sans font-medium text-cyan-200">
                Alex (Frontend) synchronized
              </span>
            </div>

            <div className="absolute bottom-10 right-8 z-20 flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/90 px-3 py-1 shadow-lg shadow-purple-950/50">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span className="text-[11px] font-sans font-medium text-purple-200">
                DevChat AI paired
              </span>
            </div>

            {/* Code lines with line numbers */}
            <pre className="overflow-x-auto leading-relaxed text-[13px] scrollbar-none">
              <code>
                {currentCode.split('\n').map((line, idx) => (
                  <div key={idx} className="flex items-center hover:bg-white/[0.03] px-2 rounded">
                    <span className="w-8 select-none text-zinc-600 text-right pr-4 font-mono text-xs">
                      {idx + 1}
                    </span>
                    <span
                      className={`font-mono ${
                        line.includes('//')
                          ? 'text-zinc-500 italic'
                          : line.includes('import') || line.includes('const') || line.includes('export')
                          ? 'text-purple-400'
                          : line.includes('function') || line.includes('async') || line.includes('await')
                          ? 'text-blue-400'
                          : line.includes("'") || line.includes('`')
                          ? 'text-emerald-400'
                          : 'text-zinc-200'
                      }`}
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Side Info / Live Features Panel */}
          <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-white/[0.08] bg-[#0c0d14] p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Active Session
              </div>

              {/* Collaborators list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                      A
                    </div>
                    <div>
                      <div className="text-xs text-zinc-200 font-sans font-medium">Alex Rivera</div>
                      <div className="text-[10px] text-zinc-500">Lead Architect</div>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-[10px] text-purple-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs text-purple-200 font-sans font-medium">DevChat AI</div>
                      <div className="text-[10px] text-purple-400/80">Pair Assistant</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-300 font-mono">Ready</span>
                </div>
              </div>

              {/* AI suggestion bubble */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950/40 to-purple-950/40 border border-blue-500/20 text-xs">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> AI Code Review
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Real-time WebSockets synchronized. WebContainer environment is ready for instant <span className="text-cyan-300 font-mono">npm run dev</span>.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-center">
              <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">Latency</div>
                <div className="text-xs font-bold text-emerald-400">12ms</div>
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500">Sync Rate</div>
                <div className="text-xs font-bold text-cyan-400">60 Hz</div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated Terminal Footer */}
        <div className="border-t border-white/[0.08] bg-[#07080d] px-4 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono text-zinc-400 font-medium">
              WebContainer In-Browser Terminal
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {TERMINAL_LOGS.map((log, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 ${
                  log.includes('⚡')
                    ? 'text-cyan-300'
                    : log.includes('🟢')
                    ? 'text-emerald-300'
                    : log.includes('🤖')
                    ? 'text-purple-300'
                    : 'text-zinc-400'
                }`}
              >
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveIDEPreview;
