import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types";

// Initialize the Gemini client using the environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey });

export const polishContent = async (text: string, section: string): Promise<string> => {
  if (!text || !apiKey) return text;
  
  const prompt = `
    角色: 你是一位资深的小升初教育专家和文案大师。
    任务: 润色学生简历中 "${section}" 部分的内容。
    目标: 语言要专业、自信、真诚，同时符合12岁学生的口吻。突出亮点，优化表达。
    限制: 仅返回润色后的文本，不要包含任何解释或引导语。语言为简体中文。
    原文: "${text}"
  `;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim() || text;
  } catch (error) {
    console.error("Polish content failed:", error);
    return text;
  }
};

export const generateIllustration = async (description: string, styleContext: string): Promise<string | null> => {
  if (!apiKey) return null;
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
  if (!apiKey) return "";
  try {
    const prompt = `
      Task: Write a short, inspiring closing message (1-2 sentences) for a 12-year-old student's resume (middle school application).
      Student Name: ${data.basicInfo.name}
      Highlights: ${data.awards.map(a => a.name).join(', ')}
      Personality/Hobbies: ${data.hobbies.content}
      
      Requirements: 
      - Language: Simplified Chinese.
      - Tone: Sincere, positive, forward-looking.
      - Output: ONLY the message text.
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