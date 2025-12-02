import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Loader2, Sparkles, Terminal, MessageSquare, Zap } from 'lucide-react';
import { ChatMessage, CodeFile } from '../types';
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
  onOpenPreview
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'agent'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello! I'm Cursor AI. I can build, fix, and deploy your code. What are we building today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && !chatSessionRef.current) {
      chatSessionRef.current = createChatSession(
        `You are Cursor AI, a premium autonomous coding agent. 
         Your goal is to help users write code, fix bugs, and understand complex logic.
         Be concise, accurate, and provide code blocks when relevant. 
         Use markdown for formatting. Be elegant in your responses.`
      );
    }
  }, [isVisible]);

  useEffect(() => {
    if (triggerPrompt && isVisible && !isTyping) {
      setActiveTab('chat');
      handleSend(triggerPrompt);
      if (onPromptHandled) onPromptHandled();
    }
  }, [triggerPrompt, isVisible]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
  }, [messages, activeTab]);

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || !chatSessionRef.current) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!manualInput) setInput('');
    setIsTyping(true);

    try {
      let fullMessage = textToSend;
      if (activeFile && !manualInput) {
        fullMessage = `[Current File Context: ${activeFile.name} (${activeFile.language})]\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n\nUser Query: ${textToSend}`;
      }

      const resultStream = await chatSessionRef.current.sendMessageStream({ message: fullMessage });
      
      let fullResponseText = '';
      const modelMessageId = Date.now();
      setMessages(prev => [...prev, {
        role: 'model',
        text: '',
        timestamp: modelMessageId
      }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
            fullResponseText += text;
            setMessages(prev => prev.map(msg => 
                msg.timestamp === modelMessageId 
                ? { ...msg, text: fullResponseText } 
                : msg
            ));
        }
      }

    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I encountered a connection error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Responsive Classes:
  // Desktop: Fixed width, right aligned, floating.
  // Mobile: Fixed inset-0 (fullscreen), no border radius.
  return (
    <div 
        className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-2xl backdrop-blur-3xl border border-glass-border
            md:w-[480px] md:right-4 md:top-4 md:bottom-4 md:rounded-2xl md:glass-panel
            inset-0 rounded-none bg-white/95 dark:bg-[#121212]/95 md:bg-glass-bg
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}
        `}
    >
      {/* Header */}
      <div className="p-4 border-b border-glass-border bg-white/40 dark:bg-black/20 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-premium-gradient flex items-center justify-center shadow-lg shadow-brand-primary/20 animate-pulse">
                     <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-glass-text text-sm tracking-tight">AI Assistant</h3>
                    <p className="text-[10px] text-glass-text-sec font-medium">Powered by Gemini 2.5</p>
                </div>
            </div>
            <button onClick={onClose} className="text-glass-text-sec hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>
        
        {/* Tabs */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'chat' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-brand-primary' 
                    : 'text-glass-text-sec hover:text-glass-text'
                }`}
            >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
            </button>
            <button 
                onClick={() => setActiveTab('agent')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'agent' 
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-brand-secondary' 
                    : 'text-glass-text-sec hover:text-glass-text'
                }`}
            >
                <Zap className="w-3.5 h-3.5" />
                Auto Agent
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'chat' ? (
            <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 md:pb-32 scroll-smooth">
                    {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {msg.role === 'model' && (
                             <div className="w-6 h-6 rounded-full bg-premium-gradient flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                <Sparkles className="w-3 h-3 text-white" />
                             </div>
                        )}
                        
                        <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-sm ${
                            msg.role === 'user'
                            ? 'bg-brand-primary/90 text-white rounded-br-none shadow-brand-primary/20'
                            : 'bg-white/80 dark:bg-zinc-800/80 text-glass-text rounded-tl-none border border-glass-border'
                        }`}
                        >
                        <ReactMarkdown 
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    return !inline ? (
                                        <div className="bg-black/80 text-white p-2 rounded-lg my-2 overflow-x-auto text-xs font-mono border border-white/10">
                                            {children}
                                        </div>
                                    ) : (
                                        <code className="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-xs" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                        </div>
                    </div>
                    ))}
                    {isTyping && (
                    <div className="flex items-center gap-2 text-glass-text-sec text-xs pl-10">
                        <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />
                        <span>Thinking...</span>
                    </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-t border-glass-border">
                    <div className="relative group">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={activeFile ? `Context: ${activeFile.name}...` : "Type a message..."}
                        // FIX: Explicit text colors and backgrounds for better readability in light mode
                        className="w-full bg-black/5 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-xl p-3 pr-12 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none resize-none h-14 shadow-inner transition-all focus:h-24 focus:bg-white dark:focus:bg-black/60 focus:ring-1 focus:ring-brand-primary"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 bottom-2 p-2 bg-premium-gradient rounded-lg text-white shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        <Terminal className="w-4 h-4" />
                    </button>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 overflow-hidden h-full">
                 <AgentInterface 
                    files={files}
                    onCreateFile={onCreateFile}
                    onUpdateFile={onUpdateFile}
                    onDeleteFile={onDeleteFile}
                    onOpenPreview={onOpenPreview}
                />
            </div>
        )}
      </div>
    </div>
  );
};