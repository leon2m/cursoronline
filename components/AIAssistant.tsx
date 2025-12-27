
import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Loader2, Sparkles, Zap, Lightbulb, Bug, MessageSquare, Terminal } from 'lucide-react';
import { ChatMessage, CodeFile, AIActionType, AgentStatus, AgentRole, AgentTask, ProjectConfig } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { AgentInterface } from './AgentInterface';

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
  // Persistent State Props
  persistentState: {
    prompt: string;
    status: AgentStatus;
    tasks: AgentTask[];
    logs: string[];
    activeAgent: AgentRole | null;
    config?: ProjectConfig; // Fixed type definition
  };
  setPersistentState: React.Dispatch<React.SetStateAction<any>>;
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
  const [activeTab, setActiveTab] = useState<'chat' | 'agent'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Merhaba! Bugün senin için ne inşa edebiliriz? Ekibimiz hazır.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only initialize chat if not already done
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(
        `Sen bir yazılım mimarısın. Her zaman Türkçe yanıt ver. Kodları en yüksek kalitede optimize et.`
      );
    }
  }, []);

  useEffect(() => {
    if (triggerPrompt && isVisible && !isTyping) {
      setActiveTab('chat');
      handleSend(triggerPrompt);
      if (onPromptHandled) onPromptHandled();
    }
  }, [triggerPrompt, isVisible]);

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || !chatSessionRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    if (!manualInput) setInput('');
    setIsTyping(true);

    try {
      let fullMessage = textToSend;
      if (activeFile && !manualInput) {
        fullMessage = `[Dosya: ${activeFile.name}]\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n\n${textToSend}`;
      }

      const resultStream = await chatSessionRef.current.sendMessageStream({ message: fullMessage });
      let fullResponseText = '';
      const modelMessageId = Date.now();
      
      setMessages(prev => [...prev, { role: 'model', text: '', timestamp: modelMessageId }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
            fullResponseText += c.text;
            setMessages(prev => prev.map(msg => 
                msg.timestamp === modelMessageId ? { ...msg, text: fullResponseText } : msg
            ));
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Hata oluştu.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) shadow-2xl backdrop-blur-3xl border-l border-white/5
            w-full md:w-[400px] right-0 top-0 bottom-0 bg-[#0c0c0c]/95
            ${isVisible ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
    >
      {/* AI Header */}
      <div className="p-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-black shadow-xl shadow-brand-primary/20">
                     <Bot className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-[15px] tracking-tight">Cursor AI Team</h3>
                    <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">Team Sync Active</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full smooth-transition">
                <X className="w-5 h-5 opacity-40 text-white" />
            </button>
        </div>
        
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-[12px] font-bold rounded-xl smooth-transition ${
                    activeTab === 'chat' ? 'bg-[#1a1a1a] shadow-sm text-brand-primary border border-white/5' : 'text-gray-500'
                }`}
            >
                Sohbet
            </button>
            <button 
                onClick={() => setActiveTab('agent')}
                className={`flex-1 py-2 text-[12px] font-bold rounded-xl smooth-transition ${
                    activeTab === 'agent' ? 'bg-[#1a1a1a] shadow-sm text-brand-secondary border border-white/5' : 'text-gray-500'
                }`}
            >
                Ekip Modu
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'chat' ? (
            <>
                {/* Quick Actions inside Chat */}
                {activeFile && (
                  <div className="p-4 grid grid-cols-3 gap-2 bg-black/20 border-b border-white/5">
                      <button onClick={() => onAction('explain')} className="flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 hover:border-brand-primary/50 text-[10px] font-bold text-gray-400 hover:text-brand-primary smooth-transition bg-white/5">
                          <Lightbulb className="w-3.5 h-3.5" /> Açıkla
                      </button>
                      <button onClick={() => onAction('fix')} className="flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 hover:border-brand-primary/50 text-[10px] font-bold text-gray-400 hover:text-brand-primary smooth-transition bg-white/5">
                          <Bug className="w-3.5 h-3.5" /> Düzelt
                      </button>
                      <button onClick={() => onAction('refactor')} className="flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 hover:border-brand-secondary/50 text-[10px] font-bold text-gray-400 hover:text-brand-secondary smooth-transition bg-white/5">
                          <Zap className="w-3.5 h-3.5" /> Optimize
                      </button>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 scroll-smooth no-scrollbar">
                    {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[88%] rounded-2xl px-5 py-3.5 text-[13px] leading-relaxed shadow-sm ${
                            msg.role === 'user' ? 'bg-brand-primary text-black font-medium rounded-br-none' : 'bg-[#1a1a1a] text-gray-300 rounded-tl-none border border-white/5'
                        }`}>
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                    ))}
                    {isTyping && <div className="text-[10px] font-bold text-brand-primary animate-pulse ml-2 uppercase tracking-widest">Takım Üyeleri Tartışıyor...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-white/5 bg-[#0c0c0c] absolute bottom-0 left-0 right-0">
                    <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Ekibe bir talimat ver..."
                        className="w-full bg-[#151515] border border-white/10 focus:border-brand-primary/50 rounded-2xl p-4 pr-14 text-[13px] text-white focus:outline-none h-14 resize-none smooth-transition placeholder:text-gray-600"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-3 top-3 p-1.5 bg-brand-primary text-black rounded-xl disabled:opacity-30 smooth-transition hover:scale-105"
                    >
                        <Terminal className="w-4 h-4" />
                    </button>
                    </div>
                </div>
            </>
        ) : (
            <AgentInterface 
              files={files} 
              onUpdateFile={onUpdateFile} 
              onCreateFile={onCreateFile} 
              onDeleteFile={onDeleteFile} 
              onOpenPreview={onOpenPreview} 
              onFocusFile={onFocusFile}
              persistentState={persistentState}
              setPersistentState={setPersistentState}
            />
        )}
      </div>
    </div>
  );
};
