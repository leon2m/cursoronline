
import React, { useState, useEffect, useRef } from 'react';
import { AgentTask, CodeFile, AgentStatus, AgentRole, AgentMember } from '../types';
import { generateTeamPlan, generateAgentFileContent } from '../services/geminiService';
import { Play, Loader2, CheckCircle, Terminal as TerminalIcon, Cpu, User, Sparkles } from 'lucide-react';

interface AgentInterfaceProps {
  files: CodeFile[];
  onUpdateFile: (fileName: string, content: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenPreview: () => void;
  onFocusFile: (fileName: string) => void;
  // External state management to survive tab switches
  persistentState: {
    prompt: string;
    status: AgentStatus;
    tasks: AgentTask[];
    logs: string[];
    activeAgent: AgentRole | null;
  };
  setPersistentState: React.Dispatch<React.SetStateAction<any>>;
}

const TEAM_MEMBERS: AgentMember[] = [
  { role: 'planner', name: 'Mimar Selim', title: 'System Architect', avatar: 'MS', description: 'Mimarisi ve dosya yapısı.', status: 'idle' },
  { role: 'designer', name: 'Tasarımcı Derin', title: 'UI/UX Lead', avatar: 'TD', description: 'Görsel estetik ve CSS.', status: 'idle' },
  { role: 'frontend', name: 'Kodcu Kerem', title: 'Frontend Dev', avatar: 'KK', description: 'React ve etkileşim.', status: 'idle' },
  { role: 'backend', name: 'Sistem Mert', title: 'Backend Dev', avatar: 'SM', description: 'Veri mantığı ve API.', status: 'idle' },
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
  const { prompt, status, tasks, logs, activeAgent } = persistentState;
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const updateState = (updates: any) => setPersistentState((prev: any) => ({ ...prev, ...updates }));

  const addLog = (msg: string) => {
    updateState({ logs: [...logs, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`] });
  };

  const startTeamBuild = async () => {
    if (!prompt.trim()) return;
    updateState({ status: 'working', logs: [], tasks: [], activeAgent: 'planner' });
    addLog(`Takım Lideri Leyla toplantıyı başlattı. Hedef: "${prompt}"`);

    try {
      const generatedTasks = await generateTeamPlan(prompt, files);
      updateState({ tasks: generatedTasks });
      addLog(`Selim mimariyi çıkardı. ${generatedTasks.length} görev belirlendi.`);
      
      let currentFilesState = [...files];

      for (const task of generatedTasks) {
        updateState({ activeAgent: task.assignedTo });
        updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'in-progress' } : t) });
        
        const agent = TEAM_MEMBERS.find(m => m.role === task.assignedTo);
        addLog(`${agent?.name} işleme başladı: ${task.fileName}`);
        
        // Auto focus editor on current work
        onFocusFile(task.fileName);

        try {
          const content = await generateAgentFileContent(task, prompt, currentFilesState);
          
          if (task.type === 'create') {
            onCreateFile(task.fileName, content);
            currentFilesState.push({ id: Math.random().toString(), name: task.fileName, content, language: 'typescript' } as CodeFile);
          } else if (task.type === 'update') {
            onUpdateFile(task.fileName, content);
            currentFilesState = currentFilesState.map(f => f.name === task.fileName ? { ...f, content } : f);
          } else {
            onDeleteFile(task.fileName);
            currentFilesState = currentFilesState.filter(f => f.name !== task.fileName);
          }
          
          updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'completed' } : t) });
          addLog(`${agent?.name} görevini tamamladı.`);
        } catch (e) {
          updateState({ tasks: (persistentState.tasks as AgentTask[]).map(t => t.id === task.id ? { ...t, status: 'failed' } : t) });
          throw e;
        }
      }

      updateState({ status: 'completed', activeAgent: null });
      addLog('Proje başarıyla derlendi. Canlı önizleme hazır.');
      onOpenPreview();
    } catch (error) {
      addLog(`KRİTİK HATA: ${error}`);
      updateState({ status: 'error', activeAgent: null });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-brand-dark overflow-hidden">
      {/* Human-Like Team Dashboard */}
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

      {/* Input Area */}
      {(status !== 'working') && (
        <div className="p-5 space-y-4">
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => updateState({ prompt: e.target.value })}
              placeholder="Yeni bir özellik veya tüm bir uygulama tarif edin..."
              className="w-full h-24 bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-primary/20 rounded-2xl p-4 text-[13px] text-brand-dark focus:outline-none resize-none smooth-transition"
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
                 <button
                    onClick={startTeamBuild}
                    disabled={!prompt.trim()}
                    className="bg-brand-primary text-white p-2.5 rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 smooth-transition disabled:opacity-30"
                >
                    <Play className="w-4 h-4 fill-current" />
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Terminal Output */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0b] mx-4 mb-4 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="h-9 bg-white/5 border-b border-white/5 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Team Output</span>
            </div>
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed selection:bg-brand-primary selection:text-white">
            {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                    <Cpu className="w-8 h-8 mb-2" />
                    <span>Takım komut bekliyor...</span>
                </div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className="mb-1.5 flex gap-3">
                        <span className="text-zinc-600 flex-shrink-0">{log.substring(0, 10)}</span>
                        <span className={`${log.includes('HATA') ? 'text-red-400' : 'text-zinc-300'}`}>{log.substring(11)}</span>
                    </div>
                ))
            )}
            {status === 'working' && (
                <div className="flex items-center gap-2 text-brand-primary mt-2 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                    <span>İşleniyor...</span>
                </div>
            )}
            <div ref={logsEndRef} />
        </div>
      </div>

      {/* Task Mini List */}
      {tasks.length > 0 && (
          <div className="px-5 pb-5">
              <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-brand-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">Geliştirme Planı</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {tasks.map(task => (
                      <div key={task.id} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium border flex items-center gap-2 ${
                          task.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
                          task.status === 'in-progress' ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' :
                          'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500'
                      }`}>
                          {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {task.status === 'in-progress' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {task.fileName}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
