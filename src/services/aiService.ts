import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const isAiEnabled = !!GEMINI_API_KEY && GEMINI_API_KEY !== 'undefined' && !GEMINI_API_KEY.includes('MY_GEMINI_API_KEY');

const ai = isAiEnabled ? new GoogleGenAI({ apiKey: GEMINI_API_KEY! }) : null;

export async function generateNoteMetadata(content: string): Promise<{ title: string; tags: string[] }> {
  if (!isAiEnabled || !ai || !content || content.length < 10) return { title: 'New Note', tags: [] };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following note content and provide a concise title (max 5-6 words) and 1-3 relevant one-word tags.
      
      Content:
      "${content}"
      
      Return as JSON:
      {
        "title": "the title",
        "tags": ["tag1", "tag2"]
      }`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || '{}');
    return {
      title: result.title || 'Untitled Note',
      tags: result.tags || [],
    };
  } catch (error) {
    console.error("AI Error:", error);
    return { title: 'Untitled Note', tags: [] };
  }
}

export async function summarizeNote(content: string): Promise<string> {
  if (!content) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this note in 1 or 2 clear sentences:
      
      "${content}"`,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("AI Error:", error);
    return "";
  }
}
