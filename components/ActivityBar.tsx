
import React from 'react';
import { Files, Search, Blocks, Settings, Bot } from 'lucide-react';
import { ViewMode } from '../types';

interface ActivityBarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onToggleAI: () => void;
  onOpenSettings: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  onToggleAI,
  onOpenSettings
}) => {
  const icons = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'extensions', icon: Blocks, label: 'Extensions' },
  ];

  return (
    <div className="w-16 flex flex-col items-center py-6 gap-6 glass-sidebar z-30 flex-shrink-0">
      <div className="flex flex-col gap-6 w-full items-center">
        {icons.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewMode)}
            className={`relative group p-3 rounded-xl transition-all duration-300 ${
              activeView === item.id 
                ? 'bg-white/80 dark:bg-white/20 text-brand-primary shadow-sm' 
                : 'text-glass-text-sec hover:text-glass-text hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={item.label}
          >
            <item.icon className="w-6 h-6 stroke-[1.5]" />
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-6 items-center w-full pb-2">
        <button
            onClick={onToggleAI}
            className="p-3 text-glass-text-sec hover:text-brand-primary transition-all hover:scale-110 active:scale-95"
            title="AI Agent"
        >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Bot className="w-6 h-6 text-white" />
            </div>
        </button>
        <button
            onClick={onOpenSettings}
            className="p-3 rounded-xl transition-colors text-glass-text-sec hover:text-glass-text hover:bg-black/5 dark:hover:bg-white/10"
            title="Settings"
        >
            <Settings className="w-6 h-6 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
};
