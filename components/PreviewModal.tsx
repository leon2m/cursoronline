
import React, { useEffect, useState, useRef } from 'react';
import { X, RefreshCw, ExternalLink, Bug, Terminal, Rocket, CheckCircle, AlertCircle, Play, Cpu, Code2, Loader2, Maximize2 } from 'lucide-react';
import { CodeFile } from '../types';
import { simulateExecution, applyModification } from '../services/geminiService';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
  onUpdateFile?: (fileName: string, newContent: string) => void;
  onFixError?: (error: string) => void;
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'system';
  message: string;
  timestamp: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, files, onUpdateFile, onFixError }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [terminalInput, setTerminalInput] = useState('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isWebProject = files.some(f => 
      f.name.endsWith('.html') || 
      f.name.endsWith('.tsx') || 
      f.name.endsWith('.jsx') ||
      (f.name.endsWith('.js') && files.some(other => other.name.endsWith('.html')))
  );

  const entryFile = files.find(f => 
    f.name === 'index.html' || 
    f.name === 'main.cpp' || 
    f.name === 'main.py' || 
    f.name === 'main.lua' || 
    f.name === 'App.tsx' ||
    f.name === 'index.tsx' ||
    f.name === 'main.go'
  ) || files[0];

  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      setDeployUrl(null);
      setDeploySuccess(false);
      if (isWebProject) {
          generateWebPreview();
          setActiveTab('preview');
      } else {
          setActiveTab('console');
          handleUniversalRun();
      }
    }
  }, [isOpen, files]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG') {
        addLog(event.data.level, event.data.message);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type: ConsoleLog['type'], message: string) => {
      setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleCommand = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          const cmd = terminalInput.trim();
          addLog('system', `$ ${cmd}`);
          setTerminalInput('');
          
          if (!cmd) return;

          // Simple Simulation
          setTimeout(() => {
            if (cmd === 'ls') {
                const fileList = files.map(f => f.name).join('  ');
                addLog('log', fileList);
            } else if (cmd === 'clear') {
                setLogs([]);
            } else if (cmd.startsWith('npm install')) {
                addLog('system', 'Installing packages...');
                setTimeout(() => addLog('system', 'Added 42 packages in 1.2s'), 1000);
            } else if (cmd === 'node .' || cmd === 'npm start') {
                if(isWebProject) {
                    generateWebPreview();
                    setActiveTab('preview');
                } else {
                    handleUniversalRun();
                }
            } else if (cmd === 'whoami') {
                addLog('log', 'root');
            } else if (cmd === 'help') {
                addLog('log', 'Available commands: ls, clear, npm install, node ., whoami');
            } else {
                addLog('error', `bash: ${cmd}: command not found`);
            }
          }, 200);
      }
  };

  const generateWebPreview = () => {
    const htmlFile = files.find(f => f.name === 'index.html') || files.find(f => f.name.endsWith('.html'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.tsx'));

    let htmlContent = htmlFile ? htmlFile.content : `
        <!DOCTYPE html>
        <html>
            <head>
                <style>body { font-family: sans-serif; padding: 20px; }</style>
            </head>
            <body>
                <div id="root"></div>
            </body>
        </html>
    `;

    const styleTags = cssFiles.map(f => `<style data-name="${f.name}">${f.content}</style>`).join('\n');
    const interceptor = `
      <script>
        const originalLog = console.log;
        const originalError = console.error;
        window.onerror = function(msg, url, line, col, error) {
            window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: msg }, '*');
        };
        window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'system', message: 'Web Preview Initialized.' }, '*');
        console.log = (...args) => { originalLog(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'log', message: args.join(' ') }, '*'); };
        console.error = (...args) => { originalError(...args); window.parent.postMessage({ type: 'CONSOLE_LOG', level: 'error', message: args.join(' ') }, '*'); };
      </script>
    `;

    const babelScript = `
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    `;

    const userScripts = jsFiles.map(f => {
        const type = (f.name.endsWith('.tsx') || f.name.endsWith('.jsx')) ? 'text/babel' : 'text/javascript';
        return `<script type="${type}" data-name="${f.name}">${f.content}</script>`;
    }).join('\n');

    if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${babelScript}${styleTags}${interceptor}</head>`);
    } else {
        htmlContent = `<head>${babelScript}${styleTags}${interceptor}</head>${htmlContent}`;
    }

    if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${userScripts}</body>`);
    } else {
        htmlContent += userScripts;
    }

    setSrcDoc(htmlContent);
  };

  const handleUniversalRun = async () => {
      setIsSimulating(true);
      addLog('system', `Initializing Universal Runtime Environment for ${entryFile?.name || 'unknown'}...`);

      const result = await simulateExecution(files, entryFile?.id || '');
      setIsSimulating(false);
      
      if (result.error) {
          addLog('error', result.error);
      }
      if (result.output) {
          result.output.split('\n').forEach(line => {
              if (line.trim()) addLog('log', line);
          });
      }
      if (!result.error && !result.output) {
           addLog('system', 'Execution completed with no output.');
      }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    addLog('system', 'Starting production build...');
    
    setTimeout(() => {
         addLog('system', 'Optimizing assets...');
    }, 800);

    setTimeout(() => {
        setIsDeploying(false);
        setDeploySuccess(true);
        const url = `https://cursor-app-${Math.random().toString(36).substr(2, 6)}.vercel.app`;
        setDeployUrl(url);
        addLog('system', `✅ Deployed successfully to ${url}`);
    }, 2500);
  };

  const handleAutoFix = async () => {
      const errorLog = logs.find(l => l.type === 'error');
      if (!errorLog) return;
      
      if (onFixError) {
          onFixError(errorLog.message);
          return;
      }
      
      if (!entryFile || !onUpdateFile) return;

      setIsFixing(true);
      addLog('system', 'AI Agent analyzing error trace...');

      try {
          const instruction = `Fix this error: ${errorLog.message}. The code is currently failing. Return ONLY the full fixed code.`;
          const fixedCode = await applyModification(entryFile.content, entryFile.language, instruction);
          
          onUpdateFile(entryFile.name, fixedCode);
          
          addLog('system', '✅ Fix applied. Reloading environment...');
          
          setTimeout(() => {
              if (isWebProject) generateWebPreview();
              else handleUniversalRun();
              setIsFixing(false);
          }, 1000);

      } catch (e) {
          addLog('error', 'AI Fix failed.');
          setIsFixing(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-apple-fade-in" onClick={onClose}></div>
      
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] theme-bg-main rounded-lg shadow-2xl flex flex-col overflow-hidden theme-border border animate-apple-modal-enter">
        
        {/* Header */}
        <div className="h-12 theme-bg-sec theme-border border-b flex items-center justify-between px-4 flex-shrink-0 select-none">
          <div className="flex items-center gap-4">
            <h2 className="theme-text text-sm font-medium flex items-center gap-2">
              {isWebProject ? <ExternalLink className="w-4 h-4 text-[#3794FF]" /> : <Terminal className="w-4 h-4 text-[#3794FF]" />}
              {isWebProject ? 'Localhost:3000' : 'Terminal Output'}
            </h2>
            
            <div className="flex items-center gap-2 theme-bg-main px-3 py-1 rounded text-xs theme-border border">
                <div className={`w-1.5 h-1.5 rounded-full ${isSimulating || isFixing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-gray-400">
                    {deployUrl ? 'Production' : (isSimulating ? 'Building...' : 'Development')}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {logs.some(l => l.type === 'error') && (
                 <button 
                    onClick={handleAutoFix}
                    disabled={isFixing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs hover:bg-red-500/20 transition-all"
                 >
                     {isFixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bug className="w-3 h-3" />}
                     {isFixing ? 'Fixing...' : 'Auto Fix'}
                 </button>
             )}

             {deploySuccess ? (
                 <a href={deployUrl!} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-500 transition-all">
                     <ExternalLink className="w-3 h-3" /> Open App
                 </a>
             ) : (
                <button 
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[#3794FF] text-white rounded text-xs font-medium hover:bg-[#3794FF]/90 transition-all disabled:opacity-50"
                >
                    {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
                    Deploy
                </button>
             )}

             <div className="h-4 w-px bg-gray-600 mx-2"></div>

             <button onClick={isWebProject ? generateWebPreview : handleUniversalRun} className="p-1.5 hover:bg-[#3f3f46] rounded text-gray-400 hover:text-white transition-all">
                <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-all">
                <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative theme-bg-main">
            {isWebProject ? (
                 <iframe
                    ref={iframeRef}
                    title="preview"
                    srcDoc={srcDoc}
                    className="w-full flex-1 border-none bg-white"
                />
            ) : (
                <div className="flex-1 theme-bg-main p-8 flex flex-col items-center justify-center font-mono">
                    <Code2 className={`w-16 h-16 mb-4 ${isSimulating ? 'text-[#3794FF] animate-pulse' : 'text-gray-600'}`} />
                    <h3 className="text-xl font-bold theme-text mb-2">{entryFile?.name}</h3>
                    <p className="text-gray-500 text-xs">Standard Output Stream</p>
                </div>
            )}
            
            {/* Terminal Panel */}
            <div className={`
                theme-bg-main theme-border border-t flex flex-col transition-all duration-300 ease-in-out
                ${isWebProject ? (activeTab === 'console' ? 'h-48' : 'h-8') : 'flex-1'}
            `}>
                <div className="flex items-center h-8 theme-bg-sec theme-border border-b px-4 select-none cursor-pointer" onClick={() => isWebProject && setActiveTab(activeTab === 'console' ? 'preview' : 'console')}>
                    <div className="flex items-center gap-2">
                         <Terminal className="w-3 h-3 text-gray-400" />
                         <span className="text-xs font-bold text-gray-400 uppercase">Console</span>
                         <span className="bg-[#3f3f46] text-white text-[10px] px-1.5 rounded-full">{logs.length}</span>
                    </div>
                    <div className="flex-1"></div>
                    {isWebProject && <Maximize2 className="w-3 h-3 text-gray-500" />}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed theme-bg-main custom-scrollbar" onClick={() => document.getElementById('terminal-input')?.focus()}>
                    {logs.length === 0 && !isWebProject && (
                        <div className="text-gray-600 italic mb-2">Ready.</div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={`flex gap-2 py-0.5 ${
                            log.type === 'error' ? 'text-red-400' : 
                            log.type === 'warn' ? 'text-yellow-400' : 
                            log.type === 'system' ? 'text-[#3794FF]' :
                            'theme-text'
                        }`}>
                            <span className="opacity-30 select-none w-16">[{log.timestamp}]</span>
                            <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                    
                    {/* Interactive Input Line */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800/50">
                        <span className="text-green-500 font-bold">$</span>
                        <input 
                            id="terminal-input"
                            type="text" 
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={handleCommand}
                            autoFocus
                            className="flex-1 bg-transparent outline-none theme-text"
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
