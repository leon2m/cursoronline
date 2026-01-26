
import React, { useRef, useState, useMemo } from 'react';
import { FilePlus, FolderPlus, Download, FileCode, Trash2, Search as SearchIcon, ChevronRight, ChevronDown, Box, MoreVertical, Cloud, Layers, Star, Info } from 'lucide-react';
import { CodeFile, ViewMode, Extension } from '../types';

interface SidebarProps {
  files: CodeFile[];
  activeFileId: string | null;
  activeView: ViewMode;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, isFolder?: boolean) => void;
  onDeleteFile: (id: string, e: React.MouseEvent) => void;
  onImportFile: (file: File) => void;
  onExportFile: (file: CodeFile) => void;
  onExportZip: () => void;
}

// Helper to build tree structure from paths
const buildFileTree = (files: CodeFile[]) => {
    const root: any = {};
    files.forEach(file => {
        const parts = file.path ? file.path.split('/') : [file.name];
        let current = root;
        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = index === parts.length - 1 ? { ...file, type: 'file' } : { type: 'folder', children: {} };
            }
            current = current[part].children || current[part];
        });
    });
    return root;
};

// Recursive Tree Component
const FileTreeItem: React.FC<{ 
    name: string; 
    item: any; 
    depth: number; 
    activeFileId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}> = ({ name, item, depth, activeFileId, onSelect, onDelete }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isFolder = item.type === 'folder';

    if (isFolder) {
        return (
            <div>
                <button
                    type="button"
                    className="w-full flex items-center gap-1 py-1 px-2 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer theme-text opacity-70 hover:opacity-100 transition-colors select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary"
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span className="text-[13px] font-medium truncate">{name}</span>
                </button>
                {isOpen && (
                    <div>
                        {Object.entries(item.children).map(([childName, childItem]) => (
                            <FileTreeItem 
                                key={childName} 
                                name={childName} 
                                item={childItem} 
                                depth={depth + 1}
                                activeFileId={activeFileId}
                                onSelect={onSelect}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            className={`flex items-center group relative py-1 pr-2 select-none transition-colors border-l-2 ${
                item.id === activeFileId 
                ? 'bg-brand-primary/20 theme-text border-brand-primary' 
                : 'theme-text opacity-70 hover:bg-black/5 dark:hover:bg-white/5 hover:opacity-100 border-transparent'
            }`}
        >
            <button
                type="button"
                className="flex-1 flex items-center gap-2 overflow-hidden text-left focus:outline-none focus-visible:underline"
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                onClick={() => onSelect(item.id)}
            >
                <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${item.id === activeFileId ? 'text-brand-primary' : 'text-gray-500'}`} />
                <span className="text-[13px] truncate">{name}</span>
                {item.isUnsaved && <div className="w-1.5 h-1.5 rounded-full bg-white ml-1"></div>}
            </button>
            <button 
                type="button"
                onClick={(e) => onDelete(item.id, e)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded text-gray-500 hover:text-red-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 flex-shrink-0"
                aria-label={`Delete ${name}`}
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
};

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
    { id: '1', name: 'python', displayName: 'Python', description: 'IntelliSense, linting, and debugging for Python.', author: 'Microsoft', version: '2024.2.1', downloads: '100M+', icon: 'Py', installed: false, category: 'Language' },
    { id: '2', name: 'prettier', displayName: 'Prettier - Code formatted', description: 'Code formatter using prettier', author: 'Prettier', version: '10.1.0', downloads: '40M+', icon: 'Pr', installed: true, category: 'Linter' },
    { id: '3', name: 'docker', displayName: 'Docker', description: 'Makes it easy to create, manage, and debug containerized applications.', author: 'Microsoft', version: '1.29.0', downloads: '28M+', icon: 'Dk', installed: false, category: 'Other' },
    { id: '4', name: 'eslint', displayName: 'ESLint', description: 'Integrates ESLint JavaScript into VS Code.', author: 'Microsoft', version: '2.4.4', downloads: '32M+', icon: 'Es', installed: true, category: 'Linter' },
    { id: '5', name: 'csharp', displayName: 'C# Dev Kit', description: 'Official C# extension for VS Code.', author: 'Microsoft', version: '1.3.0', downloads: '12M+', icon: 'C#', installed: false, category: 'Language' },
    { id: '6', name: 'github-copilot', displayName: 'GitHub Copilot', description: 'Your AI pair programmer.', author: 'GitHub', version: '1.156.0', downloads: '15M+', icon: 'Ai', installed: true, category: 'Other' },
    { id: '7', name: 'vscode-icons', displayName: 'vscode-icons', description: 'Icons for Visual Studio Code', author: 'VSCode Icons Team', version: '12.0.0', downloads: '16M+', icon: 'Ic', installed: false, category: 'Theme' },
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

  const fileTree = useMemo(() => buildFileTree(files), [files]);

  const renderExplorer = () => (
    <>
      <div className="h-9 flex items-center justify-between px-4 flex-shrink-0 group">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:theme-text transition-colors">Explorer</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onCreateFile("New File")} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-gray-400 hover:theme-text" title="New File">
                <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-gray-400 hover:theme-text" title="Import File">
                <FolderPlus className="w-3.5 h-3.5" />
            </button>
             <button onClick={onExportZip} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-gray-400 hover:theme-text" title="Download Zip">
                <Download className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded text-gray-400 hover:theme-text">
                <MoreVertical className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
        {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p className="text-xs">No open folder</p>
                <button onClick={() => onCreateFile('main.ts')} className="mt-2 px-3 py-1.5 bg-brand-primary text-white text-xs rounded hover:bg-brand-primary/90">Open Folder</button>
            </div>
        ) : (
            <div className="flex flex-col">
                {Object.entries(fileTree).map(([name, item]) => (
                    <FileTreeItem 
                        key={name} 
                        name={name} 
                        item={item} 
                        depth={0} 
                        activeFileId={activeFileId} 
                        onSelect={onSelectFile}
                        onDelete={onDeleteFile}
                    />
                ))}
            </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
    </>
  );

  const renderExtensions = () => (
    <>
        <div className="h-auto p-4 flex-shrink-0 theme-border border-b">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">Extensions</span>
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search Extensions" 
                    className="w-full pl-2 pr-2 py-1.5 theme-bg-main theme-border border rounded-sm text-xs theme-text placeholder:text-gray-500 focus:outline-none focus:border-brand-primary transition-all"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Popular</div>
            {extensions.map(ext => (
                <div key={ext.id} className="flex gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group theme-border border-b border-opacity-50">
                    <div className="w-10 h-10 theme-bg-main rounded shadow-sm flex items-center justify-center text-sm font-bold text-brand-primary flex-shrink-0">
                        {ext.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-[13px] font-bold theme-text truncate">{ext.displayName}</h4>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{ext.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                {ext.author}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                <Download className="w-2.5 h-2.5" /> {ext.downloads}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleExtension(ext.id); }}
                                className={`text-[11px] px-2 py-0.5 rounded-[2px] font-medium transition-colors ${
                                    ext.installed 
                                    ? 'theme-bg-main theme-text hover:bg-black/10 dark:hover:bg-white/10' 
                                    : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                                }`}
                            >
                                {ext.installed ? 'Manage' : 'Install'}
                            </button>
                            {ext.installed && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
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
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-3">Search</span>
            <div className="relative">
                <SearchIcon className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-500" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search" 
                    className="w-full pl-7 pr-2 py-1.5 theme-bg-main theme-border border rounded-sm text-xs theme-text focus:outline-none focus:border-brand-primary transition-all"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
            {searchTerm && (
                <div className="text-xs text-gray-500 text-center mt-4">
                    Searching for "{searchTerm}"...
                </div>
            )}
        </div>
      </div>
  );

  return (
    <div className="w-64 theme-bg-sec flex flex-col h-full z-20 theme-border border-r">
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'explorer' && renderExplorer()}
        {activeView === 'extensions' && renderExtensions()}
        {activeView === 'search' && renderSearch()}
      </div>
    </div>
  );
};
