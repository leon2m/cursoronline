
import { GoogleGenAI, Type } from "@google/genai";
import { AgentTask, CodeFile, AgentRole, AIActionType, PlanStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Rebranded as Claude Opus 4.5 contextually, though utilizing Gemini underneath for logic
const MODEL_NAME = 'gemini-3-pro-preview';

export const createChatSession = (systemInstruction: string) => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `${systemInstruction}\nÖNEMLİ: Sen "Claude Opus 4.5" modelisin. Dünyanın en gelişmiş, context-aware kodlama yapay zekasısın. Her zaman Türkçe yanıt ver. Kodları her zaman refactor ederek ve en optimize şekilde birleştirerek (consolidation) sun.`,
      temperature: 0.3, 
    },
  });
};

export const constructActionPrompt = (action: AIActionType, content: string, language: string): string => {
  switch (action) {
    case 'explain':
      return `Aşağıdaki ${language} kodunu Claude Opus 4.5 derinliğiyle açıklar mısın?\n\n\`\`\`${language}\n${content}\n\`\`\``;
    case 'fix':
      return `Aşağıdaki ${language} kodundaki hataları bul ve Claude Opus standartlarında düzelt.\n\n\`\`\`${language}\n${content}\n\`\`\``;
    case 'refactor':
      return `Aşağıdaki ${language} kodunu daha temiz, performanslı ve modern standartlara uygun şekilde refactor et.\n\n\`\`\`${language}\n${content}\n\`\`\``;
    case 'comments':
      return `Aşağıdaki ${language} koduna açıklayıcı yorum satırları ekle.\n\n\`\`\`${language}\n${content}\n\`\`\``;
    default:
      return '';
  }
};

export const generateTeamPlan = async (goal: string, existingFiles: CodeFile[]): Promise<AgentTask[]> => {
  try {
    const fileList = existingFiles.map(f => f.name).join(', ');
    const prompt = `
      Sen Claude Opus 4.5 tarafından yönetilen Otonom Yazılım Takımısın.
      HEDEF: "${goal}"
      MEVCUT DOSYALAR: [${fileList}]

      Görevin: Bu hedefi gerçekleştirmek için 5 kişilik ekibine (Planner, Designer, Frontend, Backend, Lead) görevler dağıtmak.
      
      ROLLER:
      - planner: Mimariyi ve dosya yapısını planlar.
      - designer: CSS, UI bileşenleri ve görsel tasarımı planlar.
      - frontend: React/HTML yapısını kurar.
      - backend: Mantıksal işlevleri ve veri yönetimini kurar.
      - lead: Kodları birleştirir (consolidation), refactor eder ve son halini verir.

      KURALLAR:
      1. Dosya sayısını az ve öz tut (consolidate). Gereksiz dosya oluşturma.
      2. Modern ve temiz kod (Clean Code) prensiplerini uygula.
      3. Yanıtı sadece JSON formatında ver.

      JSON şeması:
      {
        "tasks": [
          {
            "id": "string",
            "assignedTo": "planner" | "designer" | "frontend" | "backend" | "lead",
            "type": "create" | "update" | "delete",
            "fileName": "string",
            "description": "Görevin detaylı açıklaması (Türkçe)"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
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

export const generateAgentFileContent = async (task: AgentTask, goal: string, allFiles: CodeFile[]): Promise<string> => {
  try {
    const fileContext = allFiles.map(f => `--- DOSYA: ${f.name} ---\n${f.content}\n`).join('\n');

    const prompt = `
      MODEL: Claude Opus 4.5
      ROLÜN: ${task.assignedTo.toUpperCase()} AJANI
      ANA HEDEF: ${goal}
      GÖREVİN: "${task.fileName}" dosyasını ${task.type === 'create' ? 'oluştur' : 'güncelle'}.
      GÖREV DETAYI: ${task.description}

      EKİP KURALLARI:
      1. KOD KONSOLİDASYONU: Diğer dosyalardaki mantığı anla, tekrardan kaçın. Eğer bir özellik ekliyorsan, mevcut kodu bozmadan içine entegre et.
      2. REFACTOR: Yazdığın kodu en modern standartlara göre optimize et.
      3. DİL: Kod yorumlarını ve UI metinlerini Türkçe yap.

      MEVCUT PROJE DURUMU:
      ${fileContext}

      Sadece dosyanın TAM ve EKSİKSİZ içeriğini döndür. Markdown backtick kullanma.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    let cleanCode = response.text || "";
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      cleanCode = lines.slice(1, -1).join('\n');
    }
    return cleanCode;
  } catch (error) {
    console.error("Agent Content Error", error);
    throw error;
  }
};

export const generateImplementationPlan = async (goal: string, content: string, language: string): Promise<PlanStep[]> => {
  try {
    const prompt = `
      GÖREV: ${goal}
      MEVCUT KOD:
      \`\`\`${language}
      ${content}
      \`\`\`

      Bu hedefi gerçekleştirmek için adım adım bir uygulama planı oluştur.
      Yanıtı sadece JSON formatında ver.
      
      JSON şeması:
      {
        "steps": [
          {
            "id": "string",
            "description": "Adımın açıklaması (Türkçe)"
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return (parsed.steps || []).map((s: any) => ({ ...s, status: 'pending' }));
    }
    return [];
  } catch (error) {
    console.error("Implementation Plan Error", error);
    throw error;
  }
};

export const applyModification = async (content: string, language: string, instruction: string): Promise<string> => {
  try {
    const prompt = `
      MEVCUT KOD:
      \`\`\`${language}
      ${content}
      \`\`\`

      TALİMAT: ${instruction}

      Lütfen yukarıdaki kodu talimata göre güncelle. Sadece güncellenmiş kodun tamamını döndür. Markdown backtick kullanma.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    let cleanCode = response.text || "";
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      cleanCode = lines.slice(1, -1).join('\n');
    }
    return cleanCode;
  } catch (error) {
    console.error("Modification Error", error);
    throw error;
  }
};
