
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

    // --- 1. CURSOR DARK ---
    monaco.editor.defineTheme('cursor-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#3794FF',
        'editor.selectionBackground': '#3794FF33',
        'editorWidget.background': '#252526',
        'editorWidget.border': '#454545',
      },
    });

    // --- 2. CURSOR LIGHT ---
    monaco.editor.defineTheme('cursor-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editorCursor.foreground': '#3794FF',
        'editor.selectionBackground': '#3794FF33',
      },
    });

    // --- 3. VERCEL DARK ---
    monaco.editor.defineTheme('vercel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#333333',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#333333',
      },
    });

    // --- 4. DRACULA ---
    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
          { token: 'comment', foreground: '6272a4' },
          { token: 'keyword', foreground: 'ff79c6' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'type', foreground: '8be9fd' },
      ],
      colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#6272a4',
        'editorCursor.foreground': '#f8f8f2',
        'editor.selectionBackground': '#44475a',
      },
    });

    // --- 5. MONOKAI ---
    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
          { token: 'comment', foreground: '75715e' },
          { token: 'keyword', foreground: 'f92672' },
          { token: 'string', foreground: 'e6db74' },
          { token: 'number', foreground: 'ae81ff' },
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#90908a',
        'editorCursor.foreground': '#f8f8f0',
        'editor.selectionBackground': '#49483e',
      },
    });

    // --- 6. NORD ---
    monaco.editor.defineTheme('nord', {
      base: 'vs-dark',
      inherit: true,
      rules: [
          { token: 'comment', foreground: '616e88' },
          { token: 'keyword', foreground: '81a1c1' },
          { token: 'string', foreground: 'a3be8c' },
      ],
      colors: {
        'editor.background': '#2e3440',
        'editor.foreground': '#d8dee9',
        'editorLineNumber.foreground': '#4c566a',
        'editorCursor.foreground': '#d8dee9',
        'editor.selectionBackground': '#434c5e',
      },
    });

    monaco.editor.setTheme(settings.theme);
  };

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(settings.theme);
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
            useShadows: false, 
          }
        }}
      />
    </div>
  );
};
