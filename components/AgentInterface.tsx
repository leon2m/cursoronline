
import React, { useState, useEffect, useRef } from 'react';
import { AgentTask, CodeFile, AgentStatus, AgentRole, AgentMember, ProjectConfig, ApplicationType, PlatformType } from '../types';
import { generateTeamPlan, generateAgentFileContent } from '../services/geminiService';
import { Play, Loader2, CheckCircle, Terminal as TerminalIcon, Sparkles, Layout, Smartphone, Gamepad2, Server, Wand2, ChevronRight, Monitor, Globe, Layers, Box, Cpu as ChipIcon, Laptop, Code2, Database, Container, Cloud, Shield, Zap } from 'lucide-react';

interface AgentInterfaceProps {
  files: CodeFile[];
  onUpdateFile: (fileName: string, content: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenPreview: () => void;
  onFocusFile: (fileName: string) => void;
  persistentState: {
    prompt: string;
    status: AgentStatus;
    tasks: AgentTask[];
    logs: string[];
    activeAgent: AgentRole | null;
    config?: ProjectConfig;
  };
  setPersistentState: React.Dispatch<React.SetStateAction<any>>;
}

const LANGUAGES = [
  { id: 'typescript', label: 'TypeScript', color: 'text-blue-400', icon: Code2 },
  { id: 'python', label: 'Python', color: 'text-yellow-400', icon: Code2 },
  { id: 'cpp', label: 'C++', color: 'text-blue-600', icon: ChipIcon },
  { id: 'lua', label: 'Lua', color: 'text-indigo-400', icon: Gamepad2 },
  { id: 'go', label: 'Go', color: 'text-cyan-400', icon: Server },
  { id: 'rust', label: 'Rust', color: 'text-orange-600', icon: ChipIcon },
  { id: 'swift', label: 'Swift', color: 'text-orange-500', icon: Smartphone },
  { id: 'sql', label: 'SQL', color: 'text-pink-400', icon: Database },
];

const ARCHITECTURES = [
  { id: 'monolith', label: 'Monolith', icon: Box },
  { id: 'mvc', label: 'MVC', icon: Layers },
  { id: 'modular', label: 'Modular', icon: Box },
  { id: 'serverless', label: 'Serverless', icon: ChipIcon },
];

const PLATFORMS = [
  { id: 'browser', label: 'Web/Cloud', icon: Globe },
  { id: 'ios', label: 'iOS Native', icon: Smartphone },
  { id: 'android', label: 'Android Native', icon: Smartphone },
  { id: 'cross_platform', label: 'Cross-Platform', icon: Smartphone },
  { id: 'windows', label: 'Windows App', icon: Laptop },
  { id: 'linux', label: 'Linux/Server', icon: Server },
];

const PROJECT_TOOLS = [
  { id: 'docker', label: 'Docker & Compose', category: 'DevOps', icon: Container },
  { id: 'expo', label: 'Expo / React Native', category: 'Mobile', icon: Smartphone },
  { id: 'firebase', label: 'Firebase', category: 'Backend', icon: Cloud },
  { id: 'supabase', label: 'Supabase', category: 'Backend', icon: Database },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'Styling', icon: Layout },
  { id: 'jest', label: 'Jest / Testing', category: 'Quality', icon: Shield },
  { id: 'vite', label: 'Vite', category: 'Build', icon: Zap },
  { id: 'github_actions', label: 'GitHub Actions', category: 'CI/CD', icon: Server },
];

