
import React from 'react';
import { X, Bot, Activity, CheckCircle, Clock, Zap, Users } from 'lucide-react';
import { AgentRole, AgentStatus } from '../types';

interface AgentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgent: AgentRole | null;
  agentStatus: AgentStatus;
}

const AGENTS: { role: AgentRole; name: string; desc: string }[] = [
    { role: 'planner', name: 'Architect', desc: 'Plans system architecture and file structure.' },
    { role: 'designer', name: 'UI/UX Lead', desc: 'Handles styling, CSS, and component design.' },
    { role: 'frontend', name: 'Frontend Dev', desc: 'Implements client-side logic and React components.' },
    { role: 'backend', name: 'Backend Dev', desc: 'Handles API, database, and server logic.' },
    { role: 'lead', name: 'Tech Lead', desc: 'Reviews code, refactors, and merges changes.' }
];

export const AgentManagerModal: React.FC<AgentManagerModalProps> = ({ isOpen, onClose, activeAgent, agentStatus }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl bg-[#09090b] rounded-xl border border-[#333] shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-[#333] flex justify-between items-center bg-gradient-to-r from-[#09090b] to-[#111]">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Bot className="w-6 h-6 text-brand-primary" />
                        Agent Management System
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Orchestrate your autonomous development team.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                
                {/* Status Panel */}
                <div className="space-y-6">
                    <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333]">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> System Status
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${agentStatus === 'working' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="text-xl font-mono text-white">
                                {agentStatus === 'working' ? 'OPERATIONAL' : 'STANDBY'}
                            </span>
                        </div>
                        {agentStatus === 'working' && (
                            <div className="mt-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded text-brand-primary text-xs">
                                Currently processing build queue.
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333]">
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Performance Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#111] rounded border border-[#333]">
                                <div className="text-xs text-gray-500 mb-1">Model</div>
                                <div className="text-sm font-bold text-white">Claude 4.5 Opus</div>
                            </div>
                            <div className="p-3 bg-[#111] rounded border border-[#333]">
                                <div className="text-xs text-gray-500 mb-1">Latency</div>
                                <div className="text-sm font-bold text-green-400">~240ms</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agents Grid */}
                <div>
                     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Active Agents
                    </h3>
                    <div className="space-y-3">
                        {AGENTS.map(agent => (
                            <div 
                                key={agent.role}
                                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                                    activeAgent === agent.role 
                                    ? 'bg-brand-primary/10 border-brand-primary' 
                                    : 'bg-[#1e1e1e] border-[#333] opacity-60'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    activeAgent === agent.role ? 'bg-brand-primary text-white' : 'bg-[#333] text-gray-500'
                                }`}>
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`font-bold ${activeAgent === agent.role ? 'text-white' : 'text-gray-400'}`}>
                                            {agent.name}
                                        </h4>
                                        {activeAgent === agent.role && (
                                            <span className="text-[10px] bg-brand-primary px-2 py-0.5 rounded text-white font-bold animate-pulse">
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{agent.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
