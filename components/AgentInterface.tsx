
import React, { useState } from 'react';
import { AgentTask, AgentStatus, AgentRole, AgentRunData } from '../types';
import { Loader2, CheckCircle, Terminal, ChevronDown, ChevronRight, Circle, Clock, AlertCircle } from 'lucide-react';

interface AgentBlockProps {
  data: AgentRunData;
}

export const AgentBlock: React.FC<AgentBlockProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
  const totalTasks = data.tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  return (
    <div className="border border-[#333] rounded-lg bg-[#202023] overflow-hidden my-2 shadow-sm font-sans">
        {/* Header Summary */}
        <div 
            className="flex items-center justify-between p-3 bg-[#2a2a2d] cursor-pointer select-none border-b border-[#333]"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 flex items-center justify-center rounded-full ${
                    data.status === 'working' ? 'bg-brand-primary/20 text-brand-primary' :
                    data.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    'bg-red-500/20 text-red-500'
                }`}>
                    {data.status === 'working' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                     data.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : 
                     <AlertCircle className="w-3 h-3" />}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gray-200">
                        {data.status === 'working' ? 'Agent Working...' : 
                         data.status === 'completed' ? 'Build Complete' : 'Build Failed'}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                        {completedTasks}/{totalTasks} tasks • {data.activeAgent ? `Current: ${data.activeAgent.toUpperCase()}` : 'Idle'}
                    </p>
                </div>
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </div>

        {/* Progress Bar */}
        {data.status === 'working' && (
             <div className="h-0.5 w-full bg-[#333]">
                 <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
             </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
            <div className="p-0">
                {/* Tasks List */}
                <div className="p-3 space-y-2">
                    {data.tasks.length === 0 && data.status === 'working' && (
                        <div className="text-xs text-gray-500 italic animate-pulse">Generating plan...</div>
                    )}
                    {data.tasks.map((task, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs group">
                            <div className="mt-0.5 flex-shrink-0">
                                {task.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                                 task.status === 'in-progress' ? <Loader2 className="w-3.5 h-3.5 text-brand-primary animate-spin" /> :
                                 task.status === 'failed' ? <AlertCircle className="w-3.5 h-3.5 text-red-500" /> :
                                 <Circle className="w-3.5 h-3.5 text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={`font-mono mr-2 px-1 rounded text-[9px] uppercase ${
                                    task.type === 'create' ? 'bg-green-900/30 text-green-400' : 
                                    task.type === 'update' ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'
                                }`}>
                                    {task.type}
                                </span>
                                <span className={`text-gray-300 ${task.status === 'completed' ? 'opacity-60' : ''}`}>{task.fileName}</span>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{task.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Logs Toggle */}
                <div className="border-t border-[#333]">
                    <button 
                        onClick={() => setShowLogs(!showLogs)}
                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2d] transition-colors"
                    >
                        <span className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Console Output ({data.logs.length})</span>
                        {showLogs ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    
                    {showLogs && (
                        <div className="bg-[#111] p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-gray-400 custom-scrollbar border-t border-[#333]">
                             {data.logs.map((log, i) => (
                                 <div key={i} className="whitespace-pre-wrap mb-1">{log}</div>
                             ))}
                             {data.logs.length === 0 && <span className="opacity-30">No logs yet...</span>}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
