import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = "AIzaSyCPqHo1826m6o-8tEeizAIbd2UYEsHmUrE";

if (!API_KEY) {
  console.warn("CRITICAL: API_KEY environment variable (process.env.API_KEY) is not set. Gemini API calls will fail. Ensure the environment is configured correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const modelName = 'gemini-2.5-flash-preview-04-17';

export const analyzeTextWithGemini = async (prompt: string): Promise<string> => { // expectJson parameter removed
  if (!API_KEY) {
    throw new Error("A chave API do Google Gemini não está configurada. Verifique as variáveis de ambiente (process.env.API_KEY).");
  }
  try {
    // Config for JSON response removed
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        // config property removed as it was only for JSON
    });
    
    const text = response.text; // Directly access text

    if (text) {
      // JSON parsing logic removed
      return text;
    } else {
      console.error("Gemini API response did not contain text. Full response:", response);
      if (response?.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
        throw new Error(`A API Gemini retornou uma resposta incompleta ou com erro. Motivo: ${response.candidates[0].finishReason}. Verifique os detalhes da resposta nos logs do console.`);
      }
      throw new Error("A resposta da API não continha texto. Verifique os logs para detalhes.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('api key not valid') || 
            error.message.toLowerCase().includes('permission denied') ||
            error.message.toLowerCase().includes('authentication')) {
            throw new Error("Falha na autenticação com a API Gemini. Verifique se a API Key é válida e tem as permissões necessárias.");
        }
        if (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('limit')) {
            throw new Error("Limite de cota da API Gemini excedido. Tente novamente mais tarde ou verifique seu plano.");
        }
        // Removed specific JSON parsing error as we don't expect JSON here anymore
        if (error.message.includes("API_KEY")) { 
             throw error;
        }
    }
    throw new Error(`Erro ao comunicar com a API Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
};
