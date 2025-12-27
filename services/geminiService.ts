
import { GoogleGenAI, Type } from "@google/genai";
import { AgentTask, CodeFile, AgentRole, AIActionType, PlanStep, ProjectConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Enforce single model usage as requested
const MODEL_NAME = 'gemini-3-pro-preview';

export const createChatSession = (systemInstruction: string, userRules?: string) => {
  const rules = userRules ? `\nUSER DEFINED RULES:\n${userRules}` : '';
  
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `${systemInstruction}\n${rules}\nIMPORTANT: You are "Claude Opus 4.5". You are a Senior Architect and Full Stack Developer. You write modern, secure, and performant code.`,
      temperature: 0.2, 
    },
  });
};

export const generateTeamPlan = async (goal: string, existingFiles: CodeFile[], config?: ProjectConfig, userRules?: string): Promise<AgentTask[]> => {
  try {
    const fileList = existingFiles.map(f => f.name).join(', ');
    const projectContext = config ? `
      PROJECT TYPE: ${config.type.toUpperCase()}
      PLATFORM: ${config.platform.toUpperCase()}
      STACK: ${config.languages.join(', ')}
      TOOLS: ${config.tools.join(', ').toUpperCase()}
      ARCHITECTURE: ${config.architecture.toUpperCase()}
    ` : '';

    const rules = userRules ? `USER RULES: ${userRules}` : '';

    const prompt = `
      You are an Autonomous Software Team managed by Claude Opus 4.5.
      GOAL: "${goal}"
      ${projectContext}
      ${rules}
      EXISTING FILES: [${fileList}]

      Your Task: Distribute tasks to your team to achieve the goal.
      
      ROLES:
      - planner: Plans architecture, file structure, config files (Docker, Expo, etc.).
      - designer: UI/UX (Tailwind, CSS).
      - frontend: Client side / Mobile UI.
      - backend: Server / System / Logic.
      - lead: Refactor and final review.

      Return JSON only:
      {
        "tasks": [
          {
            "id": "string",
            "assignedTo": "planner" | "designer" | "frontend" | "backend" | "lead",
            "type": "create" | "update" | "delete",
            "fileName": "string",
            "description": "Detailed description of the task"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.tasks.map((t: any) => ({ ...t, status: 'pending' }));
    }
    return [];
  } catch (error) {
    console.error("Team Plan Error", error);
    throw error;
  }
};

export const generateAgentFileContent = async (task: AgentTask, goal: string, allFiles: CodeFile[], config?: ProjectConfig, userRules?: string): Promise<string> => {
  try {
    const fileContext = allFiles.map(f => `--- FILE: ${f.name} ---\n${f.content}\n`).join('\n');
    const projectContext = config ? `PROJECT: ${config.type} | PLATFORM: ${config.platform}` : '';
    const rules = userRules ? `USER RULES: ${userRules}` : '';

    const prompt = `
      MODEL: Claude Opus 4.5
      ROLE: ${task.assignedTo.toUpperCase()} AGENT
      GOAL: ${goal}
      ${projectContext}
      ${rules}
      TASK: ${task.type === 'create' ? 'Create' : 'Update'} "${task.fileName}".
      DETAIL: ${task.description}

      CONTEXT:
      ${fileContext}

      Return ONLY the full content of the file. No Markdown backticks.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    let cleanCode = response.text || "";
    if (cleanCode.trim().startsWith('```')) {
      const lines = cleanCode.trim().split('\n');
      cleanCode = lines.slice(1, -1).join('\n');
    }
    return cleanCode;
  } catch (error) {
    console.error("Agent Content Error", error);
    throw error;
  }
};

export const simulateExecution = async (files: CodeFile[], entryFileId: string): Promise<{ output: string, error?: string }> => {
    try {
        const entryFile = files.find(f => f.id === entryFileId);
        if(!entryFile) return { output: '', error: 'Entry file not found.' };
        const fileContext = files.map(f => `--- ${f.name} (${f.language}) ---\n${f.content}\n`).join('\n');
        
        const prompt = `
          You are Claude Opus 4.5 Universal Runtime Simulator.
          Compile and Run the following codebase.
          
          ENTRY: ${entryFile.name}
          FILES:
          ${fileContext}
          
          Return JSON: { "output": "stdout...", "error": "stderr or null" }
        `;
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) return JSON.parse(response.text);
        return { output: 'No output.', error: 'Simulation failed.' };
    } catch (e: any) { return { output: '', error: e.message }; }
}

export const generateImplementationPlan = async (goal: string, content: string, language: string): Promise<PlanStep[]> => {
  try {
    const prompt = `LANG: ${language}\nGOAL: ${goal}\nCODE:\n${content}\n\nStep-by-step Plan JSON: { "steps": [{ "id": "s1", "description": "desc" }] }`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    if (response.text) return JSON.parse(response.text).steps;
    return [];
  } catch (error) { return []; }
};

export const applyModification = async (content: string, language: string, instruction: string): Promise<string> => {
    const prompt = `CODE:\n${content}\nINSTRUCTION: ${instruction}\nReturn only the full updated code.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    let code = response.text || "";
    if (code.trim().startsWith('```')) code = code.trim().split('\n').slice(1, -1).join('\n');
    return code;
}

export const constructActionPrompt = (action: AIActionType, content: string, language: string): string => {
  switch (action) {
    case 'explain': return `Explain this code:\n${content}`;
    case 'fix': return `Fix this code:\n${content}`;
    case 'refactor': return `Refactor and optimize:\n${content}`;
    case 'comments': return `Add doc comments:\n${content}`;
    default: return '';
  }
};
