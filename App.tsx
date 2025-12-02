import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActivityBar } from './components/ActivityBar';
import { CodeEditor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { CodeFile, SupportedLanguage, LANGUAGE_EXTENSIONS, EditorSettings, AIActionType, ViewMode } from './types';
import { constructActionPrompt } from './services/geminiService';
import { Play, Bug, MessageSquare, Lightbulb, Zap, Monitor, Menu, X } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  
  // VS Code Layout States
  const [activeView, setActiveView] = useState<ViewMode>('explorer');
  const [isAIStatsOpen, setIsAIStatsOpen] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<string | undefined>(undefined);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User Settings (Default to Light 'White' as requested)
  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'light',
    fontSize: 14,
    wordWrap: true,
    minimap: true
  });

  // Apply Theme Logic (Global)
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [settings.theme]);

  // Handle Settings from Activity Bar
  useEffect(() => {
    if (activeView === 'settings') {
       setIsSettingsOpen(true);
       setActiveView('explorer'); 
       setIsMobileMenuOpen(false);
    }
  }, [activeView]);

  // Initialize with a welcome file
  useEffect(() => {
    const welcomeFile: CodeFile = {
      id: generateId(),
      name: 'welcome.tsx',
      language: SupportedLanguage.TYPESCRIPT,
      content: `// Welcome to Cursor Online Free
// The Premium, Glassmorphic AI Code Editor.

import React from 'react';

const App = () => {
  return (
    <div className="glass-panel">
      <h1>Built for the Future.</h1>
      <p>Use the Activity Bar on the left to navigate.</p>
      <p>Press the AI Bot icon to start the Agent.</p>
    </div>
  );
};

export default App;
`,
      isUnsaved: false
    };
    setFiles([welcomeFile]);
    setActiveFileId(welcomeFile.id);
  }, []);

  const activeFile = files.find(f => f.id === activeFileId);

  // Improved language detection logic
  const detectLanguage = (filename: string, mimeType: string = '', content: string = ''): string => {
    const lowerName = filename.toLowerCase();
    
    const extensionEntry = Object.entries(LANGUAGE_EXTENSIONS).find(([_, ext]) => 
      lowerName.endsWith(ext)
    );
    if (extensionEntry) {
      return extensionEntry[0];
    }

    if (mimeType) {
      if (mimeType.includes('javascript') || mimeType.includes('ecmascript')) return SupportedLanguage.JAVASCRIPT;
      if (mimeType.includes('html')) return SupportedLanguage.HTML;
      if (mimeType.includes('css')) return SupportedLanguage.CSS;
      if (mimeType.includes('json')) return SupportedLanguage.JSON;
      if (mimeType.includes('python') || mimeType.includes('x-python')) return SupportedLanguage.PYTHON;
      if (mimeType.includes('java-source')) return SupportedLanguage.JAVA;
      if (mimeType.includes('markdown')) return SupportedLanguage.MARKDOWN;
      if (mimeType.includes('sql')) return SupportedLanguage.SQL;
    }

    const trimmed = content.trim();
    const firstLines = trimmed.slice(0, 500); 

    if (/^\s*<!DOCTYPE html/i.test(firstLines) || /^\s*<html/i.test(firstLines)) return SupportedLanguage.HTML;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { JSON.parse(trimmed); return SupportedLanguage.JSON; } catch (e) { }
    }
    if (/^#!.*\bpython\b/i.test(firstLines)) return SupportedLanguage.PYTHON;
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH)\s/i.test(trimmed)) return SupportedLanguage.SQL;
    if (/^#\s/.test(firstLines) || /^={3,}/m.test(firstLines) || /^-{3,}/m.test(firstLines)) return SupportedLanguage.MARKDOWN;

    return SupportedLanguage.TEXT;
  };

  const handleFileCreate = () => {
    const newId = generateId();
    const newFile: CodeFile = {
      id: newId,
      name: `untitled_${files.length + 1}.js`,
      language: SupportedLanguage.JAVASCRIPT,
      content: '// Start coding...',
      isUnsaved: true
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  // Agent API Wrappers
  const handleAgentCreateFile = (name: string, content: string) => {
    if (files.some(f => f.name === name)) {
      handleAgentUpdateFile(name, content);
      return;
    }
    const newFile: CodeFile = {
      id: generateId(),
      name,
      language: detectLanguage(name, '', content),
      content,
      isUnsaved: true
    };
    setFiles(prev => [...prev, newFile]);
    if (!activeFileId) setActiveFileId(newFile.id);
  };

  const handleAgentUpdateFile = (name: string, content: string) => {
    setFiles(prev => prev.map(f => {
      if (f.name === name) {
        return { ...f, content, isUnsaved: true };
      }
      return f;
    }));
  };

  const handleAgentDeleteFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    if (activeFile?.name === name) setActiveFileId(null);
  };

  const handleFileDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
  };

  const handleFileSelect = (id: string) => {
    setActiveFileId(id);
    setIsMobileMenuOpen(false); // Close menu on mobile selection
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined || !activeFileId) return;
    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) return { ...f, content: value, isUnsaved: true };
      return f;
    }));
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const language = detectLanguage(file.name, file.type, content);
      
      const newFile: CodeFile = {
        id: generateId(),
        name: file.name,
        language,
        content,
        isUnsaved: false
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
    };
    reader.readAsText(file);
  };

  const handleExportFile = (file: CodeFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, isUnsaved: false } : f));
  };

  const handleAIAction = (action: AIActionType) => {
    if (!activeFile) return;
    const prompt = constructActionPrompt(action, activeFile.content, activeFile.language);
    setAiTrigger(prompt);
    setIsAIStatsOpen(true);
  };

  return (
    <div className="relative flex flex-col md:flex-row h-screen text-glass-text overflow-hidden font-sans bg-transparent">
      
      {/* --- ANIMATED LIQUID BACKGROUND --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden h-14 flex items-center justify-between px-4 z-50 glass-header flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-glass-text tracking-tight text-lg">CURSOR <span className="font-light">Online</span></span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-glass-text">
             <Menu className="w-6 h-6" />
          </button>
      </div>

      {/* --- MOBILE DRAWER OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* --- LEFT SIDEBAR CONTAINER (Desktop: Static, Mobile: Drawer) --- */}
      <div className={`
          flex flex-row h-full z-40 transition-transform duration-300 ease-out
          fixed inset-y-0 left-0 md:relative md:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          {/* 1. Activity Bar */}
          <ActivityBar 
            activeView={activeView} 
            onViewChange={setActiveView}
            onToggleAI={() => {
              setIsAIStatsOpen(!isAIStatsOpen);
              setIsMobileMenuOpen(false);
            }}
          />

          {/* 2. Side Panel (Files/Search) */}
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            activeView={activeView}
            onSelectFile={handleFileSelect}
            onCreateFile={handleFileCreate}
            onDeleteFile={handleFileDelete}
            onImportFile={handleImportFile}
            onExportFile={handleExportFile}
          />
      </div>

      {/* 3. Main Editor Area */}
      <div className="flex-1 flex flex-col relative min-w-0 m-0 md:m-2 rounded-none md:rounded-2xl glass-panel overflow-hidden z-10 transition-all duration-300 h-full border-x-0 md:border-x border-b-0 md:border-b border-t-0 md:border-t">
        
        {/* Editor Header */}
        <div className="h-12 glass-header flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
          <div className="flex items-center text-sm gap-2 overflow-hidden">
             {activeFile ? (
                 <>
                   <span className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_var(--brand-primary)] flex-shrink-0"></span>
                   <span className="text-glass-text font-semibold tracking-wide truncate">{activeFile.name}</span>
                 </>
             ) : (
                 <span className="text-glass-text-sec italic text-xs md:text-sm">No file selected</span>
             )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             {/* AI Quick Actions - Hidden on mobile, visible desktop */}
             {activeFile && (
               <div className="hidden md:flex items-center gap-1 mr-4 border-r border-glass-border pr-4">
                  <button onClick={() => handleAIAction('explain')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-glass-text-sec hover:text-brand-primary transition-all">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Explain</span>
                  </button>
                  <button onClick={() => handleAIAction('fix')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-glass-text-sec hover:text-brand-primary transition-all">
                    <Bug className="w-3.5 h-3.5" />
                    <span>Fix</span>
                  </button>
                  <button onClick={() => handleAIAction('refactor')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-glass-text-sec hover:text-brand-secondary transition-all">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Refactor</span>
                  </button>
               </div>
             )}

             {/* AI Button for Mobile (Action Sheet Alternative) */}
             {activeFile && (
                <button onClick={() => setIsAIStatsOpen(true)} className="md:hidden p-2 text-brand-primary">
                    <MessageSquare className="w-5 h-5" />
                </button>
             )}

             <button 
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 text-white bg-premium-gradient px-3 py-1.5 md:px-4 md:py-1.5 rounded-full shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 transition-all transform hover:-translate-y-0.5 active:scale-95 whitespace-nowrap" 
                title="Run Live Preview"
            >
                <Play className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold">Run</span>
             </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden">
          {activeFile ? (
            <CodeEditor
              language={activeFile.language}
              value={activeFile.content}
              onChange={handleCodeChange}
              settings={settings}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-glass-text-sec px-4 text-center">
               <div className="w-16 h-16 md:w-20 md:h-20 mb-6 rounded-3xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-2xl shadow-brand-primary/30 animate-blob">
                  <span className="text-3xl md:text-4xl font-bold text-white">C</span>
               </div>
               <p className="text-lg font-medium text-glass-text">Cursor Online Free</p>
               <p className="text-sm mt-2 opacity-60">Open a file from the sidebar to start coding.</p>
            </div>
          )}
        </div>
        
        {/* Footer / Status Bar */}
        <div className="h-6 glass-header flex items-center justify-between px-4 text-[10px] text-glass-text-sec flex-shrink-0">
           <div className="flex items-center gap-3">
               <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> Web Env</span>
               {activeFile && <span className="uppercase hidden md:inline">{activeFile.language}</span>}
           </div>
           <div>
               <span>Ln 1, Col 1</span>
               <span className="ml-4">UTF-8</span>
           </div>
        </div>
      </div>

      {/* AI Assistant Panel (Floating or Fullscreen on Mobile) */}
      <AIAssistant 
        isVisible={isAIStatsOpen} 
        onClose={() => setIsAIStatsOpen(false)}
        activeFile={activeFile}
        files={files}
        triggerPrompt={aiTrigger}
        onPromptHandled={() => setAiTrigger(undefined)}
        onUpdateFile={handleAgentUpdateFile}
        onCreateFile={handleAgentCreateFile}
        onDeleteFile={handleAgentDeleteFile}
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        files={files}
      />
    </div>
  );
}

export default App;