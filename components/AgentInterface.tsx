
import React, { useState, useEffect, useRef } from 'react';
import { AgentTask, CodeFile, AgentStatus } from '../types';
import { generateAgentPlan, generateFileContent } from '../services/geminiService';
import { Bot, Play, Loader2, FileCode, CheckCircle, AlertCircle, ArrowRight, StopCircle } from 'lucide-react';

interface AgentInterfaceProps {
  files: CodeFile[];
  onUpdateFile: (fileName: string, content: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenPreview: () => void;
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
  files,
  onUpdateFile,
  onCreateFile,
  onDeleteFile,
  onOpenPreview
}) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const startAgent = async () => {
    if (!prompt.trim()) return;
    setStatus('planning');
    setLogs([]);
    setTasks([]);
    addLog(`Analyzing request: "${prompt}"...`);

    try {
      const generatedTasks = await generateAgentPlan(prompt, files);
      setTasks(generatedTasks);
      addLog(`Plan generated: ${generatedTasks.length} tasks identified.`);
      setStatus('executing');
      executePlan(generatedTasks);
    } catch (error) {
      addLog(`Error generating plan: ${error}`);
      setStatus('error');
    }
  };

  const executePlan = async (currentTasks: AgentTask[]) => {
    // Create a local copy of files to pass to the AI context as we build
    let currentFilesState = [...files];

    for (let i = 0; i < currentTasks.length; i++) {
      const task = currentTasks[i];
      
      // Update UI to show current task processing
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'in-progress' } : t));
      addLog(`Executing: ${task.type} ${task.fileName}...`);

      try {
        if (task.type === 'delete') {
          onDeleteFile(task.fileName);
          addLog(`Deleted ${task.fileName}`);
          currentFilesState = currentFilesState.filter(f => f.name !== task.fileName);
        } else {
          // Generate content
          const content = await generateFileContent(task, prompt, currentFilesState);
          
          if (task.type === 'create') {
            onCreateFile(task.fileName, content);
            // Update local state for context
            currentFilesState.push({
                id: Math.random().toString(),
                name: task.fileName,
                content: content,
                language: 'plaintext' // Simplified
            } as CodeFile);
          } else {
            onUpdateFile(task.fileName, content);
             // Update local state for context
            currentFilesState = currentFilesState.map(f => f.name === task.fileName ? {...f, content} : f);
          }
          addLog(`Generated content for ${task.fileName}`);
        }

        // Mark completed
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
      } catch (error) {
        console.error(error);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'failed' } : t));
        addLog(`Failed task: ${task.fileName}`);
        setStatus('error');
        return; 
      }
    }

    setStatus('completed');
    addLog('All tasks completed successfully.');
    addLog('Ready to deploy/preview.');
    onOpenPreview();
  };

  return (
    <div className="flex flex-col h-full bg-editor-bg text-editor-fg">
      {/* Header */}
      <div className="p-4 border-b border-editor-border bg-editor-sidebar">
        <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-sm">Autonomous Agent</h2>
        </div>
        <p className="text-xs text-editor-fgSecondary">
          I can build entire applications from scratch. Just tell me what you want.
        </p>
      </div>

      {/* Input Area (only visible when idle or completed) */}
      {(status === 'idle' || status === 'completed' || status === 'error') && (
        <div className="p-4 border-b border-editor-border">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Build a functional calculator with a dark theme..."
            className="w-full h-24 bg-editor-active border border-editor-border rounded p-3 text-sm focus:border-purple-500 focus:outline-none resize-none mb-3"
          />
          <div className="flex gap-2">
            <button
                onClick={startAgent}
                disabled={!prompt.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
                <Play className="w-4 h-4" />
                Start Agent
            </button>
            {status === 'completed' && (
                 <button
                 onClick={onOpenPreview}
                 className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
             >
                 <Play className="w-4 h-4" />
                 Run Preview
             </button>
            )}
          </div>
        </div>
      )}

      {/* Execution View */}
      {(status === 'planning' || status === 'executing') && (
        <div className="p-4 border-b border-editor-border bg-purple-900/10">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-purple-300 animate-pulse">
                    {status === 'planning' ? 'Designing Architecture...' : 'Building Application...'}
                </span>
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
            <div className="h-1 bg-editor-active rounded-full overflow-hidden">
                <div 
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ 
                        width: tasks.length > 0 
                            ? `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` 
                            : '0%' 
                    }}
                />
            </div>
        </div>
      )}

      {/* Task List & Logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Task List */}
        {tasks.length > 0 && (
            <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-editor-fgSecondary tracking-wider">Plan</h3>
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded bg-editor-active/50 text-xs border border-transparent hover:border-editor-border">
                        {task.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : task.status === 'in-progress' ? (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
                        ) : task.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-editor-fgSecondary flex-shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`uppercase font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                    task.type === 'create' ? 'bg-green-900/30 text-green-400' :
                                    task.type === 'update' ? 'bg-blue-900/30 text-blue-400' :
                                    'bg-red-900/30 text-red-400'
                                }`}>
                                    {task.type}
                                </span>
                                <span className="font-mono text-editor-fg truncate">{task.fileName}</span>
                            </div>
                            <p className="text-editor-fgSecondary truncate mt-0.5">{task.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Terminal Logs */}
        {logs.length > 0 && (
            <div className="mt-4">
                 <h3 className="text-xs font-semibold uppercase text-editor-fgSecondary tracking-wider mb-2">Agent Logs</h3>
                 <div className="font-mono text-[10px] text-gray-400 bg-black/30 p-2 rounded space-y-1">
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};
