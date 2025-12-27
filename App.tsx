
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActivityBar } from './components/ActivityBar';
import { CodeEditor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { CodeFile, EditorSettings, ViewMode, Project, User, AgentTask, AgentStatus, AgentRole, EXTENSION_TO_LANGUAGE, ProjectConfig } from './types';
import { constructActionPrompt } from './services/geminiService';
import { CloudService } from './services/cloudService';
import { Play, Plus, Clock, ArrowRight, Bot, LogOut, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  // Start directly at dashboard
  const [appState, setAppState] = useState<'dashboard' | 'editor'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock User - Auth is disabled
  const [user, setUser] = useState<User>({
    id: 'mock-user-1',
    email: 'dev@cursor.ai',
    displayName: 'Senior Developer',
    avatar: 'SD'
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('explorer');
  const [isAIStatsOpen, setIsAIStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<string | undefined>(undefined);
  
  const [persistentAgentState, setPersistentAgentState] = useState<{
    prompt: string;
    status: AgentStatus;
    tasks: AgentTask[];
    logs: string[];
    activeAgent: AgentRole | null;
    config?: ProjectConfig;
  }>({
    prompt: '',
    status: 'idle',
    tasks: [],
    logs: [],
    activeAgent: null,
    config: undefined
  });

  // Forced Dark Theme Settings
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'dark',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    language: 'tr'
  });

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const userProjects = await CloudService.getProjects();
      setProjects(userProjects);
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (currentProject && files.length > 0) {
      const timer = setTimeout(() => {
        CloudService.syncProjectFiles(currentProject.id, files);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [files, currentProject]);

  const startNewProject = async () => {
    setIsLoading(true);
    const newProject: Project = {
      id: generateId(),
      name: `Project ${projects.length + 1}`,
      description: 'Modern AI Projesi',
      updatedAt: Date.now(),
      files: [{ id: generateId(), name: 'App.tsx', language: 'typescript', content: '// Start building...', isUnsaved: false }]
    };
    const updatedProjects = await CloudService.saveProject(newProject);
    setProjects(updatedProjects);
    setCurrentProject(newProject);
    setFiles(newProject.files);
    setActiveFileId(newProject.files[0].id);
    
    setPersistentAgentState({
        prompt: '',
        status: 'idle',
        tasks: [],
        logs: [],
        activeAgent: null,
        config: undefined
    });

    setAppState('editor');
    setIsLoading(false);
  };

  const handleAgentCreateFile = (name: string, content: string) => {
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    const language = EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'plaintext';
    const newFile: CodeFile = { id: generateId(), name, language, content, isUnsaved: true };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleExportZip = async () => {
      const zip = new JSZip();
      files.forEach(f => zip.file(f.name, f.content));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${currentProject?.name || 'project'}.zip`;
      link.click();
  };

  if (isLoading) return <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-primary animate-spin" /></div>;

  // Replaced Landing Page with Dashboard logic
  if (appState === 'dashboard') {
      return (
          <div className="h-screen bg-[#050505] text-white p-12 overflow-hidden flex flex-col">
              <header className="flex justify-between items-center mb-16 flex-shrink-0">
                  <div className="flex items-center gap-3 font-black text-2xl tracking-tighter"><Bot className="w-8 h-8 text-brand-primary" /> CURSOR <span className="text-brand-primary text-sm align-top ml-1">PREMIUM</span></div>
              </header>
              <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
                  <button onClick={startNewProject} className="h-full max-h-[400px] bg-brand-surface border border-white/5 rounded-[40px] hover:border-brand-primary/50 transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center group-hover:scale-110 transition-all border border-brand-primary/20"><Plus className="w-8 h-8 text-brand-primary" /></div>
                      <span className="font-black uppercase tracking-[0.2em] text-sm text-gray-400 group-hover:text-white">Yeni Proje Mimarisi</span>
                  </button>
                  <div className="bg-brand-surface border border-white/5 rounded-[40px] p-8 overflow-y-auto max-h-[400px]">
                      <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500 mb-6 sticky top-0 bg-brand-surface pb-4 border-b border-white/5">Mevcut Projeler</h3>
                      <div className="space-y-3">
                          {projects.length === 0 && (
                             <div className="text-center py-10 opacity-40 italic">Henüz proje yok.</div>
                          )}
                          {projects.map(p => (
                              <div key={p.id} onClick={() => { setCurrentProject(p); setFiles(p.files); setActiveFileId(p.files[0]?.id); setAppState('editor'); }} className="p-5 bg-black/20 rounded-3xl hover:bg-white/5 cursor-pointer flex justify-between items-center border border-white/5 hover:border-brand-primary/30 transition-all group">
                                  <div>
                                      <h4 className="font-bold text-sm text-gray-200 group-hover:text-white">{p.name}</h4>
                                      <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-1"><Clock className="inline w-3 h-3 mr-1" /> {new Date(p.updatedAt).toLocaleDateString()}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-primary -translate-x-2 group-hover:translate-x-0 transition-all" />
                              </div>
                          ))}
                      </div>
                  </div>
              </main>
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      <div className="flex flex-row h-full z-40 fixed inset-y-0 left-0 md:relative">
          <ActivityBar 
            activeView={activeView} 
            onViewChange={setActiveView}
            onToggleAI={() => setIsAIStatsOpen(!isAIStatsOpen)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            activeView={activeView}
            onSelectFile={setActiveFileId}
            onCreateFile={() => handleAgentCreateFile(`new_file_${files.length}.ts`, '')}
            onDeleteFile={(id, e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== id)); }}
            onImportFile={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => handleAgentCreateFile(file.name, e.target?.result as string);
                reader.readAsText(file);
            }}
            onExportFile={() => {}}
            onExportZip={handleExportZip}
          />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0b] border-l border-white/5">
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0b] z-10">
          <div className="flex items-center gap-4">
              <button onClick={() => setAppState('dashboard')} className="text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-100 transition-all">← Dash</button>
              <h1 className="font-black text-xs tracking-widest uppercase opacity-80 text-brand-primary">{files.find(f => f.id === activeFileId)?.name}</h1>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setIsPreviewOpen(true)} className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-primary hover:text-white transition-all shadow-lg hover:shadow-brand-primary/20">
                  <Play className="w-3 h-3 fill-current" /> Çalıştır / Live
              </button>
          </div>
        </header>
        <main className="flex-1 relative">
          <CodeEditor
            language={files.find(f => f.id === activeFileId)?.language || 'typescript'}
            value={files.find(f => f.id === activeFileId)?.content || ''}
            onChange={(val) => setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val || '', isUnsaved: true } : f))}
            settings={settings}
          />
        </main>
      </div>

      <AIAssistant 
        isVisible={isAIStatsOpen} 
        onClose={() => setIsAIStatsOpen(false)} 
        activeFile={files.find(f => f.id === activeFileId)} 
        files={files} 
        onUpdateFile={(n, c) => setFiles(prev => prev.map(f => f.name === n ? { ...f, content: c } : f))}
        onCreateFile={handleAgentCreateFile}
        onDeleteFile={(n) => setFiles(prev => prev.filter(f => f.name !== n))}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onAction={(a) => {
            const f = files.find(f => f.id === activeFileId);
            if(f) { setAiTrigger(constructActionPrompt(a, f.content, f.language)); setIsAIStatsOpen(true); }
        }}
        onFocusFile={(n) => { const f = files.find(f => f.name === n); if(f) setActiveFileId(f.id); }}
        triggerPrompt={aiTrigger}
        onPromptHandled={() => setAiTrigger(undefined)}
        persistentState={persistentAgentState}
        setPersistentState={setPersistentAgentState}
      />

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} files={files} onFixError={(e) => { setAiTrigger(`Düzelt: ${e}`); setIsAIStatsOpen(true); setIsPreviewOpen(false); }} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={setSettings} />
    </div>
  );
}

export default App;
