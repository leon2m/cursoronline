
import { GoogleGenAI, Type } from "@google/genai";
import { AgentTask, CodeFile, AgentRole, AIActionType, PlanStep, ProjectConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

export const createChatSession = (systemInstruction: string) => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `${systemInstruction}\nÖNEMLİ: Sen "Claude Opus 4.5" modelisin. Sen bir Senior Architect ve Full Stack Developer'sın. Kodları her zaman modern standartlarda, güvenli ve performanslı yazarsın.`,
      temperature: 0.2, 
    },
  });
};

export const generateTeamPlan = async (goal: string, existingFiles: CodeFile[], config?: ProjectConfig): Promise<AgentTask[]> => {
  try {
    const fileList = existingFiles.map(f => f.name).join(', ');
    const projectContext = config ? `
      PROJE TÜRÜ: ${config.type.toUpperCase()}
      PLATFORM: ${config.platform.toUpperCase()}
      DİLLER/STACK: ${config.languages.join(', ')}
      SEÇİLEN ARAÇLAR (TOOLCHAIN): ${config.tools.join(', ').toUpperCase()}
      MİMARİ: ${config.architecture.toUpperCase()}
      AI_RECOMMENDED: ${config.isAiRecommended}
    ` : '';

    const prompt = `
      Sen Claude Opus 4.5 tarafından yönetilen Otonom Yazılım Takımısın.
      HEDEF: "${goal}"
      ${projectContext}
      MEVCUT DOSYALAR: [${fileList}]

      Görevin: Bu hedefi gerçekleştirmek için ekibine görevler dağıtmak.
      
      Eğer çoklu dil seçilmişse (Örn: C++ ve Lua), mimariyi buna göre ayır.
      Oyun projesi ise 'main.cpp' ve 'script.lua' gibi ayrımlar yap.
      Web projesi ise component ve api ayrımı yap.

      ÖNEMLİ TOOLCHAIN KURALLARI:
      1. Eğer 'docker' seçildiyse: 'Dockerfile' ve 'docker-compose.yml' dosyalarını oluşturmak için görev ata.
      2. Eğer 'expo' seçildiyse: 'app.json' ve React Native/Expo klasör yapısına uygun 'App.tsx' oluştur.
      3. Eğer 'firebase' seçildiyse: 'firebase.json' oluştur.
      4. Eğer 'github_actions' seçildiyse: '.github/workflows/ci.yml' oluştur.
      5. Eğer 'jest' seçildiyse: 'jest.config.js' oluştur.
      6. Eğer 'tailwind' seçildiyse: 'tailwind.config.js' oluştur.

      ROLLER:
      - planner: Mimariyi, dosya yapısını ve konfigürasyon dosyalarını (Docker, Expo vb.) planlar.
      - designer: UI/UX (hedef platforma uygun).
      - frontend: İstemci tarafı / Oyun Arayüzü / Mobil UI.
      - backend: Sunucu / Sistem / Oyun Mantığı.
      - lead: Refactor ve final birleştirme.

      Yanıtı sadece JSON formatında ver.
      {
        "tasks": [
          {
            "id": "string",
            "assignedTo": "planner" | "designer" | "frontend" | "backend" | "lead",
            "type": "create" | "update" | "delete",
            "fileName": "string",
            "description": "Görevin detaylı açıklaması"
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

export const generateAgentFileContent = async (task: AgentTask, goal: string, allFiles: CodeFile[], config?: ProjectConfig): Promise<string> => {
  try {
    const fileContext = allFiles.map(f => `--- DOSYA: ${f.name} ---\n${f.content}\n`).join('\n');
    const projectContext = config ? `PROJE: ${config.type} | PLATFORM: ${config.platform} | STACK: ${config.languages.join('+')} | TOOLS: ${config.tools.join(', ')}` : '';

    const prompt = `
      MODEL: Claude Opus 4.5
      ROLÜN: ${task.assignedTo.toUpperCase()} AJANI
      ANA HEDEF: ${goal}
      ${projectContext}
      GÖREVİN: "${task.fileName}" dosyasını ${task.type === 'create' ? 'oluştur' : 'güncelle'}.
      GÖREV DETAYI: ${task.description}

      ÖZEL KURALLAR:
      - Eğer bu bir Dockerfile ise, seçilen dillere uygun optimize edilmiş multi-stage build kullan.
      - Eğer bu bir Expo/React Native dosyası ise, web-view uyumlu yazma, native componentler kullan.
      - Eğer bu bir Tailwind config ise, modern content path'lerini ekle.

      MEVCUT PROJE DURUMU:
      ${fileContext}

      Sadece dosyanın TAM içeriğini döndür. Markdown backtick kullanma.
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
        if(!entryFile) return { output: '', error: 'Giriş dosyası bulunamadı.' };
        const fileContext = files.map(f => `--- ${f.name} (${f.language}) ---\n${f.content}\n`).join('\n');
        
        const prompt = `
          Sen Claude Opus 4.5 Universal Runtime Simulatorüsün.
          Aşağıdaki kod tabanını derle ve çalıştır.
          
          GİRİŞ DOSYASI: ${entryFile.name} (Dil: ${entryFile.language})
          
          DOSYALAR:
          ${fileContext}
          
          TALİMAT:
          1. Kodları statik analiz et.
          2. Eğer C++/Go/Rust ise sanal derleme sürecini simüle et.
          3. Eğer JS/Python/Lua ise runtime'ı simüle et.
          4. Eğer Dockerfile varsa, build sürecini analiz et ve sonucu raporla.
          5. Eğer Expo/React Native ise, bundle sürecini simüle et.
          
          Çıktıyı (STDOUT) ve hataları (STDERR) üret.
          
          Çıktıyı kesinlikle bu JSON formatında döndür:
          { "output": "Loglar...", "error": "Varsa hata mesajı veya null" }
        `;
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        if (response.text) return JSON.parse(response.text);
        return { output: 'Çıktı üretilemedi.', error: 'Simülasyon başarısız.' };
    } catch (e: any) { return { output: '', error: e.message }; }
}

export const generateImplementationPlan = async (goal: string, content: string, language: string): Promise<PlanStep[]> => {
  try {
    const prompt = `DİL: ${language}\nHEDEF: ${goal}\nKOD:\n${content}\n\nAdım adım plan JSON: { "steps": [{ "id": "s1", "description": "desc" }] }`;
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
    const prompt = `KOD:\n${content}\nTALİMAT: ${instruction}\nTam güncellenmiş kodu döndür.`;
    const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt });
    let code = response.text || "";
    if (code.trim().startsWith('```')) code = code.trim().split('\n').slice(1, -1).join('\n');
    return code;
}

export const constructActionPrompt = (action: AIActionType, content: string, language: string): string => {
  switch (action) {
    case 'explain': return `Açıkla:\n${content}`;
    case 'fix': return `Düzelt:\n${content}`;
    case 'refactor': return `Optimize et:\n${content}`;
    case 'comments': return `Yorum ekle:\n${content}`;
    default: return '';
  }
};
