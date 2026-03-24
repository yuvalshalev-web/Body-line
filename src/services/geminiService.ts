
import { GoogleGenAI } from "@google/genai";

const callProxy = async (service: string, data: any): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, data })
    });
    if (!response.ok) throw new Error("Proxy request failed");
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error(`AI Analysis (${service}) failed:`, error);
    return "שגיאה בחיבור לשירות ה-AI.";
  }
};

// Analyze image and provide a poetic caption using Gemini 3 Flash
export const analyzeImage = async (base64Image: string): Promise<string> => {
  return callProxy("analyzeImage", { base64Image });
};

// Generate a professional bio using Gemini 3 Flash
export const generateBio = async (name: string, role: string, currentBio?: string): Promise<string> => {
  return callProxy("generateBio", { name, role, currentBio });
};

// Get personalized shaper consultation based on surfer data
export const getShaperConsultation = async (data: {
  weight: number;
  height: number;
  level: string;
  fitness: string;
  currentBoard?: { volume?: number; length?: string };
  recommendedBoard: { volume: number; length: string; type: string };
}): Promise<string> => {
  return callProxy("getShaperConsultation", data);
};

// Get personalized coach analysis based on surfer performance
export const getCoachAnalysis = async (data: {
  name: string;
  rank: string;
  totalSessions: number;
  streak: number;
  sessionsToNextRank: number;
}): Promise<string> => {
  return callProxy("getCoachAnalysis", data);
};

// Get personalized forecast analysis based on weather data
export const getForecastAnalysis = async (data: {
  waveHeight: number;
  waterTemp?: number;
  windSpeed?: number;
  windDir?: string;
  swellDir?: string;
  period?: number;
}): Promise<string> => {
  return callProxy("getForecastAnalysis", data);
};
