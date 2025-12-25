
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActivityBar } from './components/ActivityBar';
import { CodeEditor } from './components/Editor';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { AuthModal } from './components/AuthModal';
import { CodeFile, SupportedLanguage, EditorSettings, AIActionType, ViewMode, Project, User, Language } from './types';
import { constructActionPrompt } from './services/geminiService';
import { AuthService } from './services/authService';
import { CloudService } from './services/cloudService';
import { t } from './utils/i18n';
import { Play, Menu, Plus, Clock, FolderGit2, ArrowRight, Cloud, ShieldCheck, Bot, Zap, Globe, Users, Code2, LogOut, Loader2, Trash2, Cpu, Sparkles, Terminal, Brain, Layers, GitBranch, Command, ChevronRight } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [appState, setAppState] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('explorer');
  const [isAIStatsOpen, setIsAIStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [aiTrigger, setAiTrigger] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);

  const [settings, setSettings] = useState<EditorSettings>({
    theme: 'light',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    language: 'en'
  });

  // --- KONAMI CODE EASTER EGG ---
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          setIsMatrixMode(prev => !prev);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const currentUser = AuthService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        const userProjects = await CloudService.getProjects();
        setProjects(userProjects);
        setAppState('dashboard');
      } else {
        setAppState('landing');
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark' || isMatrixMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [settings.theme, isMatrixMode]);

  // Auto-Save Effect
  useEffect(() => {
    if (currentProject && files.length > 0) {
      const timer = setTimeout(() => {
        CloudService.syncProjectFiles(currentProject.id, files);
        setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, files, updatedAt: Date.now() } : p));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [files, currentProject]);

  const l = (key: string) => t(settings.language, key);

  const handleLoginSuccess = async (u: User) => {
    setIsLoading(true);
    setUser(u);
    const userProjects = await CloudService.getProjects();
    setProjects(userProjects);
    setAppState('dashboard');
    setIsLoading(false);
  };

  const handleLogout = async () => {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
      setCurrentProject(null);
      setFiles([]);
      setAppState('landing');
      setIsLoading(false);
  };

  const startNewProject = async () => {
    setIsLoading(true);
    const welcomeFile: CodeFile = {
      id: generateId(),
      name: 'main.tsx',
      language: SupportedLanguage.TYPESCRIPT,
      content: `export default function App() {\n  return (\n    <div className="p-10">\n      <h1 className="text-4xl font-bold">Hello World</h1>\n      <p>Built with Cursor Premium.</p>\n    </div>\n  );\n}`,
      isUnsaved: false
    };
    
    const newProject: Project = {
      id: generateId(),
      name: `Project ${projects.length + 1}`,
      description: 'Yeni bir premium deneyim.',
      updatedAt: Date.now(),
      files: [welcomeFile]
    };

    try {
      const updatedProjects = await CloudService.saveProject(newProject);
      setProjects(updatedProjects);
      openProject(newProject);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openProject = (p: Project) => {
    setCurrentProject(p);
    setFiles(p.files);
    setActiveFileId(p.files[0]?.id || null);
    setAppState('editor');
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this project?')) {
        const updated = await CloudService.deleteProject(id);
        setProjects(updated);
    }
  }

  const handleFocusFile = (fileName: string) => {
    const file = files.find(f => f.name === fileName);
    if (file) setActiveFileId(file.id);
  };

  const handleAgentCreateFile = (name: string, content: string) => {
    const newFile: CodeFile = {
      id: generateId(),
      name,
      language: name.endsWith('.html') ? 'html' : 'typescript',
      content,
      isUnsaved: true
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleCodeChange = (val: string | undefined) => {
    if (val === undefined || !activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: val, isUnsaved: true } : f));
  };

  const handleAIAction = (action: AIActionType) => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;
    const prompt = constructActionPrompt(action, activeFile.content, activeFile.language);
    setAiTrigger(prompt);
    setIsAIStatsOpen(true);
  };

  // --- INTERACTIVE & 3D LANDING COMPONENTS ---

  const Hero3D = () => {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Normalize mouse position -1 to 1
        const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        setMouse({ x, y });
    };

    const handleMouseLeave = () => setMouse({ x: 0, y: 0 });

    const cardStyle = {
        transform: `rotateY(${mouse.x * 10}deg) rotateX(${mouse.y * -10}deg) translateZ(20px)`,
        transition: 'transform 0.1s ease-out'
    };

    const floatStyle = {
        transform: `translateX(${mouse.x * -30}px) translateY(${mouse.y * -30}px)`,
        transition: 'transform 0.2s ease-out'
    };

    return (
        <section 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-screen bg-[#000000] overflow-hidden flex flex-col items-center justify-center pt-20 perspective-container"
        >
            {/* Background Grid - Moves inverse to mouse */}
            <div 
                className="absolute inset-0 z-0 opacity-20" 
                style={{ 
                    transform: `translate(${mouse.x * 20}px, ${mouse.y * 20}px) scale(1.1)`,
                    background: 'radial-gradient(circle at center, transparent 0%, #000 90%), linear-gradient(#2EA446 1px, transparent 1px), linear-gradient(90deg, #2EA446 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 50px 50px, 50px 50px'
                }} 
            />

            <div className="z-10 text-center px-4 mb-20 relative transform-style-3d">
                <div 
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-[10px] font-mono mb-8 backdrop-blur-md"
                    style={{ transform: `translateZ(50px)` }}
                >
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                    <span>SYSTEM_ONLINE :: v4.5.0</span>
                </div>
                
                <h1 
                    className="text-7xl md:text-[10rem] font-black text-white tracking-tighter leading-[0.85] mb-6 mix-blend-screen select-none"
                    style={{ 
                        textShadow: `0 0 20px rgba(46, 164, 70, 0.5), ${mouse.x * -10}px ${mouse.y * -10}px 0px rgba(255,0,0,0.5)`,
                        transform: `translateZ(80px)` 
                    }}
                >
                    CLAUDE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">OPUS</span>
                </h1>
                
                <p 
                    className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light tracking-wide"
                    style={{ transform: `translateZ(40px)` }}
                >
                    Coding reimagined with <span className="text-brand-primary font-bold">Model 4.5</span> intelligence. 
                    <br/>Autonomous agents. Zero latency. Pure focus.
                </p>

                <div className="flex justify-center gap-6" style={{ transform: `translateZ(60px)` }}>
                    <button onClick={() => setIsAuthModalOpen(true)} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-brand-primary hover:text-white transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        INITIALIZE_CORE
                    </button>
                </div>
            </div>

            {/* 3D Floating Elements */}
            <div className="absolute inset-0 pointer-events-none transform-style-3d">
                <div style={{ ...floatStyle, position: 'absolute', top: '20%', left: '15%' }} className="p-4 bg-black/80 border border-white/10 rounded-xl backdrop-blur text-xs font-mono text-gray-400">
                    <span className="text-purple-400">def</span> <span className="text-yellow-300">optimize</span>(): <br/>
                    &nbsp;&nbsp;return <span className="text-brand-primary">True</span>
                </div>
                <div style={{ ...floatStyle, position: 'absolute', bottom: '30%', right: '10%', transitionDelay: '0.1s' }} className="p-4 bg-black/80 border border-white/10 rounded-xl backdrop-blur text-xs font-mono text-gray-400">
                    <span className="text-blue-400">interface</span> <span className="text-yellow-300">Agent</span> {'{'} <br/>
                    &nbsp;&nbsp;iq: <span className="text-brand-primary">400</span>;<br/>
                    {'}'}
                </div>
            </div>
        </section>
    );
  };

  const OpusShowcase = () => {
    return (
        <section className="min-h-screen bg-black relative py-32 border-t border-white/5 overflow-hidden">
             {/* Glowing Orb Background */}
             <div className="absolute top-1/2 left-[-10%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px]"></div>

             <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                 <div className="relative transform-style-3d perspective-container group">
                     {/* The Card */}
                     <div className="relative z-10 bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 rotate-y-12 group-hover:rotate-y-0 transition-transform duration-700 shadow-2xl">
                         <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                             <div className="flex items-center gap-3">
                                 <Brain className="w-8 h-8 text-purple-500" />
                                 <span className="font-bold text-lg text-white">Claude Opus 4.5</span>
                             </div>
                             <div className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-1 rounded">V4.5-PREVIEW</div>
                         </div>
                         <div className="space-y-4 font-mono text-sm">
                             <div className="flex justify-between text-gray-500">
                                 <span>Reasoning</span>
                                 <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-purple-500 w-[98%]"></div>
                                 </div>
                             </div>
                             <div className="flex justify-between text-gray-500">
                                 <span>Context Window</span>
                                 <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-brand-primary w-[100%]"></div>
                                 </div>
                             </div>
                             <div className="flex justify-between text-gray-500">
                                 <span>Creativity</span>
                                 <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                                     <div className="h-full bg-pink-500 w-[95%]"></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                     {/* Back Glow */}
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20 -z-10 group-hover:opacity-40 transition-opacity duration-700"></div>
                 </div>

                 <div className="space-y-8">
                     <h2 className="text-5xl font-bold text-white leading-tight">
                         Beyond <br/>
                         <span className="text-transparent bg-clip-text bg-opus-gradient">Human Intelligence</span>
                     </h2>
                     <p className="text-gray-400 text-lg leading-relaxed">
                         Claude Opus 4.5 doesn't just write code; it understands intent. 
                         With a <strong>2M+ token context window</strong>, it holds your entire repository 
                         in active memory, refactoring across thousands of files instantly.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-6 pt-8">
                         <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/50 transition-colors">
                             <Zap className="w-6 h-6 text-purple-400 mb-3" />
                             <h4 className="text-white font-bold mb-1">Hyper-Heuristic</h4>
                             <p className="text-xs text-gray-500">Self-correcting code generation.</p>
                         </div>
                         <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/50 transition-colors">
                             <Layers className="w-6 h-6 text-pink-400 mb-3" />
                             <h4 className="text-white font-bold mb-1">Visual Vision</h4>
                             <p className="text-xs text-gray-500">Understands UI screenshots & mockups.</p>
                         </div>
                     </div>
                 </div>
             </div>
        </section>
    );
  };

  const FunctionalTerminal = () => {
    const [history, setHistory] = useState<string[]>(['> Initializing Claude Opus 4.5 environment...', '> System Ready. Type "help" for commands.']);
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim().toLowerCase();
            const newHistory = [...history, `root@cursor:~$ ${input}`];
            
            // Easter Eggs & Commands
            if (cmd === 'help') {
                newHistory.push('> Available commands: help, clear, whoami, ls, cat, opus, matrix');
            } else if (cmd === 'clear') {
                setHistory([]);
                setInput('');
                return;
            } else if (cmd === 'whoami') {
                newHistory.push('> root (god mode)');
            } else if (cmd === 'ls') {
                newHistory.push('projects/  secrets.txt  node_modules/  README.md');
            } else if (cmd.startsWith('cat')) {
                if (cmd.includes('secrets.txt')) {
                    newHistory.push('> EASTER EGG FOUND! Use code: CURSOR_OPUS_2024 for 1 month free premium.');
                } else {
                    newHistory.push(`> Access denied or file not found.`);
                }
            } else if (cmd === 'opus') {
                newHistory.push('> Connecting to Neural Net...');
                newHistory.push('> .......................');
                newHistory.push('> Connection established. I am watching.');
            } else if (cmd === 'matrix') {
                setIsMatrixMode(prev => !prev);
                newHistory.push(`> Matrix mode ${!isMatrixMode ? 'ENABLED' : 'DISABLED'}. Follow the white rabbit.`);
            } else if (cmd === '') {
                // do nothing
            } else {
                newHistory.push(`> Command not found: ${cmd}`);
            }

            setHistory(newHistory);
            setInput('');
        }
    };

    return (
        <section className="min-h-[80vh] bg-black flex flex-col items-center justify-center border-t border-white/5 py-20 px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">Direct Neural Interface</h2>
                <p className="text-gray-500">Interact with the system directly. Try to find the hidden secrets.</p>
            </div>

            <div 
                className="w-full max-w-3xl bg-[#0c0c0c] border border-gray-800 rounded-lg shadow-2xl overflow-hidden font-mono text-sm crt-screen"
                onClick={() => inputRef.current?.focus()}
            >
                <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between border-b border-gray-800">
                    <span className="text-xs text-gray-500">bash — 80x24</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
                <div className="p-6 h-[400px] overflow-y-auto crt-text text-brand-primary" style={{ textShadow: isMatrixMode ? '0 0 5px #0f0' : undefined, color: isMatrixMode ? '#0f0' : '#2EA446' }}>
                    {history.map((line, i) => (
                        <div key={i} className="mb-1">{line}</div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-white">root@cursor:~$</span>
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleCommand}
                            className="bg-transparent border-none outline-none flex-1 text-brand-primary"
                            style={{ color: isMatrixMode ? '#0f0' : '#2EA446' }}
                            autoFocus
                        />
                    </div>
                    <div ref={bottomRef} />
                </div>
            </div>
        </section>
    );
  };

  const Footer = () => (
    <footer className="bg-black border-t border-white/10 py-20 px-6">
        <div className="container mx-auto grid md:grid-cols-4 gap-12 text-sm">
            <div className="col-span-2">
                <div className="flex items-center gap-2 font-bold text-xl text-white mb-6">
                    <Bot className="w-6 h-6 text-brand-primary" /> CURSOR
                </div>
                <p className="text-gray-500 max-w-sm">
                    Reimagining software development with AI-native workflows. 
                    Built for the developers of tomorrow.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">PRODUCT</h4>
                <ul className="space-y-2 text-gray-500">
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">Claude Opus 4.5</li>
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">Enterprise</li>
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">Security</li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">COMPANY</h4>
                <ul className="space-y-2 text-gray-500">
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">About</li>
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">Careers</li>
                    <li className="hover:text-brand-primary cursor-pointer transition-colors">Contact</li>
                </ul>
            </div>
        </div>
        <div className="container mx-auto mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-xs">
            © 2025 Cursor Premium Online. Powered by Claude Opus 4.5.
        </div>
    </footer>
  );

  // --- RENDERERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center animate-bounce">
             <Bot className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="flex items-center gap-2 text-brand-primary/50 font-mono text-xs tracking-widest">
              <Loader2 className="w-3 h-3 animate-spin" /> SYSTEM_BOOT
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'landing') {
    return (
        <div className={`bg-black min-h-screen text-white overflow-x-hidden selection:bg-brand-primary selection:text-white font-sans ${isMatrixMode ? 'font-mono' : ''}`}>
            {/* Matrix Overlay if Enabled */}
            {isMatrixMode && (
                <div className="fixed inset-0 pointer-events-none z-[100] bg-black/20 mix-blend-overlay flex overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="text-green-500 text-xs animate-float opacity-50 ml-10 mt-10 writing-vertical" style={{ animationDelay: `${i * 0.2}s` }}>
                            10101010100101
                        </div>
                    ))}
                </div>
            )}

            {/* Fixed Nav */}
            <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 h-20 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-[#1a4d23] flex items-center justify-center text-white shadow-[0_0_20px_rgba(46,164,70,0.3)] border border-white/10">
                        <Bot className="w-6 h-6" />
                    </div>
                    <span className="font-display tracking-widest hidden sm:block">CURSOR</span>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition-colors"><Globe className="w-5 h-5" /></button>
                    <button onClick={() => setIsAuthModalOpen(true)} className="text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors hidden sm:block tracking-widest uppercase font-mono">
                        Login_Access
                    </button>
                    <button 
                        onClick={() => setIsAuthModalOpen(true)} 
                        className="group bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-brand-primary hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                        Get Started <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </nav>

            <Hero3D />
            <OpusShowcase />
            <FunctionalTerminal />
            <Footer />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={setSettings} />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} lang={settings.language} onLoginSuccess={handleLoginSuccess} />
        </div>
    );
  }

  // --- DASHBOARD & EDITOR (Unchanged logic) ---
  if (appState === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0a0a0a] text-brand-dark flex flex-col items-center justify-center p-6 animate-apple-fade-in font-sans relative overflow-hidden">
          {/* Dashboard Header */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 font-bold text-xl opacity-80">
                  <Bot className="w-6 h-6 text-brand-primary" />
                  Cursor
              </div>
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white dark:bg-white/10 rounded-full shadow-sm hover:scale-105 transition-transform"><Globe className="w-4 h-4" /></button>
                  <div className="flex items-center gap-3 bg-white dark:bg-white/10 pl-4 pr-2 py-1.5 rounded-full shadow-sm">
                      <span className="text-sm font-bold opacity-80">{user?.displayName}</span>
                      <div className="w-7 h-7 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">{user?.avatar}</div>
                  </div>
                  <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><LogOut className="w-4 h-4" /></button>
              </div>
          </div>

          <div className="max-w-4xl w-full pt-16">
              <header className="mb-12 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{l('dashboard.welcome')} {user?.displayName.split(' ')[0]}.</h1>
                  <p className="text-lg text-brand-dark/40 font-medium">Ready to build with Claude Opus 4.5?</p>
              </header>

              <div className="grid md:grid-cols-2 gap-6">
                  {/* New Project Card */}
                  <button 
                    onClick={startNewProject}
                    className="group bg-white dark:bg-white/5 p-8 rounded-[32px] border border-transparent hover:border-brand-primary/30 smooth-transition text-left shadow-lg hover:shadow-xl hover:scale-[1.01] flex flex-col h-[300px] relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Plus className="w-32 h-32" />
                      </div>
                      <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 smooth-transition">
                          <Plus className="w-6 h-6 text-brand-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{l('dashboard.newProject')}</h3>
                      <p className="text-brand-dark/40 text-sm mb-auto leading-relaxed max-w-[80%]">Start building a new application from scratch with your AI team.</p>
                      <div className="flex items-center gap-2 text-brand-primary font-bold text-sm mt-8">
                          {l('landing.getStarted')} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </div>
                  </button>

                  {/* Project List */}
                  <div className="bg-white dark:bg-white/5 p-8 rounded-[32px] border border-transparent flex flex-col h-[300px] shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-bold">{l('dashboard.projects')}</h3>
                          <span className="text-xs font-bold bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">{projects.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {projects.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                  <FolderGit2 className="w-8 h-8 mb-2" />
                                  <div className="text-sm font-medium">{l('dashboard.noProjects')}</div>
                              </div>
                          ) : (
                              projects.map(p => (
                                  <div 
                                    key={p.id}
                                    onClick={() => openProject(p)}
                                    className="group p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer smooth-transition flex items-center justify-between border border-transparent hover:border-brand-primary/10"
                                  >
                                      <div className="min-w-0">
                                          <h4 className="font-bold text-sm mb-1 truncate">{p.name}</h4>
                                          <div className="flex items-center gap-2 text-[10px] opacity-40 uppercase tracking-widest font-bold">
                                              <Clock className="w-3 h-3" /> {new Date(p.updatedAt).toLocaleDateString()}
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={(e) => deleteProject(e, p.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                          <ArrowRight className="w-4 h-4 opacity-20" />
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          </div>
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={setSettings} />
      </div>
    );
  }

  // --- EDITOR VIEW (Unchanged) ---
  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a] text-brand-dark overflow-hidden font-sans">
      <div className={`flex flex-row h-full z-40 smooth-transition fixed inset-y-0 left-0 md:relative md:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <ActivityBar 
            activeView={activeView} 
            onViewChange={setActiveView}
            onToggleAI={() => { setIsAIStatsOpen(!isAIStatsOpen); setIsMobileMenuOpen(false); }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            activeView={activeView}
            onSelectFile={setActiveFileId}
            onCreateFile={() => handleAgentCreateFile(`new_file_${files.length}.ts`, '')}
            onDeleteFile={(id, e) => { e.stopPropagation(); setFiles(f => f.filter(x => x.id !== id)); }}
            onImportFile={() => {}} 
            onExportFile={() => {}}
          />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0a0a0a] border-l border-glass-border">
        <header className="h-14 border-b border-glass-border flex items-center justify-between px-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden"><Menu className="w-5 h-5" /></button>
             <button onClick={() => setAppState('dashboard')} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 smooth-transition flex items-center gap-1 hover:text-brand-primary">
                 <ArrowRight className="w-3 h-3 rotate-180" /> DASHBOARD
             </button>
             <div className="h-4 w-px bg-glass-border mx-2"></div>
             <span className="text-[13px] font-bold tracking-tight opacity-80">{files.find(f => f.id === activeFileId)?.name}</span>
          </div>
          <button onClick={() => setIsPreviewOpen(true)} className="bg-brand-primary text-white px-5 py-1.5 rounded-full text-[12px] font-bold shadow-xl shadow-brand-primary/20 smooth-transition hover:scale-105 active:scale-95 flex items-center gap-2">
              <Play className="w-3 h-3 fill-current" /> Çalıştır
          </button>
        </header>

        <main className="flex-1 relative">
          <CodeEditor
            language={files.find(f => f.id === activeFileId)?.language || 'typescript'}
            value={files.find(f => f.id === activeFileId)?.content || ''}
            onChange={handleCodeChange}
            settings={settings}
          />
        </main>
      </div>

      <AIAssistant 
        isVisible={isAIStatsOpen} 
        onClose={() => setIsAIStatsOpen(false)}
        activeFile={files.find(f => f.id === activeFileId)}
        files={files}
        triggerPrompt={aiTrigger}
        onPromptHandled={() => setAiTrigger(undefined)}
        onUpdateFile={(n, c) => setFiles(prev => prev.map(f => f.name === n ? { ...f, content: c } : f))}
        onCreateFile={handleAgentCreateFile}
        onDeleteFile={(n) => setFiles(prev => prev.filter(f => f.name !== n))}
        onOpenPreview={() => setIsPreviewOpen(true)}
        onAction={handleAIAction}
        onFocusFile={handleFocusFile}
      />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onUpdateSettings={setSettings} />
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} files={files} />
    </div>
  );
}

export default App;
