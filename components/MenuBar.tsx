
import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Search, 
  Globe, 
  LayoutTemplate, 
  PanelRightOpen, 
  PanelRightClose, 
  SidebarOpen, 
  SidebarClose, 
  PanelBottomOpen, 
  User, 
  Menu,
  FilePlus,
  Save,
  FolderOpen,
  Reply,
  Forward,
  Play,
  TerminalSquare
} from 'lucide-react';

interface MenuBarProps {
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleAiPanel: () => void;
  isAiPanelOpen: boolean;
  onAction: (action: string) => void;
  onOpenAgentManager: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ 
  onOpenSettings, 
  onToggleSidebar, 
  isSidebarOpen, 
  onToggleAiPanel, 
  isAiPanelOpen,
  onAction,
  onOpenAgentManager
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuStructure: Record<string, { label: string, shortcut?: string, action: string, icon?: any }[]> = {
    'File': [
      { label: 'New File', shortcut: 'Ctrl+N', action: 'new_file', icon: FilePlus },
      { label: 'Open Folder', shortcut: 'Ctrl+O', action: 'open_folder', icon: FolderOpen },
      { label: 'Save', shortcut: 'Ctrl+S', action: 'save', icon: Save },
      { label: 'Save All', action: 'save_all' },
    ],
    'Edit': [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: 'undo', icon: Reply },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: 'redo', icon: Forward },
      { label: 'Cut', shortcut: 'Ctrl+X', action: 'cut' },
      { label: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
      { label: 'Paste', shortcut: 'Ctrl+V', action: 'paste' },
    ],
    'View': [
      { label: 'Explorer', action: 'view_explorer' },
      { label: 'Search', action: 'view_search' },
      { label: 'Extensions', action: 'view_extensions' },
      { label: 'Toggle Sidebar', action: 'toggle_sidebar' },
      { label: 'Toggle AI Panel', action: 'toggle_ai' },
    ],
    'Run': [
      { label: 'Start Debugging', shortcut: 'F5', action: 'run_debug', icon: Play },
      { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: 'run_no_debug' },
    ],
    'Terminal': [
        { label: 'New Terminal', action: 'new_terminal', icon: TerminalSquare }
    ]
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleAction = (action: string) => {
    setActiveMenu(null);
    if (action === 'toggle_sidebar') onToggleSidebar();
    else if (action === 'toggle_ai') onToggleAiPanel();
    else onAction(action);
  };

  return (
    <div className="h-8 theme-bg-main flex items-center justify-between px-2 select-none theme-border border-b text-[11px] font-sans z-[60] w-full" ref={menuRef}>
      
      {/* Left: Menu Items */}
      <div className="flex items-center relative">
        <div className="w-8 h-8 flex items-center justify-center mr-1">
             <img src="https://mintlify.s3-us-west-1.amazonaws.com/cursor/logo/logo-dark.svg" alt="logo" className="w-4 h-4 opacity-80" onError={(e) => e.currentTarget.style.display='none'} />
        </div>
        
        {Object.keys(menuStructure).map(menu => (
          <div key={menu} className="relative">
             <button 
                onClick={() => handleMenuClick(menu)}
                onMouseEnter={() => activeMenu && setActiveMenu(menu)}
                className={`px-2.5 py-1 rounded-[3px] transition-colors cursor-default ${activeMenu === menu ? 'bg-black/10 dark:bg-white/10 theme-text' : 'theme-text opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'}`}
             >
                {menu}
             </button>
             
             {activeMenu === menu && (
                 <div className="absolute top-full left-0 mt-1 w-56 theme-bg-sec theme-border border rounded-md shadow-xl py-1 z-[70]">
                     {menuStructure[menu].map((item, idx) => (
                         <button
                            key={idx}
                            onClick={() => handleAction(item.action)}
                            className="w-full text-left px-3 py-1.5 hover:bg-brand-primary hover:text-white theme-text flex items-center justify-between group"
                         >
                             <div className="flex items-center gap-2">
                                 {item.icon && <item.icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
                                 <span>{item.label}</span>
                             </div>
                             {item.shortcut && <span className="text-[9px] opacity-50">{item.shortcut}</span>}
                         </button>
                     ))}
                 </div>
             )}
          </div>
        ))}
        
        <button 
            className="px-2.5 py-1 theme-text opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px] transition-colors cursor-default"
            onClick={() => {}}
        >
            Help
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5">
        
        {/* Agent Manager Button */}
        <button 
            onClick={onOpenAgentManager}
            className="hidden md:flex theme-text opacity-70 hover:opacity-100 px-2 py-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px] transition-colors mr-2 border border-transparent hover:theme-border"
        >
            Open Agent Manager
        </button>

        {/* Layout Controls Group */}
        <div className="flex items-center gap-0.5">
            <button 
                onClick={onToggleSidebar}
                className={`p-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-white/5 ${isSidebarOpen ? 'theme-text' : 'theme-text opacity-50'}`} 
                title="Toggle Primary Sidebar"
            >
                {isSidebarOpen ? <SidebarOpen className="w-3.5 h-3.5" /> : <SidebarClose className="w-3.5 h-3.5" />}
            </button>
            <button className="p-1 theme-text opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px]" title="Toggle Panel">
                <PanelBottomOpen className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={onToggleAiPanel}
                className={`p-1 rounded-[3px] hover:bg-black/5 dark:hover:bg-white/5 ${isAiPanelOpen ? 'theme-text' : 'theme-text opacity-50'}`} 
                title="Toggle Secondary Side Bar"
            >
                {isAiPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </button>
        </div>

        <div className="w-[1px] h-3.5 theme-bg-sec mx-1"></div>

        {/* Utility Icons */}
        <button className="p-1 theme-text opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px]">
            <Search className="w-3.5 h-3.5" />
        </button>
        <button className="p-1 theme-text opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px]">
            <Globe className="w-3.5 h-3.5" />
        </button>
        <button 
            onClick={onOpenSettings}
            className="p-1 theme-text opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px]"
        >
            <Settings className="w-3.5 h-3.5" />
        </button>

        <div className="ml-1 pl-1 border-l theme-border flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-[3px] px-1 py-0.5">
             <div className="w-4 h-4 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-[9px] font-bold">
                 C
             </div>
        </div>

      </div>
    </div>
  );
};
