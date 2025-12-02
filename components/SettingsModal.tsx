import React from 'react';
import { X, Moon, Sun, Type, Monitor, Check } from 'lucide-react';
import { EditorSettings } from '../types';

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
  if (!isOpen) return null;

  const handleChange = (key: keyof EditorSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

        {/* Modal Window */}
        <div className="relative w-full max-w-md bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden text-glass-text animate-blob">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-glass-text flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-brand-primary" />
                    Appearance & Settings
                </h2>
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-glass-text-sec hover:text-red-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
                
                {/* Theme Section */}
                <section>
                    <label className="text-xs font-semibold text-glass-text-sec uppercase tracking-wider mb-4 block">
                        Interface Theme
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleChange('theme', 'light')}
                            className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                                settings.theme === 'light'
                                ? 'border-brand-primary bg-brand-primary/5'
                                : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-yellow-500">
                                <Sun className="w-6 h-6 fill-current" />
                            </div>
                            <span className={`font-medium ${settings.theme === 'light' ? 'text-brand-primary' : 'text-glass-text'}`}>Light</span>
                            {settings.theme === 'light' && <div className="absolute top-3 right-3 text-brand-primary"><Check className="w-4 h-4" /></div>}
                        </button>

                        <button
                            onClick={() => handleChange('theme', 'dark')}
                            className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                                settings.theme === 'dark'
                                ? 'border-brand-primary bg-brand-primary/5'
                                : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-zinc-800 shadow-sm flex items-center justify-center text-blue-400">
                                <Moon className="w-6 h-6 fill-current" />
                            </div>
                            <span className={`font-medium ${settings.theme === 'dark' ? 'text-brand-primary' : 'text-glass-text'}`}>Dark</span>
                            {settings.theme === 'dark' && <div className="absolute top-3 right-3 text-brand-primary"><Check className="w-4 h-4" /></div>}
                        </button>
                    </div>
                </section>

                {/* Typography Section */}
                <section>
                    <label className="text-xs font-semibold text-glass-text-sec uppercase tracking-wider mb-4 block">
                        Editor Font Size
                    </label>
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
                        <Type className="w-5 h-5 text-glass-text-sec" />
                        <input
                            type="range"
                            min="10"
                            max="24"
                            step="1"
                            value={settings.fontSize}
                            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                        />
                        <span className="w-12 text-center font-mono font-bold text-glass-text bg-white dark:bg-black/20 rounded px-2 py-1">
                            {settings.fontSize}px
                        </span>
                    </div>
                </section>

                {/* Toggles */}
                <section className="space-y-3">
                    <label className="text-xs font-semibold text-glass-text-sec uppercase tracking-wider mb-2 block">
                        Editor Options
                    </label>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleChange('wordWrap', !settings.wordWrap)}>
                        <span className="text-sm font-medium text-glass-text">Word Wrap</span>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.wordWrap ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.wordWrap ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleChange('minimap', !settings.minimap)}>
                        <span className="text-sm font-medium text-glass-text">Minimap</span>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.minimap ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.minimap ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </section>

            </div>
            
            <div className="p-4 bg-gray-50/50 dark:bg-black/10 border-t border-black/5 dark:border-white/5 text-center">
                <button onClick={onClose} className="text-brand-primary font-semibold text-sm hover:underline">
                    Close Settings
                </button>
            </div>
        </div>
    </div>
  );
};