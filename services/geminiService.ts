
import { GoogleGenAI, Chat, Schema, Type } from "@google/genai";
import { AIActionType, AgentTask, CodeFile, PlanStep } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const getModel = () => 'gemini-2.5-flash';

export const createChatSession = (systemInstruction: string): Chat => {
  return ai.chats.create({
    model: getModel(),
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
};

export const generateCodeExplanation = async (code: string, language: string) => {
  try {
    const prompt = `Explain the following ${language} code concisely and highlight any potential issues or bugs:\n\n${code}`;
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const constructActionPrompt = (action: AIActionType, code: string, language: string): string => {
  const context = `[Target Code (${language})]:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  switch (action) {
    case 'fix': return `${context}Analyze for bugs/errors. Provide fixed code.`;
    case 'comments': return `${context}Add JSDoc/Docstring comments. Return commented code.`;
    case 'refactor': return `${context}Refactor for readability/performance.`;
    case 'explain': default: return `${context}Explain step-by-step.`;
  }
};

// --- Autonomous Agent Services ---

export const generateAgentPlan = async (goal: string, existingFiles: CodeFile[]): Promise<AgentTask[]> => {
  try {
    const fileList = existingFiles.map(f => f.name).join(', ');
    const prompt = `
      You are an Autonomous Senior Software Architect.
      GOAL: "${goal}"
      EXISTING FILES: [${fileList}]

      Your task is to create a complete implementation plan to achieve the goal.
      You must determine exactly which files need to be created, updated, or deleted.
      
      For a new application (e.g. "Create a ToDo app"), you should typically create at least:
      - index.html
      - style.css
      - script.js (or main.js)

      Return a JSON object with a "tasks" array.
      Each task must have:
      - "id" (unique string)
      - "type" ("create" | "update" | "delete")
      - "fileName" (e.g. "index.html")
      - "description" (What exactly goes in this file?)
    `;

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['create', 'update', 'delete'] },
                  fileName: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['id', 'type', 'fileName', 'description']
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.tasks.map((t: any) => ({ ...t, status: 'pending' }));
    }
    return [];
  } catch (error) {
    console.error("Agent Plan Error", error);
    throw error;
  }
};

export const generateFileContent = async (task: AgentTask, goal: string, allFiles: CodeFile[]): Promise<string> => {
  try {
    // We provide context of other files so imports/references work
    const fileContext = allFiles.map(f => `
    --- FILE: ${f.name} ---
    ${f.content.substring(0, 1000)}... (truncated)
    `).join('\n');

    const prompt = `
      You are an Autonomous Coding Engine.
      GLOBAL GOAL: ${goal}
      CURRENT TASK: ${task.type} file "${task.fileName}"
      TASK DESCRIPTION: ${task.description}

      CONTEXT OF OTHER FILES:
      ${fileContext}

      OUTPUT:
      Write the FULL, COMPLETE content for ${task.fileName}. 
      Do not use placeholders like "// ...rest of code". 
      Write production-ready code.
      If it is HTML, ensure it links to the CSS and JS files if they exist in the plan.
      
      Return ONLY the code content. No markdown backticks.
    `;

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });

    let cleanCode = response.text || "";
    // Strip markdown code blocks if present
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      if (lines.length >= 2) {
        // Remove first line (```xxx) and last line (```)
        cleanCode = lines.slice(1, -1).join('\n');
      }
    }
    return cleanCode;
  } catch (error) {
    console.error("Agent File Gen Error", error);
    throw error;
  }
};

// --- Planner Services ---

export const generateImplementationPlan = async (goal: string, code: string, language: string): Promise<PlanStep[]> => {
  try {
    const prompt = `
      You are an expert software engineer.
      GOAL: ${goal}
      FILE CONTEXT (${language}):
      \`\`\`${language}
      ${code}
      \`\`\`

      Create a step-by-step implementation plan to achieve the goal in this file.
      Return a JSON object with a "steps" array.
      Each step should have:
      - "id" (unique string)
      - "description" (concise instruction for what to change)
      - "status" (must be "pending")
    `;

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['pending'] },
                },
                required: ['id', 'description', 'status'],
              },
            },
          },
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.steps;
    }
    return [];
  } catch (error) {
    console.error("Plan Gen Error", error);
    throw error;
  }
};

export const applyModification = async (code: string, language: string, instruction: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert coding assistant.
      INSTRUCTION: ${instruction}
      
      ORIGINAL CODE (${language}):
      \`\`\`${language}
      ${code}
      \`\`\`

      Apply the instruction to the code.
      Return ONLY the full modified code.
      Do not include markdown backticks.
      Do not remove existing functionality unless asked.
    `;

    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
    });

    let cleanCode = response.text || "";
    // Strip markdown code blocks if present
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      if (lines.length >= 2) {
        cleanCode = lines.slice(1, -1).join('\n');
      }
    }
    return cleanCode;
  } catch (error) {
    console.error("Apply Mod Error", error);
    throw error;
  }
};
