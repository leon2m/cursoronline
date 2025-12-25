
import React from 'react';
import { X, Moon, Sun, Globe } from 'lucide-react';
import { EditorSettings, Language } from '../types';
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
  if (!isOpen) return null;

  const handleChange = (key: keyof EditorSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const l = (key: string) => t(settings.language, key);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[4px] smooth-transition" onClick={onClose}></div>

        <div className="relative w-full max-w-sm bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-3xl rounded-[32px] shadow-2xl border border-glass-border overflow-hidden apple-modal-enter">
            
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <h2 className="text-[17px] font-bold tracking-tight text-brand-dark">{l('settings.title')}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 smooth-transition">
                    <X className="w-4 h-4 opacity-40" />
                </button>
            </div>

            <div className="p-8 space-y-8">
                <section>
                    <label className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-[2px] mb-5 block">{l('settings.appearance')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleChange('theme', 'light')}
                            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 smooth-transition ${
                                settings.theme === 'light' ? 'border-brand-primary bg-brand-primary/5' : 'border-transparent bg-black/5 dark:bg-white/5'
                            }`}
                        >
                            <Sun className={`w-5 h-5 ${settings.theme === 'light' ? 'text-brand-primary' : 'opacity-40'}`} />
                            <span className="text-[12px] font-bold">{l('settings.light')}</span>
                        </button>

                        <button
                            onClick={() => handleChange('theme', 'dark')}
                            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 smooth-transition ${
                                settings.theme === 'dark' ? 'border-brand-primary bg-brand-primary/5' : 'border-transparent bg-black/5 dark:bg-white/5'
                            }`}
                        >
                            <Moon className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-brand-primary' : 'opacity-40'}`} />
                            <span className="text-[12px] font-bold">{l('settings.dark')}</span>
                        </button>
                    </div>
                </section>

                <section>
                    <label className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-[2px] mb-5 block">{l('settings.language')}</label>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleChange('language', 'en')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm border smooth-transition flex items-center justify-center gap-2 ${
                                settings.language === 'en' 
                                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10'
                            }`}
                         >
                            <Globe className="w-4 h-4" /> English
                         </button>
                         <button 
                            onClick={() => handleChange('language', 'tr')}
                            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm border smooth-transition flex items-center justify-center gap-2 ${
                                settings.language === 'tr' 
                                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20' 
                                : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10'
                            }`}
                         >
                            <Globe className="w-4 h-4" /> Türkçe
                         </button>
                    </div>
                </section>
            </div>
            
            <div className="p-6 text-center">
                <button onClick={onClose} className="text-[12px] font-bold text-brand-primary hover:opacity-70 smooth-transition">OK</button>
            </div>
        </div>
    </div>
  );
};
