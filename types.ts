
export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isUnsaved?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  files: CodeFile[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type Language = 'en' | 'tr';

export interface EditorSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  language: Language;
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
export type ViewMode = 'explorer' | 'search' | 'extensions' | 'projects';

// --- Team Agent Types ---
export type AgentRole = 'planner' | 'designer' | 'frontend' | 'backend' | 'lead';
export type AgentStatus = 'idle' | 'working' | 'completed' | 'error';

export interface AgentMember {
  role: AgentRole;
  name: string;
  title: string;
  avatar: string;
  description: string;
  status: AgentStatus;
}

export interface AgentTask {
  id: string;
  assignedTo: AgentRole;
  type: 'create' | 'update' | 'delete';
  fileName: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface PlanStep {
  id: string;
  description: string;
  status: 'pending' | 'generating' | 'completed';
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: string;
  installed: boolean;
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
}
