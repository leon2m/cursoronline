import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import { EditorSettings } from '../types';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  settings: EditorSettings;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  settings
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // --- PREMIUM DARK THEME ---
    // High contrast, deep blacks, neon accents
    monaco.editor.defineTheme('cursor-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: '2EA446', fontStyle: 'bold' }, // Brand Primary
          { token: 'identifier', foreground: 'E2E2E2' },
          { token: 'type', foreground: 'AFD244' }, // Brand Secondary (Lime)
          { token: 'string', foreground: 'D9F99D' }, // Brighter Lime for text
          { token: 'number', foreground: '7dd3fc' }, // Light Blue
          { token: 'delimiter', foreground: '86868b' },
      ],
      colors: {
        'editor.background': '#121212F2', // Very Dark Gray with slight transparency (95% opacity)
        'editor.foreground': '#e2e2e2',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#2EA446',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorCursor.foreground': '#2EA446',
        'editor.selectionBackground': '#2EA44633',
        'editorWidget.background': '#18181b',
        'editorWidget.border': '#27272a',
        'editorIndentGuide.background': '#27272a',
        'editorIndentGuide.activeBackground': '#3f3f46'
      },
    });

    // --- PREMIUM LIGHT THEME ---
    // Sharp contrast, off-white background, dark readable text
    monaco.editor.defineTheme('cursor-light', {
      base: 'vs',
      inherit: true,
      rules: [
          { token: 'comment', foreground: '5c7335', fontStyle: 'italic' }, // Darker olive green
          { token: 'keyword', foreground: '1a752e', fontStyle: 'bold' }, // Darker Brand Green for contrast
          { token: 'identifier', foreground: '111827' }, // Almost black
          { token: 'type', foreground: '0369a1' }, // Blue-ish for types
          { token: 'string', foreground: '5a6e13' }, // Dark Lime/Olive for readability
          { token: 'number', foreground: '0891b2' },
          { token: 'delimiter', foreground: '6b7280' },
      ],
      colors: {
        'editor.background': '#ffffffF2', // White with slight transparency (95% opacity)
        'editor.foreground': '#111827',
        'editorLineNumber.foreground': '#9ca3af',
        'editorLineNumber.activeForeground': '#1a752e',
        'editor.lineHighlightBackground': '#00000008',
        'editorCursor.foreground': '#1a752e',
        'editor.selectionBackground': '#2EA44626',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e5e7eb',
        'editorIndentGuide.background': '#e5e7eb',
        'editorIndentGuide.activeBackground': '#d1d5db'
      },
    });

    monaco.editor.setTheme(settings.theme === 'dark' ? 'cursor-dark' : 'cursor-light');
  };

  // Update theme when settings change
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(settings.theme === 'dark' ? 'cursor-dark' : 'cursor-light');
    }
  }, [settings.theme]);

  return (
    <div className="w-full h-full"> 
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: settings.minimap },
          fontSize: settings.fontSize,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          fontFamily: "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
          fontLigatures: true,
          automaticLayout: true,
          padding: { top: 24, bottom: 24 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          contextmenu: true,
          roundedSelection: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false, // Cleaner look without shadow
          }
        }}
      />
    </div>
  );
};