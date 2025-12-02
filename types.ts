
export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isUnsaved?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface EditorSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
  PYTHON = 'python',
  JAVA = 'java',
  MARKDOWN = 'markdown',
  SQL = 'sql',
  TEXT = 'plaintext'
}

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  html: '.html',
  css: '.css',
  json: '.json',
  python: '.py',
  java: '.java',
  markdown: '.md',
  sql: '.sql',
  plaintext: '.txt'
};

export type AIActionType = 'explain' | 'fix' | 'comments' | 'refactor';

// --- View Modes for Activity Bar ---
export type ViewMode = 'explorer' | 'search' | 'extensions' | 'settings';

export interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: string;
  installed: boolean;
}

// --- Agent Types ---

export type AgentStatus = 'idle' | 'planning' | 'executing' | 'completed' | 'error';

export type FileOperationType = 'create' | 'update' | 'delete';

export interface AgentTask {
  id: string;
  description: string;
  type: FileOperationType;
  fileName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface AgentPlan {
  goal: string;
  tasks: AgentTask[];
}

// --- Planner Types ---

export interface PlanStep {
  id: string;
  description: string;
  status: 'pending' | 'generating' | 'completed';
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
}