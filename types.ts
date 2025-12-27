
export interface CodeFile {
  id: string;
  name: string;
  path: string; // e.g., "src/components/Button.tsx"
  language: string;
  content: string;
  isUnsaved?: boolean;
}

export type ApplicationType = 'web' | 'mobile' | 'game' | 'system' | 'ai_model' | 'script' | 'desktop' | 'fullstack';
export type PlatformType = 'browser' | 'ios' | 'android' | 'cross_platform' | 'linux' | 'windows' | 'embedded' | 'macos' | 'cloud_function';

export interface ProjectConfig {
  type: ApplicationType;
  platform: PlatformType;
  languages: string[]; 
  frameworks: string[];
  tools: string[];
  isAiRecommended: boolean;
  architecture: 'monolith' | 'microservices' | 'serverless' | 'mvc' | 'modular';
  buildTarget: 'debug' | 'release' | 'production' | 'wasm';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  files: CodeFile[];
  config?: ProjectConfig;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface AgentRunData {
    status: AgentStatus;
    tasks: AgentTask[];
    logs: string[];
    activeAgent: AgentRole | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  // If this message represents an Agent working
  type?: 'text' | 'agent_run';
  runData?: AgentRunData;
}

export interface ChatSession {
    id: string;
    title: string;
    updatedAt: number;
    messages: ChatMessage[];
}

export type Language = 'en' | 'tr';

export type ThemeType = 'cursor-dark' | 'cursor-light' | 'vercel-dark' | 'dracula' | 'monokai' | 'nord';

export interface MCPServer {
    id: string;
    name: string;
    url: string;
    status: 'connected' | 'disconnected' | 'error';
    type: 'stdio' | 'websocket';
}

export interface EditorSettings {
  theme: ThemeType;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  language: Language;
  rules?: string; 
  mcpServers: MCPServer[];
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
  TEXT = 'plaintext',
  CPP = 'cpp',
  CSHARP = 'csharp',
  LUA = 'lua',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  DART = 'dart',
  XML = 'xml',
  YAML = 'yaml'
}

export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.html': 'html',
  '.css': 'css',
  '.py': 'python',
  '.java': 'java',
  '.cpp': 'cpp',
  '.h': 'cpp',
  '.cs': 'csharp',
  '.lua': 'lua',
  '.go': 'go',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.dart': 'dart',
  '.json': 'json',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.dockerfile': 'dockerfile'
};

export type AIActionType = 'explain' | 'fix' | 'comments' | 'refactor';
export type ViewMode = 'explorer' | 'search' | 'extensions' | 'projects';

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

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
}

export interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  downloads: string;
  icon: string; // URL or Lucide Icon name
  installed: boolean;
  category: 'Language' | 'Linter' | 'Theme' | 'Snippets' | 'Other';
}