const TEAM_MEMBERS: AgentMember[] = [
  { role: 'planner', name: 'Mimar Selim', title: 'System Architect', avatar: 'MS', description: 'Mimarisi ve dosya yapısı.', status: 'idle' },
  { role: 'designer', name: 'Tasarımcı Derin', title: 'UI/UX Lead', avatar: 'TD', description: 'Görsel estetik ve CSS.', status: 'idle' },
  { role: 'frontend', name: 'Kodcu Kerem', title: 'Frontend Dev', avatar: 'KK', description: 'İstemci kodları.', status: 'idle' },
  { role: 'backend', name: 'Sistem Mert', title: 'Backend Dev', avatar: 'SM', description: 'Veri mantığı.', status: 'idle' },
  { role: 'lead', name: 'Lider Leyla', title: 'Team Lead', avatar: 'LL', description: 'Refactor ve Final.', status: 'idle' },
];

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
  files,
  onUpdateFile,
  onCreateFile,
  onDeleteFile,
  onOpenPreview,
  onFocusFile,
  persistentState,
  setPersistentState
}) => {
  const { prompt, status, tasks, logs, activeAgent, config } = persistentState;
  const [showWizard, setShowWizard] = useState(!config);
  const [tempConfig, setTempConfig] = useState<ProjectConfig>(config || {
      type: 'web',
      platform: 'browser',
      languages: ['typescript'],
      frameworks: ['react'],
      tools: [],
      isAiRecommended: true,
      architecture: 'mvc',
      buildTarget: 'debug'
  });
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const updateState = (updates: any) => setPersistentState((prev: any) => ({ ...prev, ...updates }));
  const addLog = (msg: string) => {
    updateState({ logs: [...persistentState.logs, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`] });
  };

  const toggleLanguage = (langId: string) => {
      setTempConfig(prev => {
          const languages = prev.languages.includes(langId) 
            ? prev.languages.filter(l => l !== langId)
            : [...prev.languages, langId];
          return { ...prev, languages, isAiRecommended: false };
      });
  };

  const toggleTool = (toolId: string) => {
      setTempConfig(prev => {
          const tools = prev.tools.includes(toolId) 
            ? prev.tools.filter(t => t !== toolId)
            : [...prev.tools, toolId];
          return { ...prev, tools };
      });
  };

  const startTeamBuild = async () => {
    if (!prompt.trim()) return;
    updateState({ status: 'working', logs: [], tasks: [], activeAgent: 'planner', config: tempConfig });
    setShowWizard(false);
    addLog(`Neural Link v4.5 Başlatıldı. Mimari: ${tempConfig.architecture.toUpperCase()} | Stack: ${tempConfig.isAiRecommended ? 'AI Recommended' : tempConfig.languages.join('+')}`);
    if (tempConfig.tools.length > 0) addLog(`Aktif Araçlar: ${tempConfig.tools.join(', ').toUpperCase()}`);

    try {
      const generatedTasks = await generateTeamPlan(prompt, files, tempConfig);
      updateState({ tasks: generatedTasks });
      addLog(`Mimar planı onayladı. ${generatedTasks.length} görev kuyruğa alındı.`);
      
      let currentFilesState = [...files];

      for (const task of generatedTasks) {
        updateState({ activeAgent: task.assignedTo });
        updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'in-progress' } : t) });
        
        const agent = TEAM_MEMBERS.find(m => m.role === task.assignedTo);
        addLog(`${agent?.name} [${task.assignedTo}] işleniyor: ${task.fileName}`);
        onFocusFile(task.fileName);

        try {
          const content = await generateAgentFileContent(task, prompt, currentFilesState, tempConfig);
          if (task.type === 'create') {
            onCreateFile(task.fileName, content);
            currentFilesState.push({ id: Math.random().toString(), name: task.fileName, content, language: 'typescript' } as CodeFile);
          } else if (task.type === 'update') {
            onUpdateFile(task.fileName, content);
            currentFilesState = currentFilesState.map(f => f.name === task.fileName ? { ...f, content } : f);
          }
          updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'completed' } : t) });
        } catch (e) {
          updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'failed' } : t) });
          throw e;
        }
      }
      updateState({ status: 'completed', activeAgent: null });
      addLog('Build tamamlandı. Proje çalışmaya hazır.');
      onOpenPreview();
    } catch (error) {
      addLog(`Kritik Hata: ${error}`);
      updateState({ status: 'error', activeAgent: null });
    }
  };

  const renderWizard = () => (
      <div className="flex-1 p-6 overflow-y-auto space-y-8 animate-apple-fade-in custom-scrollbar bg-[#050505] text-white">
          <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-lg z-10 pb-4 border-b border-white/5">
              <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                  <Wand2 className="w-6 h-6 text-brand-primary" />
                  ARCHITECT MODE
              </h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Uçtan Uca Proje Konfigürasyonu</p>
          </div>

          {/* AI Recommendation Toggle */}
          <button 
            onClick={() => setTempConfig({...tempConfig, isAiRecommended: !tempConfig.isAiRecommended})}
            className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center justify-between ${
                tempConfig.isAiRecommended 
                ? 'bg-brand-primary/10 border-brand-primary shadow-2xl shadow-brand-primary/20' 
                : 'bg-white/5 border-transparent'
            }`}
          >
              <div className="flex items-center gap-4 text-left">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tempConfig.isAiRecommended ? 'bg-brand-primary text-black' : 'bg-white/10 text-gray-500'}`}>
                      <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                      <h4 className="text-lg font-black tracking-tight">AI Recommended Selection</h4>
                      <p className="text-[11px] opacity-60">Hedef platforma göre en iyi stack'i ve toolchain'i Claude Opus belirler.</p>
                  </div>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${tempConfig.isAiRecommended ? 'border-brand-primary bg-brand-primary' : 'border-white/20'}`}>
                  {tempConfig.isAiRecommended && <CheckCircle className="w-5 h-5 text-black" />}
              </div>
          </button>

          {/* Application Category */}
          <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Uygulama Kategorisi</label>
              <div className="grid grid-cols-2 gap-3">
                  {[
                      { id: 'web', label: 'Web Application', icon: Layout },
                      { id: 'mobile', label: 'Mobile Native', icon: Smartphone },
                      { id: 'game', label: 'Game / Engine', icon: Gamepad2 },
                      { id: 'system', label: 'System / API', icon: Server },
                      { id: 'desktop', label: 'Desktop App', icon: Laptop },
                      { id: 'fullstack', label: 'Full Stack', icon: Layers },
                  ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setTempConfig({...tempConfig, type: item.id as ApplicationType})}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            tempConfig.type === item.id ? 'bg-white/10 border-brand-primary text-white' : 'bg-white/5 border-transparent text-gray-500 opacity-60'
                        }`}
                      >
                          <item.icon className="w-5 h-5" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                      </button>
                  ))}
              </div>
          </div>

          {/* Multi-Language Selection */}
          <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Teknoloji Yığını</label>
              <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map(lang => (
                      <button 
                        key={lang.id}
                        onClick={() => toggleLanguage(lang.id)}
                        className={`px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-tight transition-all flex items-center justify-between ${
                            tempConfig.languages.includes(lang.id) 
                            ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                            : 'bg-white/5 border-transparent text-gray-500 opacity-40 hover:opacity-100'
                        }`}
                      >
                          <div className="flex items-center gap-2">
                             <lang.icon className={`w-4 h-4 ${lang.color}`} />
                             <span>{lang.label}</span>
                          </div>
                          {tempConfig.languages.includes(lang.id) && <CheckCircle className="w-3 h-3" />}
                      </button>
                  ))}
              </div>
          </div>

          {/* Tooling & Infrastructure - NEW SECTION */}
          <div className="space-y-4">
              <label className="text-[10px] font-black text-brand-secondary uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Container className="w-3 h-3" /> DevOps, Mobile Runtime & Ecosystem
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PROJECT_TOOLS.map(tool => (
                      <button 
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`px-3 py-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-3 text-center ${
                            tempConfig.tools.includes(tool.id) 
                            ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary shadow-lg shadow-brand-secondary/10' 
                            : 'bg-white/5 border-transparent text-gray-500 opacity-50 hover:opacity-100 hover:border-white/10'
                        }`}
                      >
                          <tool.icon className={`w-5 h-5 ${tempConfig.tools.includes(tool.id) ? 'text-brand-secondary' : 'text-gray-400'}`} />
                          <div className="flex flex-col">
                              <span>{tool.label}</span>
                              <span className="text-[8px] opacity-60 font-medium tracking-wide mt-1">{tool.category}</span>
                          </div>
                      </button>
                  ))}
              </div>
          </div>

          {/* Platform Targeting */}
          <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Hedef Platform & Runtime</label>
              <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setTempConfig({...tempConfig, platform: p.id as PlatformType})}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            tempConfig.platform === p.id 
                            ? 'bg-white/10 border-brand-primary text-white' 
                            : 'bg-white/5 border-transparent text-gray-500 opacity-60'
                        }`}
                      >
                          <p.icon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                      </button>
                  ))}
              </div>
          </div>

          {/* Architectural Patterns */}
          <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Yazılım Mimarisi</label>
              <div className="grid grid-cols-2 gap-2">
                  {ARCHITECTURES.map(arch => (
                      <button 
                        key={arch.id}
                        onClick={() => setTempConfig({...tempConfig, architecture: arch.id as any})}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            tempConfig.architecture === arch.id 
                            ? 'bg-white/10 border-brand-primary text-white' 
                            : 'bg-white/5 border-transparent text-gray-500 opacity-60'
                        }`}
                      >
                          <arch.icon className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{arch.label}</span>
                      </button>
                  ))}
              </div>
          </div>

          <div className="pt-8 pb-12">
              <button 
                onClick={() => setShowWizard(false)}
                className="w-full py-5 bg-brand-primary text-black rounded-3xl font-black uppercase tracking-[4px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-2xl shadow-brand-primary/40"
              >
                  Konfigürasyonu Onayla <ChevronRight className="w-6 h-6" />
              </button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent text-brand-dark overflow-hidden">
      {/* Team Dashboard Bar */}
      <div className="p-4 flex justify-between gap-1 border-b border-glass-border bg-black/[0.02] dark:bg-white/[0.02]">
        {TEAM_MEMBERS.map((member) => (
          <div 
            key={member.role}
            className={`flex flex-col items-center gap-2 flex-1 p-2 rounded-2xl transition-all duration-700 border ${
              activeAgent === member.role 
                ? 'bg-brand-primary/10 border-brand-primary/30 shadow-sm scale-105' 
                : 'border-transparent opacity-40 grayscale'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
              activeAgent === member.role ? 'bg-brand-primary text-white border-white animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300'
            }`}>
              {member.avatar}
            </div>
            <div className="text-center overflow-hidden">
                <p className="text-[9px] font-bold truncate leading-none mb-0.5">{member.name.split(' ')[1]}</p>
                <p className="text-[7px] opacity-60 truncate uppercase tracking-tighter">{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      {showWizard ? renderWizard() : (
          <>
            {/* Input Area */}
            {(status !== 'working') && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between px-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary/60">
                           <Monitor className="w-3 h-3" />
                           {tempConfig.type.toUpperCase()} / {tempConfig.platform.toUpperCase()}
                       </div>
                       <button onClick={() => setShowWizard(true)} className="text-[10px] text-brand-primary font-bold hover:underline">Config Değiştir</button>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={prompt}
                      onChange={(e) => updateState({ prompt: e.target.value })}
                      placeholder="Talimatınızı girin..."
                      className="w-full h-24 bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-primary/20 rounded-3xl p-5 text-[13px] text-brand-dark focus:outline-none resize-none smooth-transition"
                    />
                    <div className="absolute right-3 bottom-3 flex gap-2">
                         <button
                            onClick={startTeamBuild}
                            disabled={!prompt.trim()}
                            className="bg-brand-primary text-white p-3 rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-110 active:scale-95 smooth-transition disabled:opacity-30"
                        >
                            <Play className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                  </div>
                </div>
            )}

            {/* Terminal Output */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0b] mx-4 mb-4 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
                <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Architect Terminal</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] leading-relaxed selection:bg-brand-primary selection:text-white custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                            <Sparkles className="w-10 h-10 mb-3" />
                            <span>Mimari tasarım bekleniyor...</span>
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-2 flex gap-3">
                                <span className="text-zinc-600 flex-shrink-0">{log.substring(0, 10)}</span>
                                <span className={`${log.includes('HATA') ? 'text-red-400' : 'text-zinc-300'}`}>{log.substring(11)}</span>
                            </div>
                        ))
                    )}
                    {status === 'working' && (
                        <div className="flex items-center gap-2 text-brand-primary mt-3 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Ajanlar senkronize oluyor...</span>
                        </div>
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>
          </>
      )}

      {/* Task Mini List */}
      {!showWizard && tasks.length > 0 && (
          <div className="px-5 pb-5">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {tasks.map(task => (
                      <div key={task.id} className={`flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-bold border flex items-center gap-2 transition-all ${
                          task.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                          task.status === 'in-progress' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary scale-105' :
                          'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500'
                      }`}>
                          {task.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {task.status === 'in-progress' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {task.fileName}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
