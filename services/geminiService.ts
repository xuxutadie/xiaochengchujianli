import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types";

// Initialize the Gemini client using the environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || '';
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const genAI = (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') ? new GoogleGenAI({ apiKey }) : null;

export const polishContent = async (text: string, section: string, instruction?: string): Promise<string> => {
  if (!text && !instruction) return text;
  
  // If backend is configured, use it to protect API key
  if (backendUrl) {
    try {
      const normalizedBackendUrl = backendUrl.replace(/\/$/, '');
      const response = await fetch(`${normalizedBackendUrl}/api/ai/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, section, instruction })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) return data.text;
        console.warn("Backend AI polish returned error:", data.message);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Backend AI polish request failed:", response.status, errorData.message || '');
      }
    } catch (error) {
      console.error("Backend AI polish connection failed:", error);
    }
  }

  // Fallback to client-side Gemini if backend fails or not configured
  if (genAI && apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = instruction 
        ? `角色: 资深教育专家。任务: 根据指令 "${instruction}" 修改 "${section}" 内容。当前内容: "${text}"。仅返回处理后的文本。`
        : `角色: 资深教育专家。任务: 润色 "${section}" 内容。原文: "${text}"。仅返回处理后的文本。`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim() || text;
    } catch (error) {
      console.error("Client-side AI polish failed:", error);
      return text;
    }
  }

  console.warn("AI Service Unavailable: Neither Backend URL nor Gemini API Key is valid.");
  return text;
};

export const generateIllustration = async (description: string, styleContext: string): Promise<string | null> => {
  if (!genAI || !apiKey || apiKey === 'PLACEHOLDER_API_KEY') return null;
  try {
    const prompt = `Illustration for resume cover. ${description}. Context: ${styleContext}. No text, high quality, abstract or symbolic, suitable for a 12 year old student resume.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Note: Gemini 1.5 Flash doesn't generate images directly via generateContent.
    // This is a placeholder for image generation logic or multi-modal output if supported.
    // For real image generation, one would typically use Imagen or DALL-E.
    // Given the context, we'll return null or log the limitation.
    console.warn("Gemini 1.5 Flash does not support direct image generation in this SDK version.");
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const generateClosingMessage = async (data: ResumeData): Promise<string> => {
  // If backend is configured, use it to protect API key
  if (backendUrl) {
    try {
      const normalizedBackendUrl = backendUrl.replace(/\/$/, '');
      const response = await fetch(`${normalizedBackendUrl}/api/ai/polish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: `姓名: ${data.basicInfo.name || ''}
学校: ${data.basicInfo.school || ''}
奖项: ${data.awards?.map(a => a.name).join(', ') || ''}
兴趣爱好: ${data.hobbies?.content || ''}
自我介绍: ${data.coverLetter || ''}
社会实践: ${data.socialPractice?.content || ''}`,
          section: '自荐信' 
        })
      });
      
      if (response.ok) {
        const resData = await response.json();
        if (resData.success) return resData.text;
      }
    } catch (error) {
      console.error("Backend AI closing message failed, falling back to client-side:", error);
    }
  }

  if (!genAI || !apiKey || apiKey === 'PLACEHOLDER_API_KEY') return "";
  try {
    const prompt = `
      角色: 你是一位资深的小升初教育专家。
      任务: 为学生 ${data.basicInfo.name} 撰写一封完整的小升初自荐信。
      内容依据: 
      - 姓名: ${data.basicInfo.name || ''}
      - 学校: ${data.basicInfo.school || ''}
      - 获奖情况: ${data.awards?.map(a => a.name).join(', ') || ''}
      - 兴趣爱好: ${data.hobbies?.content || ''}
      - 自我介绍: ${data.coverLetter || ''}
      - 社会实践: ${data.socialPractice?.content || ''}
      排版要求 (必须严格执行):
      1. 第一行: 顶格书写“尊敬的贵校老师：”。
      2. 第二行: 空行。
      3. 第三段起: 开始正文，正文必须分为三段，每段不少于 80 字。
      4. 正文每段之间必须使用两个换行符 (\\n\\n) 分隔。
      5. 总字数控制在 320 字左右 (不少于 300 字)。
      6. 正文结束后空一行。
      7. 最后两行书写落款 (学生：${data.basicInfo.name} \\n 日期：${new Date().toLocaleDateString()})。
      8. 仅返回润色后的正文，不要有任何其他解释性文字。
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim() || "";
  } catch (error) {
    console.error("Closing message generation failed:", error);
    return "";
  }
};