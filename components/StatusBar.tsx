
import React from 'react';
import { GitBranch, AlertTriangle, XCircle, Check, Bell, RefreshCw } from 'lucide-react';

interface StatusBarProps {
  file: { name: string; language: string; } | undefined;
  cursorPosition?: { ln: number; col: number };
  isSaving?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ file, cursorPosition = { ln: 1, col: 1 }, isSaving }) => {
  return (
    <div className="h-6 bg-brand-primary text-white flex items-center justify-between px-3 select-none text-[11px] font-sans z-50">
      
      {/* Left Section */}
      <div className="flex items-center gap-4 h-full">
        <button className="flex items-center gap-1 hover:bg-white/20 px-1 h-full transition-colors">
            <GitBranch className="w-3 h-3" />
            <span className="font-medium">main*</span>
        </button>
        
        <button className="flex items-center gap-1 hover:bg-white/20 px-1 h-full transition-colors">
            <RefreshCw className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center gap-2 ml-1">
            <div className="flex items-center gap-1 hover:bg-white/20 px-1 h-full cursor-pointer">
                <XCircle className="w-3 h-3" />
                <span>0</span>
            </div>
            <div className="flex items-center gap-1 hover:bg-white/20 px-1 h-full cursor-pointer">
                <AlertTriangle className="w-3 h-3" />
                <span>0</span>
            </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 h-full">
        {file && (
            <>
                <div className="hover:bg-white/20 px-2 h-full flex items-center cursor-pointer">
                    Ln {cursorPosition.ln}, Col {cursorPosition.col}
                </div>
                <div className="hover:bg-white/20 px-2 h-full flex items-center cursor-pointer">
                    UTF-8
                </div>
                <div className="hover:bg-white/20 px-2 h-full flex items-center cursor-pointer">
                    {file.language === 'typescript' ? 'TypeScript TSX' : file.language.toUpperCase()}
                </div>
            </>
        )}
        <div className="hover:bg-white/20 px-2 h-full flex items-center cursor-pointer">
            <Bell className="w-3 h-3" />
        </div>
        <div className="hover:bg-white/20 px-2 h-full flex items-center cursor-pointer bg-black/20">
            <Check className="w-3 h-3" /> Prettier
        </div>
      </div>
    </div>
  );
};
