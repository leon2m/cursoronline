
import React from 'react';
import { ProjectConfig } from '../types';
import { Settings, X, Check } from 'lucide-react';

interface ProjectSpecPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  config: ProjectConfig;
  setConfig: (c: ProjectConfig) => void;
}

const LANGUAGES = ['typescript', 'python', 'cpp', 'go', 'rust', 'swift', 'sql', 'html'];
const TOOLS = ['docker', 'expo', 'firebase', 'supabase', 'tailwind', 'jest'];

export const ProjectSpecPopover: React.FC<ProjectSpecPopoverProps> = ({ isOpen, onClose, config, setConfig }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-4 z-50 w-80 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
        <div className="flex items-center justify-between p-3 border-b border-[#333]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-brand-primary" /> Project Spec
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
             {/* Platform */}
             <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 font-bold uppercase">Platform</label>
                 <div className="grid grid-cols-3 gap-1">
                     {['web', 'mobile', 'desktop'].map(t => (
                         <button 
                            key={t}
                            onClick={() => setConfig({...config, type: t as any})}
                            className={`px-2 py-1.5 rounded text-[10px] capitalize border transition-all ${config.type === t ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-[#27272a] border-transparent text-gray-400 hover:border-[#444]'}`}
                         >
                             {t}
                         </button>
                     ))}
                 </div>
             </div>

             {/* Languages */}
             <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 font-bold uppercase">Stack</label>
                 <div className="flex flex-wrap gap-1.5">
                     {LANGUAGES.map(l => (
                         <button 
                            key={l}
                            onClick={() => {
                                const langs = config.languages.includes(l) ? config.languages.filter(x => x !== l) : [...config.languages, l];
                                setConfig({...config, languages: langs});
                            }}
                            className={`px-2 py-1 rounded text-[10px] uppercase font-mono border transition-all ${config.languages.includes(l) ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : 'bg-[#27272a] border-transparent text-gray-400 hover:border-[#444]'}`}
                         >
                             {l}
                         </button>
                     ))}
                 </div>
             </div>

             {/* Tools */}
             <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 font-bold uppercase">Tools</label>
                 <div className="flex flex-wrap gap-1.5">
                     {TOOLS.map(t => (
                         <button 
                            key={t}
                            onClick={() => {
                                const tools = config.tools.includes(t) ? config.tools.filter(x => x !== t) : [...config.tools, t];
                                setConfig({...config, tools});
                            }}
                            className={`px-2 py-1 rounded text-[10px] uppercase font-mono border transition-all ${config.tools.includes(t) ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-[#27272a] border-transparent text-gray-400 hover:border-[#444]'}`}
                         >
                             {t}
                         </button>
                     ))}
                 </div>
             </div>

             {/* AI Toggle */}
             <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                 <span className="text-[10px] text-gray-400">Auto-Architecture</span>
                 <button 
                    onClick={() => setConfig({...config, isAiRecommended: !config.isAiRecommended})}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.isAiRecommended ? 'bg-brand-primary' : 'bg-[#333]'}`}
                 >
                     <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${config.isAiRecommended ? 'left-4.5' : 'left-0.5'}`}></div>
                 </button>
             </div>
        </div>
    </div>
  );
};
