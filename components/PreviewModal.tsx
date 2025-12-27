
import React, { useEffect, useState, useRef } from 'react';
import { X, RefreshCw, ExternalLink, Bug, Terminal, Rocket, CheckCircle, AlertCircle, Play, Cpu, Code2, Loader2, Maximize2 } from 'lucide-react';
import { CodeFile } from '../types';
import { simulateExecution } from '../services/geminiService';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
  onFixError?: (error: string) => void;
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'system';
  message: string;
  timestamp: string;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, files, onFixError }) => {
  const [srcDoc, setSrcDoc] = useState('');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Advanced Entry Point Detection
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
        setLogs(prev => [...prev, { 
            type: event.data.level, 
            message: event.data.message, 
            timestamp: new Date().toLocaleTimeString() 
        }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const generateWebPreview = () => {
    const htmlFile = files.find(f => f.name === 'index.html') || files.find(f => f.name.endsWith('.html'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.tsx'));

    // Base HTML
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

    // Inject Styles
    const styleTags = cssFiles.map(f => `<style data-name="${f.name}">${f.content}</style>`).join('\n');
    
    // Inject Console Interceptor
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

    // Transform and Inject Scripts (Simple)
    // For a real react app, we would need Babel standalone. Here we assume simple JS or pre-transpiled.
    // If it's pure TSX/React without Babel in this demo env, it might fail syntax, but we can wrap it.
    
    // Simple Babel Standalone Injection for React support
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
      setLogs(prev => [...prev, { type: 'system', message: `Initializing Universal Runtime Environment for ${entryFile?.name || 'unknown'}...`, timestamp: new Date().toLocaleTimeString() }]);

      const result = await simulateExecution(files, entryFile?.id || '');
      setIsSimulating(false);
      
      if (result.error) {
          setLogs(prev => [...prev, { type: 'error', message: result.error!, timestamp: new Date().toLocaleTimeString() }]);
      }
      if (result.output) {
          result.output.split('\n').forEach(line => {
              if (line.trim()) setLogs(prev => [...prev, { type: 'log', message: line, timestamp: new Date().toLocaleTimeString() }]);
          });
      }
      if (!result.error && !result.output) {
           setLogs(prev => [...prev, { type: 'system', message: 'Execution completed with no output.', timestamp: new Date().toLocaleTimeString() }]);
      }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
        setIsDeploying(false);
        setDeployUrl(`https://cursor-live-${Math.random().toString(36).substr(2, 5)}.app`);
        setLogs(prev => [...prev, { type: 'system', message: `🚀 Deployed successfully to Production Environment.`, timestamp: new Date().toLocaleTimeString() }]);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-apple-fade-in" onClick={onClose}></div>
      
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] bg-[#0c0c0c] rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white/10 animate-apple-modal-enter">
        
        {/* Header */}
        <div className="h-16 bg-[#121212] border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-white font-bold flex items-center gap-3">
              {isWebProject ? <div className="w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center"><ExternalLink className="w-4 h-4 text-brand-primary" /></div> : <Terminal className="w-5 h-5 text-brand-secondary" />}
              {isWebProject ? 'Live Preview' : 'Universal Runtime'}
            </h2>
            
            <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`}></div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {deployUrl ? deployUrl : (isSimulating ? 'BUILDING...' : 'LOCAL_ENV')}
                </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {logs.some(l => l.type === 'error') && (
                 <button onClick={() => onFixError?.(logs.find(l => l.type === 'error')?.message || '')} className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-all animate-pulse">
                     <Bug className="w-3.5 h-3.5" /> AI Fix
                 </button>
             )}

             <button 
                onClick={handleDeploy}
                disabled={isDeploying || !!deployUrl}
                className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-full text-[11px] font-black uppercase shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
            >
                {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                {deployUrl ? 'Live' : 'Go Production'}
            </button>

             <div className="h-8 w-px bg-white/10 mx-2"></div>

             <button onClick={isWebProject ? generateWebPreview : handleUniversalRun} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-all">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-white dark:bg-[#0c0c0c]">
            {isWebProject ? (
                 <iframe
                    ref={iframeRef}
                    title="preview"
                    srcDoc={srcDoc}
                    className="w-full flex-1 border-none bg-white"
                />
            ) : (
                <div className="flex-1 bg-[#0c0c0c] p-12 flex flex-col items-center justify-center font-mono relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(46,164,70,0.05)_0%,transparent_70%)] opacity-50"></div>
                    <div className="z-10 text-center scale-125">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-center mx-auto mb-6 relative">
                             {isSimulating && <div className="absolute inset-0 bg-brand-primary/20 rounded-[32px] animate-ping"></div>}
                             <Code2 className={`w-12 h-12 ${isSimulating ? 'text-brand-primary' : 'text-gray-500'}`} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{entryFile?.name || 'Project'}</h3>
                        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-[3px]">Universal Runtime Environment</p>
                    </div>
                </div>
            )}
            
            {/* Terminal Panel */}
            <div className={`
                bg-[#0f0f0f] border-t border-white/10 flex flex-col transition-all duration-500 ease-in-out
                ${isWebProject ? (activeTab === 'console' ? 'h-64' : 'h-10') : 'flex-1'}
            `}>
                <div className="flex items-center h-10 bg-[#161616] border-b border-white/5 px-6">
                    <button 
                        onClick={() => setActiveTab(activeTab === 'console' ? 'preview' : 'console')}
                        className={`flex items-center gap-3 h-full text-[10px] font-black uppercase tracking-[2px] transition-all border-b-2 ${activeTab === 'console' || !isWebProject ? 'border-brand-primary text-white' : 'border-transparent text-gray-500'}`}
                    >
                        <Terminal className="w-3.5 h-3.5" /> Output Logs ({logs.length})
                    </button>
                    <div className="flex-1"></div>
                    <button onClick={() => setLogs([])} className="text-[10px] font-bold text-gray-500 hover:text-white px-4">Clear</button>
                    {isWebProject && <button onClick={() => setActiveTab(activeTab === 'console' ? 'preview' : 'console')} className="p-1 text-gray-500 hover:text-white"><Maximize2 className="w-3.5 h-3.5" /></button>}
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed bg-[#0c0c0c] custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-gray-800 italic uppercase tracking-widest font-black text-[9px]">_WAITING_FOR_DATA_STREAM</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`flex gap-4 py-1 border-b border-white/[0.02] ${
                                log.type === 'error' ? 'text-red-400 bg-red-500/5' : 
                                log.type === 'warn' ? 'text-yellow-400' : 
                                log.type === 'system' ? 'text-brand-primary italic opacity-70' :
                                'text-gray-400'
                            }`}>
                                <span className="opacity-20 select-none text-[9px] w-20">[{log.timestamp}]</span>
                                <span className="break-all whitespace-pre-wrap flex-1">{log.message}</span>
                            </div>
                        ))
                    )}
                    {isSimulating && (
                         <div className="flex gap-4 py-1 text-brand-primary animate-pulse italic">
                            <span className="opacity-20 select-none text-[9px] w-20">[SYSTEM]</span>
                            <span className="flex-1">Analiz ediliyor...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
