import React, { useEffect, useState } from 'react';
import { X, RefreshCw, ExternalLink } from 'lucide-react';
import { CodeFile } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CodeFile[];
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, files }) => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, files]);

  const generatePreview = () => {
    // Find index.html or fallback to first html
    const htmlFile = files.find(f => f.name === 'index.html') || files.find(f => f.name.endsWith('.html'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js'));

    if (!htmlFile) {
      setSrcDoc('<html><body style="color:white; background:#1e1e1e; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;"><h1>No index.html found</h1></body></html>');
      return;
    }

    let htmlContent = htmlFile.content;

    // Inject CSS
    const styleTags = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    htmlContent = htmlContent.replace('</head>', `${styleTags}</head>`);

    // Inject JS
    // We wrap JS in a try-catch to prevent iframe crashes from stopping the render
    const scriptTags = jsFiles.map(f => `
      <script>
        try {
          ${f.content}
        } catch (e) {
          console.error('Runtime Error in ${f.name}:', e);
        }
      </script>
    `).join('\n');
    htmlContent = htmlContent.replace('</body>', `${scriptTags}</body>`);

    setSrcDoc(htmlContent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white dark:bg-[#121212] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Header - Updated to Glassmorphism */}
        <div className="h-14 glass-header flex items-center justify-between px-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-glass-text font-semibold flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-green-500" />
              Live Deployment Preview
            </h2>
            <span className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                index.html
            </span>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={generatePreview}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-glass-text-sec hover:text-brand-primary transition-colors"
                title="Refresh"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-red-500/10 rounded-lg text-glass-text-sec hover:text-red-500 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Frame */}
        <div className="flex-1 bg-white relative">
            <iframe
                title="preview"
                srcDoc={srcDoc}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
            />
        </div>
      </div>
    </div>
  );
};