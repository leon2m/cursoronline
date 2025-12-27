
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActivityBar } from './components/ActivityBar';
import { CodeEditor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { StatusBar } from './components/StatusBar';
import { MenuBar } from './components/MenuBar';
import { AgentManagerModal } from './components/AgentManagerModal';
import { CodeFile, EditorSettings, ViewMode, Project, User, AgentTask, AgentStatus, AgentRole, EXTENSION_TO_LANGUAGE, ProjectConfig } from './types';
import { constructActionPrompt, createChatSession } from './services/geminiService';
import { CloudService } from './services/cloudService';
import { Play, Plus, Search, ArrowLeft, Bot, PanelRightClose, PanelRightOpen, LayoutTemplate, Command } from 'lucide-react';
import JSZip from 'jszip';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [appState, setAppState] = useState<'dashboard' | 'editor'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('explorer');
  
  const [isAIStatsOpen, setIsAIStatsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAgentManagerOpen, setIsAgentManagerOpen] = useState(false);

  const [aiTrigger, setAiTrigger] = useState<string | undefined>(undefined);
  
  // Editor State Tracking
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  
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

  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'cursor-dark',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    language: 'en',
    rules: '',
    mcpServers: []
  });

  // --- THEME MANAGEMENT ---
  useEffect(() => {
      const html = document.documentElement;
      // Remove all theme classes first
      ['cursor-dark', 'cursor-light', 'vercel-dark', 'dracula', 'monokai', 'nord'].forEach(t => html.classList.remove(t));
      // Add active theme
      html.classList.add(settings.theme);
  }, [settings.theme]);

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
      description: 'Untitled Project',
      updatedAt: Date.now(),
      files: [{ id: generateId(), name: 'App.tsx', path: 'src/App.tsx', language: 'typescript', content: '// Start building...', isUnsaved: false }]
    };
    const updatedProjects = await CloudService.saveProject(newProject);
    setProjects(updatedProjects);
    setCurrentProject(newProject);
    setFiles(newProject.files);
    setActiveFileId(newProject.files[0].id);
    setAppState('editor');
    setIsLoading(false);
  };

  const handleCreateFile = (name: string, content: string | boolean = '') => {
    const fileContent = typeof content === 'string' ? content : '';
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.')) : '';
    const language = EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'plaintext';
    const newFile: CodeFile = { 
        id: generateId(), 
        name, 
        path: name,
        language, 
        content: fileContent, 
        isUnsaved: true 
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };
  
  const handleUpdateFile = (fileName: string, content: string) => {
      setFiles(prev => prev.map(f => f.name === fileName ? { ...f, content, isUnsaved: true } : f));
  };

  const handleMenuAction = (action: string) => {
      switch(action) {
          case 'new_file':
              handleCreateFile('Untitled.ts');
              break;
          case 'save':
          case 'save_all':
              if (activeFileId) {
                  setFiles(prev => prev.map(f => ({ ...f, isUnsaved: false })));
                  if (currentProject) CloudService.syncProjectFiles(currentProject.id, files);
              }
              break;
          case 'view_explorer': setActiveView('explorer'); setIsSidebarOpen(true); break;
          case 'view_search': setActiveView('search'); setIsSidebarOpen(true); break;
          case 'view_extensions': setActiveView('extensions'); setIsSidebarOpen(true); break;
          case 'run_debug':
          case 'run_no_debug':
              setIsPreviewOpen(true);
              break;
          case 'undo': console.log("Undo"); break;
      }
  };

  if (isLoading) return <div className="h-screen bg-[#09090b] flex items-center justify-center text-gray-500 text-xs tracking-widest uppercase">Initializing Environment...</div>;

  // --- DASHBOARD VIEW ---
  if (appState === 'dashboard') {
      return (
          <div className="h-screen bg-[#09090b] text-white p-16 flex flex-col font-sans selection:bg-[#3794FF] selection:text-white">
              <header className="flex justify-between items-center mb-20">
                  <div className="flex items-center gap-3 font-medium text-xl tracking-tight text-gray-200">
                      <div className="w-8 h-8 bg-[#3794FF] rounded-lg flex items-center justify-center text-black">
                        <Bot className="w-5 h-5" />
                      </div>
                      Cursor
                  </div>
              </header>
              <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                      <h2 className="text-2xl font-normal text-white">Get Started</h2>
                      <div className="grid gap-4">
                        <button onClick={startNewProject} className="group flex items-center gap-4 p-4 bg-[#18181b] border border-[#27272a] hover:border-[#3794FF] hover:bg-[#1f1f23] rounded-lg transition-all text-left">
                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#3794FF]" />
                            <div>
                                <h3 className="text-sm font-medium text-gray-200">New Project</h3>
                                <p className="text-xs text-gray-500 mt-1">Start from scratch with AI assistance</p>
                            </div>
                        </button>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <h2 className="text-2xl font-normal text-white">Recent</h2>
                      <div className="space-y-1">
                          {projects.length === 0 && <div className="text-gray-600 text-sm italic">No recent projects</div>}
                          {projects.map(p => (
                              <button key={p.id} onClick={() => { setCurrentProject(p); setFiles(p.files); setActiveFileId(p.files[0]?.id); setAppState('editor'); }} className="w-full text-left p-3 hover:bg-[#18181b] rounded-lg text-sm text-gray-400 hover:text-white transition-colors flex justify-between group">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-gray-600 group-hover:text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </main>
          </div>
      )
  }

  // --- EDITOR WORKSPACE VIEW ---
  return (
    <div className="flex flex-col h-screen theme-bg-main theme-text overflow-hidden font-sans transition-colors duration-300">
      
      {/* GLOBAL MENU BAR (Topmost) */}
      <MenuBar 
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onToggleAiPanel={() => setIsAIStatsOpen(!isAIStatsOpen)}
          isAiPanelOpen={isAIStatsOpen}
          onAction={handleMenuAction}
          onOpenAgentManager={() => setIsAgentManagerOpen(true)}
      />

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex min-h-0">
          
          {/* ACTIVITY BAR (Leftmost) */}
          <ActivityBar 
            activeView={activeView} 
            onViewChange={setActiveView}
            onToggleAI={() => setIsAIStatsOpen(!isAIStatsOpen)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* SIDEBAR (Explorer) */}
          {isSidebarOpen && (
              <Sidebar
                files={files}
                activeFileId={activeFileId}
                activeView={activeView}
                onSelectFile={setActiveFileId}
                onCreateFile={handleCreateFile}
                onDeleteFile={(id, e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== id)); }}
                onImportFile={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => handleCreateFile(file.name); 
                    reader.readAsText(file);
                }}
                onExportFile={() => {}}
                onExportZip={() => {}}
              />
          )}

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0 theme-bg-main">
              
              {/* FILE TABS */}
              <div className="h-9 flex items-center px-0 theme-border border-b select-none overflow-x-auto custom-scrollbar theme-bg-sec">
                   {/* Active File Tab */}
                   {files.map(file => (
                       <div 
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r min-w-[120px] max-w-[200px] group theme-border ${
                                file.id === activeFileId 
                                ? 'theme-bg-main theme-text border-t-2 border-t-[#3794FF]' 
                                : 'theme-bg-sec text-gray-500 hover:bg-white/5'
                            }`}
                       >
                            <span className="truncate flex-1">{file.name}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(f => f.id !== file.id)); }} 
                                className={`opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 ${file.isUnsaved ? 'block opacity-100' : ''}`}
                            >
                                {file.isUnsaved ? <div className="w-2 h-2 rounded-full theme-text bg-current opacity-70"></div> : <span className="text-gray-400 hover:text-red-500">×</span>}
                            </button>
                       </div>
                   ))}
              </div>

              {/* EDITOR + AI SPLIT VIEW */}
              <div className="flex-1 flex min-h-0 relative">
                  
                  {/* EDITOR */}
                  <div className="flex-1 relative min-w-0">
                      <CodeEditor
                        language={files.find(f => f.id === activeFileId)?.language || 'typescript'}
                        value={files.find(f => f.id === activeFileId)?.content || ''}
                        onChange={(val) => setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val || '', isUnsaved: true } : f))}
                        settings={settings}
                      />
                      
                      {/* Floating Run Button */}
                      <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="absolute top-4 right-6 bg-green-600 hover:bg-green-500 text-white p-2 rounded-full shadow-lg z-10 transition-transform hover:scale-105"
                        title="Run Code"
                      >
                          <Play className="w-4 h-4 fill-current" />
                      </button>
                  </div>

                  {/* AI ASSISTANT PANEL */}
                  {isAIStatsOpen && (
                      <div className="w-[400px] theme-border border-l flex flex-col shadow-xl z-10 transition-all theme-bg-sec">
                          <AIAssistant 
                            isVisible={true}
                            onClose={() => setIsAIStatsOpen(false)} 
                            activeFile={files.find(f => f.id === activeFileId)} 
                            files={files} 
                            onUpdateFile={handleUpdateFile}
                            onCreateFile={handleCreateFile}
                            onDeleteFile={(n) => setFiles(prev => prev.filter(f => f.name !== n))}
                            onOpenPreview={() => setIsPreviewOpen(true)}
                            onAction={(a) => {
                                const f = files.find(f => f.id === activeFileId);
                                if(f) { setAiTrigger(constructActionPrompt(a, f.content, f.language)); }
                            }}
                            onFocusFile={(n) => { const f = files.find(f => f.name === n); if(f) setActiveFileId(f.id); }}
                            triggerPrompt={aiTrigger}
                            onPromptHandled={() => setAiTrigger(undefined)}
                            persistentState={persistentAgentState}
                            setPersistentState={setPersistentAgentState}
                          />
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* STATUS BAR */}
      <StatusBar 
         file={files.find(f => f.id === activeFileId)} 
         isSaving={files.some(f => f.isUnsaved)}
         cursorPosition={cursorPos}
      />

      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        files={files} 
        onUpdateFile={handleUpdateFile}
        onFixError={(e) => { setAiTrigger(`Fix this error: ${e}`); setIsAIStatsOpen(true); setIsPreviewOpen(false); }} 
      />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={setSettings} />
      <AgentManagerModal isOpen={isAgentManagerOpen} onClose={() => setIsAgentManagerOpen(false)} activeAgent={persistentAgentState.activeAgent} agentStatus={persistentAgentState.status} />
    </div>
  );
}

export default App;
