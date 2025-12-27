
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

const generateId = () => Math.random().toString(36).substr(2, 9);

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
  onFocusFile,
}) => {
  const [mode, setMode] = useState<AssistantMode>('agent');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Hidden Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Unified Chat Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([
      { id: 'default', title: 'New Conversation', updatedAt: Date.now(), messages: [] }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default');

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Spec Configuration
  const [config, setConfig] = useState<ProjectConfig>({
      type: 'web',
      platform: 'browser',
      languages: ['typescript'],
      frameworks: ['react'],
      tools: [],
      isAiRecommended: true,
      architecture: 'mvc',
      buildTarget: 'debug'
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(
        `You are Cursor AI. Be concise, technical, and helpful. Focus on code generation.`
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (triggerPrompt && isVisible && !isTyping) {
      handleSend(triggerPrompt);
      if (onPromptHandled) onPromptHandled();
    }
  }, [triggerPrompt, isVisible]);

  const updateSessionMessages = (sessionId: string, newMessages: ChatMessage[]) => {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: newMessages, updatedAt: Date.now() } : s));
  };

  const createNewSession = () => {
      const newId = generateId();
      setSessions(prev => [{ id: newId, title: 'New Conversation', updatedAt: Date.now(), messages: [] }, ...prev]);
      setActiveSessionId(newId);
      setShowHistory(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id && sessions.length > 1) {
          setActiveSessionId(sessions.find(s => s.id !== id)?.id || 'default');
      }
  };

  // --- FILE & IMAGE HANDLING ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const text = await file.text();
          setAttachments(prev => [...prev, {
              id: generateId(),
              name: file.name,
              content: text,
              type: 'file'
          }]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              setAttachments(prev => [...prev, {
                  id: generateId(),
                  name: file.name,
                  content: reader.result as string, // Base64
                  type: 'image'
              }]);
          };
          reader.readAsDataURL(file);
      }
      if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() && attachments.length === 0) return;

    let attachmentContext = '';
    if (attachments.length > 0) {
        attachmentContext = '\n\n' + attachments.map(a => 
            a.type === 'file' 
            ? `--- ATTACHED FILE: ${a.name} ---\n${a.content}\n--- END FILE ---`
            : `[Image Attachment: ${a.name} - (Base64 data hidden for brevity)]`
        ).join('\n');
    }

    const userMsg: ChatMessage = { 
        id: generateId(), 
        role: 'user', 
        text: textToSend + (attachments.length > 0 ? `\n(Attached ${attachments.length} files)` : ''), 
        timestamp: Date.now(), 
        type: 'text' 
    };
    
    const updatedMessages = [...messages, userMsg];
    updateSessionMessages(activeSessionId, updatedMessages);
    
    if (!manualInput) {
        setInput('');
        setAttachments([]);
    }

    if (mode === 'agent' || mode === 'max') {
        setIsTyping(true);
        await runAgentBuild(textToSend + attachmentContext, updatedMessages);
        setIsTyping(false);
        return;
    }

    setIsTyping(true);
    try {
      let fullMessage = textToSend + attachmentContext;
      if (activeFile && !manualInput) {
        fullMessage = `[Active Editor File: ${activeFile.name}]\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n\n${fullMessage}`;
      }

      const resultStream = await chatSessionRef.current!.sendMessageStream({ message: fullMessage });
      let fullResponseText = '';
      const modelMsgId = generateId();
      
      updateSessionMessages(activeSessionId, [...updatedMessages, { id: modelMsgId, role: 'model', text: '', timestamp: Date.now(), type: 'text' }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            fullResponseText += c.text;
            setSessions(prev => prev.map(s => s.id === activeSessionId ? {
                ...s, 
                messages: s.messages.map(m => m.id === modelMsgId ? { ...m, text: fullResponseText } : m)
            } : s));
        }
      }
    } catch (error) {
       console.error(error);
       setSessions(prev => prev.map(s => s.id === activeSessionId ? {
           ...s,
           messages: [...s.messages, { id: generateId(), role: 'model', text: 'Error: Could not connect to AI service.', timestamp: Date.now() }]
       } : s));
    } finally {
      setIsTyping(false);
    }
  };

  const runAgentBuild = async (goal: string, currentMsgs: ChatMessage[]) => {
      const runId = generateId();
      const initialRunData: AgentRunData = {
          status: 'working',
          tasks: [],
          logs: [`STARTED: ${goal.substring(0, 50)}...`, `CONFIG: ${config.type} / ${config.languages.join(',')}`],
          activeAgent: 'planner'
      };

      const agentMsg: ChatMessage = { 
          id: runId, 
          role: 'model', 
          text: '', 
          timestamp: Date.now(), 
          type: 'agent_run',
          runData: initialRunData
      };
      
      updateSessionMessages(activeSessionId, [...currentMsgs, agentMsg]);

      const updateRun = (partialData: Partial<AgentRunData>) => {
          setSessions(prev => prev.map(s => {
              if (s.id !== activeSessionId) return s;
              return {
                  ...s,
                  messages: s.messages.map(m => {
                      if (m.id !== runId) return m;
                      return { ...m, runData: { ...m.runData!, ...partialData } };
                  })
              };
          }));
      };

      const appendLog = (msg: string) => {
          setSessions(prev => prev.map(s => {
              if(s.id !== activeSessionId) return s;
              return {
                  ...s,
                  messages: s.messages.map(m => {
                      if(m.id !== runId) return m;
                      return { ...m, runData: { ...m.runData!, logs: [...m.runData!.logs, `> ${msg}`] } };
                  })
              };
          }));
      };

      try {
          appendLog('Generating Team Plan...');
          const tasks = await generateTeamPlan(goal, files, config);
          updateRun({ tasks });
          appendLog(`Plan created: ${tasks.length} tasks.`);

          let currentFilesState = [...files];

          for (const task of tasks) {
              updateRun({ activeAgent: task.assignedTo });
              updateRun({ tasks: tasks.map(t => t.id === task.id ? { ...t, status: 'in-progress' } : t) });
              appendLog(`[${task.assignedTo.toUpperCase()}] Working on ${task.fileName}...`);
              onFocusFile(task.fileName);

              const content = await generateAgentFileContent(task, goal, currentFilesState, config);
              
              if (task.type === 'create') {
                  onCreateFile(task.fileName, content);
                  currentFilesState.push({ id: generateId(), name: task.fileName, content, language: 'typescript', path: task.fileName } as CodeFile);
              } else {
                  onUpdateFile(task.fileName, content);
                  currentFilesState = currentFilesState.map(f => f.name === task.fileName ? { ...f, content } : f);
              }

              tasks.find(t => t.id === task.id)!.status = 'completed'; 
              updateRun({ tasks: [...tasks] });
              appendLog(`Completed ${task.fileName}`);
          }

          updateRun({ status: 'completed', activeAgent: null });
          appendLog('Build Sequence Finished.');
          onOpenPreview();

      } catch (e) {
          updateRun({ status: 'error' });
          appendLog(`ERROR: ${e}`);
      }
  };

  const ModeOption = ({ id, label, icon: Icon }: any) => (
      <button 
        onClick={() => { setMode(id); setShowModeDropdown(false); }}
        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#2a2a2a] ${mode === id ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-400'}`}
      >
          <Icon className="w-3.5 h-3.5" /> 
          <span className="font-medium">{label}</span>
      </button>
  );

  return (
    <div className="flex h-full bg-[#18181b] text-gray-300 relative border-l border-brand-primary/10 overflow-hidden font-sans">
      
      {/* HISTORY SIDEBAR */}
      <div className={`flex flex-col border-r border-[#2b2b2b] bg-[#09090b] transition-all duration-300 ${showHistory ? 'w-64' : 'w-0 overflow-hidden'}`}>
          <div className="p-3 border-b border-[#2b2b2b] flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-500">History</span>
              <button onClick={createNewSession} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {sessions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setActiveSessionId(s.id); }}
                    className={`p-3 border-b border-[#2b2b2b] cursor-pointer hover:bg-[#1e1e1e] group ${activeSessionId === s.id ? 'bg-[#1e1e1e] border-l-2 border-l-brand-primary' : ''}`}
                  >
                      <div className="flex justify-between items-start">
                          <h4 className="text-xs text-gray-300 line-clamp-1 font-medium">{s.messages[0]?.text || s.title}</h4>
                          <button onClick={(e) => deleteSession(e, s.id)} className="hidden group-hover:block text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      <span className="text-[10px] text-gray-600">{new Date(s.updatedAt).toLocaleTimeString()}</span>
                  </div>
              ))}
          </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
          
          {/* CURSOR-LIKE MINIMAL HEADER */}
          <div className="h-9 border-b border-[#2b2b2b] flex items-center bg-[#18181b] select-none justify-between px-3">
            <div className="flex items-center gap-2">
                <button onClick={() => setShowHistory(!showHistory)} className={`p-1 rounded-md transition-colors ${showHistory ? 'text-white bg-[#333]' : 'text-gray-500 hover:bg-[#27272a]'}`}>
                    <History className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-300">
                    {activeSession.title}
                </span>
            </div>
            <div className="flex items-center gap-1">
                 <button className="p-1.5 hover:bg-[#27272a] rounded text-gray-500 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-[#27272a] rounded text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#18181b]">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                     <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-brand-primary/20">
                         <Bot className="w-8 h-8 text-white" />
                     </div>
                     <p className="text-sm font-medium text-gray-200">Cursor Agent</p>
                     <p className="text-xs max-w-xs mt-2 text-gray-500">I can plan, build, and fix your application. Configure your stack in Spec, or just start typing.</p>
                </div>
            )}
            
            {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.type === 'agent_run' && msg.runData ? (
                        <div className="w-full max-w-full">
                            <AgentBlock data={msg.runData} />
                        </div>
                    ) : (
                        <div className={`max-w-[95%] text-[13px] leading-relaxed rounded-md p-3 ${
                            msg.role === 'user' 
                            ? 'bg-[#27272a] text-gray-200 border border-[#333]' 
                            : 'bg-transparent text-gray-300 px-0'
                        }`}>
                            <ReactMarkdown 
                                components={{
                                    code({node, className, children, ...props}) {
                                        return <code className={`${className} bg-[#111] px-1 py-0.5 rounded text-xs`} {...props}>{children}</code>
                                    },
                                    pre({node, children, ...props}) {
                                        return <div className="bg-[#111] p-2 rounded-md border border-[#333] my-2 overflow-x-auto"><pre {...props}>{children}</pre></div>
                                    }
                                }}
                            >
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            ))}
            {isTyping && (
                <div className="flex items-center gap-2 text-gray-500 text-xs px-1">
                    <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></span> Thinking...
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* COMPOSER INPUT AREA */}
          <div className="p-4 bg-[#18181b] border-t border-[#2b2b2b] relative">
            
            {/* Active Attachments Pills */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-1">
                    {attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-1.5 bg-[#2a2a2d] border border-[#3f3f46] text-gray-300 px-2 py-1 rounded text-[10px] animate-in slide-in-from-bottom-1 fade-in duration-200">
                            {att.type === 'file' ? <FileCode className="w-3 h-3 text-blue-400" /> : <FileImage className="w-3 h-3 text-purple-400" />}
                            <span className="max-w-[100px] truncate">{att.name}</span>
                            <button onClick={() => removeAttachment(att.id)} className="hover:text-white"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative bg-[#202023] border border-[#333] rounded-xl focus-within:border-brand-primary transition-all shadow-lg group flex flex-col">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault(); 
                            handleSend();
                        }
                    }}
                    placeholder={mode === 'agent' ? "Describe the app you want to build..." : "Ask a question..."}
                    className="w-full bg-transparent p-3 text-xs text-white focus:outline-none min-h-[40px] max-h-[200px] resize-none placeholder:text-gray-500 font-sans"
                />
                
                {/* BOTTOM TOOLBAR */}
                <div className="flex justify-between items-center px-2 pb-2 mt-1">
                        
                        {/* LEFT: MODE SWITCHER & ATTACHMENTS */}
                        <div className="flex items-center gap-2 relative">
                            {/* Mode Dropdown Trigger */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-[#2b2b2e] hover:bg-[#333] border border-[#3f3f46] rounded text-[10px] font-bold uppercase tracking-wide text-brand-primary transition-all"
                                >
                                    {mode === 'agent' ? <><Bot className="w-3 h-3" /> Agent Mode</> : 
                                     mode === 'chat' ? <><Terminal className="w-3 h-3" /> Chat Mode</> : 
                                     <><Zap className="w-3 h-3" /> Max Mode</>}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                
                                {showModeDropdown && (
                                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 flex flex-col py-1 overflow-hidden">
                                        <ModeOption id="agent" label="Agent Mode" icon={Bot} />
                                        <ModeOption id="chat" label="Chat Mode" icon={Terminal} />
                                        <ModeOption id="max" label="Max Mode" icon={Zap} />
                                    </div>
                                )}
                            </div>

                            <div className="h-4 w-[1px] bg-[#3f3f46] mx-1"></div>

                            {/* Spec Button */}
                             <button 
                                onClick={() => setShowSpec(!showSpec)}
                                className={`p-1.5 rounded transition-colors ${showSpec ? 'bg-brand-primary/20 text-brand-primary' : 'hover:bg-[#333] text-gray-500 hover:text-gray-300'}`}
                                title="Project Spec"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <ProjectSpecPopover 
                                isOpen={showSpec} 
                                onClose={() => setShowSpec(false)}
                                config={config}
                                setConfig={setConfig}
                            />

                            {/* Attachments */}
                            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 transition-colors" title="Attach File">
                                <Paperclip className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => imageInputRef.current?.click()} className="p-1.5 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300 transition-colors" title="Attach Image">
                                <ImageIcon className="w-3.5 h-3.5" />
                            </button>

                            {/* Hidden Inputs */}
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>

                        {/* RIGHT: SUBMIT */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() && attachments.length === 0 || isTyping}
                                className="p-1.5 bg-brand-primary text-white rounded-md disabled:opacity-50 hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                        </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
