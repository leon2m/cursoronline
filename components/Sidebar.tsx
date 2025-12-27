
import React, { useRef, useState, useMemo } from 'react';
import { FilePlus, Upload, Download, FileCode, Trash2, MoreHorizontal, Search as SearchIcon, Cloud, Box, Archive } from 'lucide-react';
import { CodeFile, ViewMode, Extension } from '../types';

interface SidebarProps {
  files: CodeFile[];
  activeFileId: string | null;
  activeView: ViewMode;
  onSelectFile: (id: string) => void;
  onCreateFile: () => void;
  onDeleteFile: (id: string, e: React.MouseEvent) => void;
  onImportFile: (file: File) => void;
  onExportFile: (file: CodeFile) => void;
  onExportZip: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  activeView,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onImportFile,
  onExportFile,
  onExportZip
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [extensions, setExtensions] = useState<Extension[]>([
    { id: '1', name: 'Prettier', description: 'Code formatter', author: 'Prettier', icon: 'P', installed: true },
    { id: '2', name: 'ESLint', description: 'Linting utility', author: 'Microsoft', icon: 'E', installed: true },
    { id: '3', name: 'Python', description: 'Language support', author: 'Microsoft', icon: 'Py', installed: false },
    { id: '4', name: 'Docker', description: 'Container support', author: 'Docker', icon: 'D', installed: false },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleExtension = (id: string) => {
    setExtensions(prev => prev.map(ex => ex.id === id ? { ...ex, installed: !ex.installed } : ex));
  };

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    return files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [files, searchTerm]);

  // --- RENDER CONTENT BASED ON ACTIVE VIEW ---

  const renderExplorer = () => (
    <>
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Explorer</span>
        <div className="flex gap-1">
            <button onClick={onCreateFile} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-brand-primary transition-colors" title="New File">
                <FilePlus className="w-4 h-4" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-brand-primary transition-colors" title="Upload File">
                <Upload className="w-4 h-4" />
            </button>
            <button onClick={onExportZip} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-brand-primary transition-colors" title="Download Project (ZIP)">
                <Archive className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <div className="px-2 overflow-y-auto flex-1 custom-scrollbar">
        {files.length === 0 ? (
            <div className="text-center mt-10 p-4">
                <p className="text-sm text-gray-600">No files open.</p>
                <button onClick={onCreateFile} className="mt-2 text-xs text-brand-primary hover:underline font-bold">Create one</button>
            </div>
        ) : (
            files.map((file) => (
                <div
                key={file.id}
                className={`group flex items-center justify-between px-3 py-2.5 my-1 rounded-lg cursor-pointer text-sm select-none transition-all duration-200 border border-transparent ${
                    file.id === activeFileId
                    ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => onSelectFile(file.id)}
                >
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileCode className={`w-4 h-4 flex-shrink-0 ${file.id === activeFileId ? 'text-brand-primary' : 'opacity-70'}`} />
                    <span className="truncate">{file.name}</span>
                    {file.isUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary ml-1 shadow-[0_0_5px_var(--brand-secondary)] flex-shrink-0"></span>}
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button
                    onClick={(e) => { e.stopPropagation(); onExportFile(file); }}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                    >
                    <Download className="w-3 h-3" />
                    </button>
                    <button
                    onClick={(e) => onDeleteFile(file.id, e)}
                    className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-500"
                    >
                    <Trash2 className="w-3 h-3" />
                    </button>
                </div>
                </div>
            ))
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
    </>
  );

  const renderExtensions = () => (
    <>
        <div className="p-4 flex-shrink-0">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marketplace</span>
            <div className="mt-4 relative group">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search extensions" 
                    className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
            </div>
        </div>
        <div className="px-2 overflow-y-auto flex-1 custom-scrollbar">
            {extensions.map(ext => (
                <div key={ext.id} className="flex items-start gap-3 p-3 mb-2 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-primary/20 text-xs flex-shrink-0">
                        {ext.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-gray-200">{ext.name}</h4>
                            {ext.installed && <span className="text-[9px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Installed</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{ext.description}</p>
                        <div className="flex items-center justify-between mt-3">
                             <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                <Box className="w-3 h-3" /> {ext.author}
                             </span>
                             <button 
                                onClick={() => toggleExtension(ext.id)}
                                className={`text-[10px] px-2 py-1 rounded-md transition-all font-bold uppercase tracking-wide ${
                                    ext.installed 
                                    ? 'bg-white/5 text-gray-400 hover:bg-white/10' 
                                    : 'bg-brand-primary text-black hover:scale-105'
                                }`}
                             >
                                {ext.installed ? 'Disable' : 'Install'}
                             </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </>
  );

  const renderSearch = () => (
      <div className="flex flex-col h-full">
        <div className="p-4 flex-shrink-0">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Search</span>
            <div className="mt-4 flex gap-2 relative group">
                <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..." 
                    className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            {searchTerm && filteredFiles.length === 0 && (
                <div className="mt-8 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">
                    No matching files found.
                </div>
            )}
            
            {filteredFiles.map((file) => (
                <div
                    key={file.id}
                    className={`flex items-center gap-2 px-3 py-2.5 my-1 rounded-lg cursor-pointer text-sm select-none transition-all duration-200 border border-transparent ${
                        file.id === activeFileId
                        ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => onSelectFile(file.id)}
                >
                    <FileCode className="w-4 h-4 opacity-70" />
                    <span className="truncate">{file.name}</span>
                </div>
            ))}
        </div>
      </div>
  );

  return (
    <div className="w-64 bg-[#0a0a0b] flex flex-col h-full z-20 border-r border-white/5">
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'explorer' && renderExplorer()}
        {activeView === 'extensions' && renderExtensions()}
        {activeView === 'search' && renderSearch()}
      </div>
    </div>
  );
};
