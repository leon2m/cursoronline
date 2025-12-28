
import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Loader2, Sparkles, Zap, Terminal, ArrowUp, ChevronDown, Paperclip, Image as ImageIcon, Monitor, Maximize2, History, MessageSquare, Plus, SlidersHorizontal, Trash2, FileCode, FileImage, MoreHorizontal } from 'lucide-react';
import { ChatMessage, CodeFile, AIActionType, AgentStatus, AgentRole, AgentTask, ProjectConfig, ChatSession, AgentRunData } from '../types';
import { createChatSession, generateTeamPlan, generateAgentFileContent } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { AgentBlock } from './AgentInterface';
import { ProjectSpecPopover } from './ProjectSpecPopover';

interface AIAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  activeFile: CodeFile | undefined;
  files: CodeFile[];
  triggerPrompt?: string; 
  onPromptHandled?: () => void;
  onUpdateFile: (fileName: string, content: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  onDeleteFile: (fileName: string) => void;
  onOpenPreview: () => void;
  onAction: (action: AIActionType) => void;
  onFocusFile: (fileName: string) => void;
  persistentState: any; 
  setPersistentState: any;
}

type AssistantMode = 'agent' | 'chat' | 'max';

interface Attachment {
    id: string;
    name: string;
    content: string;
    type: 'file' | 'image';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  isVisible,
  onClose,
  activeFile,
  files,
  triggerPrompt,
  onPromptHandled,
  onUpdateFile,
  onCreateFile,
  onDeleteFile,
  onOpenPreview,
  onAction,
  onFocusFile,
  persistentState,
  setPersistentState
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [showHistory, setShowHistory] = useState(false);
  const [showProjectSpec, setShowProjectSpec] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const initChat = async () => {
      const chat = await createChatSession(
        "You are Cursor AI. You are an expert Full Stack Developer. Be concise, accurate, and helpful.",
        persistentState.config ? JSON.stringify(persistentState.config) : undefined
      );
      setChatSession(chat);
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: 'How can I help you build today?',
        timestamp: Date.now()
      }]);
    };
    initChat();
  }, []);

  // Handle Trigger Prompts
  useEffect(() => {
    if (triggerPrompt && onPromptHandled) {
      handleSend(triggerPrompt);
      onPromptHandled();
    }
  }, [triggerPrompt]);

  // Restore State
  useEffect(() => {
      if (persistentState.logs.length > 0 || persistentState.status !== 'idle') {
           // Restore logic if needed
      }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, persistentState.logs]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() && attachments.length === 0) return;
    if (!chatSession) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
        // --- AGENT MODE ---
        if (mode === 'agent' || text.toLowerCase().includes('create a') || text.toLowerCase().includes('build')) {
            const runId = Date.now().toString();
            
            // 1. Plan
            setPersistentState((prev: any) => ({ ...prev, status: 'working', activeAgent: 'planner', prompt: text }));
            
            const agentMsg: ChatMessage = {
                id: runId,
                role: 'model',
                text: 'Initializing Autonomous Agent Team...',
                timestamp: Date.now(),
                type: 'agent_run',
                runData: { ...persistentState, status: 'working' }
            };
            setMessages(prev => [...prev, agentMsg]);

            const tasks = await generateTeamPlan(text, files, persistentState.config);
            setPersistentState((prev: any) => ({ ...prev, tasks }));
            
            // Update UI with Plan
            setMessages(prev => prev.map(m => m.id === runId ? { ...m, runData: { ...m.runData!, tasks } } : m));

            // 2. Execute Tasks
            for (const task of tasks) {
                setPersistentState((prev: any) => ({ 
                    ...prev, 
                    activeAgent: task.assignedTo,
                    tasks: prev.tasks.map((t: AgentTask) => t.id === task.id ? { ...t, status: 'in-progress' } : t)
                }));
                
                // Update UI Status
                setMessages(prev => prev.map(m => m.id === runId ? { ...m, runData: { ...m.runData!, activeAgent: task.assignedTo } } : m));

                const content = await generateAgentFileContent(task, text, files, persistentState.config);
                
                if (task.type === 'create') onCreateFile(task.fileName, content);
                else onUpdateFile(task.fileName, content);

                setPersistentState((prev: any) => ({ 
                    ...prev,
                    logs: [...prev.logs, `[${task.assignedTo.toUpperCase()}] Completed ${task.fileName}`],
                    tasks: prev.tasks.map((t: AgentTask) => t.id === task.id ? { ...t, status: 'completed' } : t)
                }));
            }

            setPersistentState((prev: any) => ({ ...prev, status: 'completed', activeAgent: null }));
            setMessages(prev => prev.map(m => m.id === runId ? { 
                ...m, 
                text: 'Task completed successfully.',
                runData: { ...m.runData!, status: 'completed', activeAgent: null } 
            } : m));

        } else {
            // --- CHAT MODE ---
            // Include context of active file
            let fullPrompt = text;
            if (activeFile) {
                fullPrompt += `\n\nContext - Active File (${activeFile.name}):\n${activeFile.content}`;
            }

            const result = await chatSession.sendMessage(fullPrompt);
            const responseText = result.response.text();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now()
            }]);
        }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing your request.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              setAttachments(prev => [...prev, {
                  id: Date.now().toString(),
                  name: file.name,
                  content: ev.target?.result as string,
                  type: file.type.startsWith('image') ? 'image' : 'file'
              }]);
          };
          reader.readAsDataURL(file);
      }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full theme-bg-sec theme-text">
      
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 theme-border border-b bg-inherit flex-shrink-0">
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setMode('chat')}
                className={`text-xs font-medium px-2 py-1 rounded transition-colors ${mode === 'chat' ? 'bg-brand-primary text-white' : 'theme-text opacity-60 hover:opacity-100 hover:bg-white/5'}`}
            >
                Chat
            </button>
            <button 
                onClick={() => setMode('agent')}
                className={`text-xs font-medium px-2 py-1 rounded transition-colors flex items-center gap-1 ${mode === 'agent' ? 'bg-purple-600 text-white' : 'theme-text opacity-60 hover:opacity-100 hover:bg-white/5'}`}
            >
                <Sparkles className="w-3 h-3" /> Agent
            </button>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={() => setShowProjectSpec(!showProjectSpec)}
                className={`p-1.5 rounded transition-colors ${showProjectSpec ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Project Settings"
            >
                <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      <ProjectSpecPopover 
        isOpen={showProjectSpec} 
        onClose={() => setShowProjectSpec(false)} 
        config={persistentState.config || { type: 'web', platform: 'browser', languages: ['typescript'], frameworks: ['react'], tools: [], isAiRecommended: true, architecture: 'modular', buildTarget: 'debug' }}
        setConfig={(c) => setPersistentState((prev: any) => ({ ...prev, config: c }))}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-inherit">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#27272a]' : 'bg-brand-primary/10'}`}>
              {msg.role === 'user' ? <UserIcon /> : <Bot className="w-5 h-5 text-brand-primary" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.type === 'agent_run' && msg.runData ? (
                    <AgentBlock data={msg.runData} />
                ) : (
                    <div className={`rounded-lg px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-[#27272a] theme-text' 
                        : 'bg-transparent theme-text'
                    }`}>
                        <ReactMarkdown 
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    return !inline ? (
                                        <div className="my-2 rounded overflow-hidden theme-border border bg-black/20">
                                            <div className="bg-white/5 px-3 py-1 text-[10px] theme-text border-b theme-border opacity-70 flex justify-between">
                                                <span>Code</span>
                                            </div>
                                            <code className="block p-3 text-xs font-mono whitespace-pre-wrap theme-text overflow-x-auto" {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    ) : (
                                        <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-brand-primary" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex items-center gap-1 h-8">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-inherit theme-border border-t z-10">
        {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
                {attachments.map(att => (
                    <div key={att.id} className="relative group">
                        {att.type === 'image' ? (
                            <img src={att.content} alt={att.name} className="h-12 w-12 object-cover rounded border theme-border" />
                        ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-[#27272a] rounded border theme-border">
                                <FileCode className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                        <button 
                            onClick={() => setAttachments(prev => prev.filter(p => p.id !== att.id))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ))}
            </div>
        )}
        <div className="relative theme-bg-main rounded-lg theme-border border focus-within:ring-1 focus-within:ring-brand-primary transition-all">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={mode === 'agent' ? "Describe the feature you want to build..." : "Ask anything (Cmd+K)"}
                className="w-full bg-transparent text-sm theme-text p-3 max-h-32 min-h-[44px] outline-none resize-none custom-scrollbar"
                rows={1}
            />
            <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Attach Code/Image">
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button onClick={onOpenPreview} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Open Preview">
                        <Monitor className="w-4 h-4" />
                    </button>
                </div>
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() && attachments.length === 0}
                    className="bg-brand-primary text-white p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary/90 transition-colors"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="text-[10px] text-gray-500 mt-2 flex justify-between px-1">
            <span>{mode === 'agent' ? 'Agent Mode Active' : 'Chat Mode Active'}</span>
            <span>Claude 4.5 Opus</span>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple />
      </div>
    </div>
  );
};

const UserIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
