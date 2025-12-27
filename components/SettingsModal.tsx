
import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Type, Layout, Globe, Server, ScrollText, Cpu, Shield, Settings, Check, Plus, Trash2, RefreshCw } from 'lucide-react';
import { EditorSettings, Language, ThemeType, MCPServer } from '../types';
import { t } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: EditorSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpUrl, setNewMcpUrl] = useState('');
  const [isAddingMcp, setIsAddingMcp] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof EditorSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const tabs = [
      { id: 'general', label: 'General', icon: Globe },
      { id: 'editor', label: 'Editor', icon: Type },
      { id: 'models', label: 'Models', icon: Cpu },
      { id: 'rules', label: 'Rules for AI', icon: ScrollText },
      { id: 'mcp', label: 'MCP Servers', icon: Server },
  ];

  const themes: { id: ThemeType; name: string; color: string }[] = [
      { id: 'cursor-dark', name: 'Cursor Dark', color: '#09090b' },
      { id: 'cursor-light', name: 'Cursor Light', color: '#ffffff' },
      { id: 'vercel-dark', name: 'Vercel Dark', color: '#000000' },
      { id: 'dracula', name: 'Dracula', color: '#282a36' },
      { id: 'monokai', name: 'Monokai', color: '#272822' },
      { id: 'nord', name: 'Nord', color: '#2e3440' },
  ];

  const addMCPServer = () => {
      if(!newMcpName || !newMcpUrl) return;
      const newServer: MCPServer = {
          id: Math.random().toString(),
          name: newMcpName,
          url: newMcpUrl,
          status: 'connected',
          type: 'websocket'
      };
      onUpdateSettings({ ...settings, mcpServers: [...settings.mcpServers, newServer] });
      setNewMcpName('');
      setNewMcpUrl('');
      setIsAddingMcp(false);
  };

  const removeMCPServer = (id: string) => {
      onUpdateSettings({ ...settings, mcpServers: settings.mcpServers.filter(s => s.id !== id) });
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'editor':
              return (
                  <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Font & Layout</h3>
                        <div className="flex items-center justify-between p-3 theme-bg-sec rounded theme-border border">
                            <span className="text-sm theme-text">Font Size</span>
                            <input 
                                type="number" 
                                value={settings.fontSize}
                                onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                                className="theme-bg-main theme-text text-sm px-2 py-1 rounded w-16 text-center border theme-border focus:border-brand-primary outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 theme-bg-sec rounded theme-border border">
                            <span className="text-sm theme-text">Word Wrap</span>
                            <button 
                                onClick={() => handleChange('wordWrap', !settings.wordWrap)}
                                className={`w-9 h-5 rounded-full relative transition-colors ${settings.wordWrap ? 'bg-brand-primary' : 'bg-gray-600'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.wordWrap ? 'left-5' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 theme-bg-sec rounded theme-border border">
                            <span className="text-sm theme-text">Minimap</span>
                            <button 
                                onClick={() => handleChange('minimap', !settings.minimap)}
                                className={`w-9 h-5 rounded-full relative transition-colors ${settings.minimap ? 'bg-brand-primary' : 'bg-gray-600'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${settings.minimap ? 'left-5' : 'left-1'}`}></div>
                            </button>
                        </div>
                      </div>
                  </div>
              );
          case 'rules':
              return (
                  <div className="space-y-4">
                      <div className="theme-bg-sec theme-border border rounded p-4">
                          <h3 className="text-sm font-bold theme-text mb-2">Rules for AI</h3>
                          <p className="text-xs text-gray-500 mb-4">
                              Instructions added here will be included in the system prompt for every AI interaction. This helps condition the model to your specific coding style.
                          </p>
                          <textarea 
                            className="w-full h-64 theme-bg-main theme-border border rounded p-3 text-xs theme-text focus:border-brand-primary outline-none resize-none font-mono"
                            placeholder="e.g. Always use TypeScript, prefer functional components, use Tailwind CSS for styling..."
                            value={settings.rules || ''}
                            onChange={(e) => handleChange('rules', e.target.value)}
                          ></textarea>
                      </div>
                  </div>
              );
          case 'mcp':
              return (
                   <div className="space-y-6">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-bold theme-text">MCP Servers</h3>
                          <button 
                            onClick={() => setIsAddingMcp(true)}
                            className="text-xs bg-brand-primary text-white px-2 py-1 rounded hover:bg-brand-primary/90 flex items-center gap-1"
                          >
                              <Plus className="w-3 h-3" /> Add New
                          </button>
                      </div>

                      {isAddingMcp && (
                          <div className="p-4 theme-bg-sec rounded border theme-border animate-in fade-in slide-in-from-top-2">
                              <h4 className="text-xs font-bold theme-text mb-2">Add New Server</h4>
                              <div className="space-y-3">
                                  <input 
                                    type="text" 
                                    placeholder="Server Name (e.g., Local Dev)" 
                                    value={newMcpName}
                                    onChange={(e) => setNewMcpName(e.target.value)}
                                    className="w-full theme-bg-main theme-border border rounded px-3 py-2 text-xs theme-text outline-none focus:border-brand-primary"
                                  />
                                   <input 
                                    type="text" 
                                    placeholder="Server URL (e.g., http://localhost:3000/sse)" 
                                    value={newMcpUrl}
                                    onChange={(e) => setNewMcpUrl(e.target.value)}
                                    className="w-full theme-bg-main theme-border border rounded px-3 py-2 text-xs theme-text outline-none focus:border-brand-primary"
                                  />
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => setIsAddingMcp(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-white">Cancel</button>
                                      <button onClick={addMCPServer} className="px-3 py-1.5 text-xs bg-brand-primary text-white rounded">Connect</button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {settings.mcpServers.length === 0 ? (
                        <div className="theme-bg-sec theme-border border rounded p-8 flex flex-col items-center justify-center text-center opacity-60">
                            <Server className="w-8 h-8 text-gray-500 mb-3" />
                            <p className="text-sm theme-text mb-1">No MCP Servers Configured</p>
                            <p className="text-xs text-gray-500">Connect to external tools and data sources via Model Context Protocol.</p>
                        </div>
                      ) : (
                          <div className="space-y-2">
                              {settings.mcpServers.map(server => (
                                  <div key={server.id} className="flex items-center justify-between p-3 theme-bg-sec theme-border border rounded">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${server.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                          <div>
                                              <div className="text-sm font-medium theme-text">{server.name}</div>
                                              <div className="text-[10px] text-gray-500">{server.url}</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded"><RefreshCw className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => removeMCPServer(server.id)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              );
          case 'models':
              return (
                  <div className="space-y-4">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Active Models</h3>
                      {['Claude 4.5 Opus (Max)'].map(m => (
                          <div key={m} className="flex items-center justify-between p-4 theme-bg-sec rounded border border-brand-primary/50 shadow-[0_0_15px_rgba(55,148,255,0.1)]">
                              <div className="flex flex-col">
                                  <span className="text-sm theme-text font-bold">{m}</span>
                                  <span className="text-[10px] text-gray-500">The most capable model for complex tasks.</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded border border-brand-primary/30 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Active
                                  </span>
                              </div>
                          </div>
                      ))}
                      <p className="text-[10px] text-gray-500 mt-2 px-1">
                          * Only Claude 4.5 Opus is available in this premium build. Other models have been disabled for quality assurance.
                      </p>
                  </div>
              );
          default:
              return (
                   <div className="space-y-6">
                       <div className="space-y-4">
                           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Appearance</h3>
                            <div className="theme-bg-sec theme-border border rounded p-4">
                                <span className="text-sm theme-text block mb-3">Color Theme</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {themes.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => handleChange('theme', t.id)}
                                            className={`
                                                flex flex-col items-center gap-2 p-2 rounded border transition-all
                                                ${settings.theme === t.id ? 'border-brand-primary bg-brand-primary/10' : 'theme-border hover:bg-white/5'}
                                            `}
                                        >
                                            <div className="w-full h-12 rounded border shadow-sm" style={{ backgroundColor: t.color, borderColor: settings.theme === t.id ? '#3794FF' : '#333' }}></div>
                                            <span className="text-xs theme-text">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                       </div>
                       <div className="space-y-4">
                           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Language</h3>
                            <div className="flex items-center justify-between p-3 theme-bg-sec rounded theme-border border">
                                <span className="text-sm theme-text">Display Language</span>
                                <select 
                                    value={settings.language}
                                    onChange={(e) => handleChange('language', e.target.value)}
                                    className="theme-bg-main theme-text text-sm px-3 py-1 rounded theme-border border outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="tr">Türkçe</option>
                                </select>
                            </div>
                       </div>
                   </div>
              );
      }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative w-full max-w-4xl theme-bg-main rounded-lg shadow-2xl theme-border border overflow-hidden flex h-[70vh]">
            
            {/* Sidebar */}
            <div className="w-48 theme-bg-sec theme-border border-r flex flex-col pt-4">
                <div className="px-4 mb-4">
                     <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Settings</h2>
                </div>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-2 text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-[#37373d] text-white border-l-2 border-brand-primary' : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col theme-bg-main">
                <div className="h-12 flex items-center justify-between px-6 theme-border border-b theme-bg-main">
                    <h2 className="text-sm font-medium theme-text">{tabs.find(t => t.id === activeTab)?.label}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar theme-bg-main">
                    {renderContent()}
                </div>
            </div>
        </div>
    </div>
  );
};
