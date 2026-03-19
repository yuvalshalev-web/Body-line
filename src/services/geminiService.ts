
import { GoogleGenAI } from "@google/genai";

// Analyze image and provide a poetic caption using Gemini 3 Flash
export const analyzeImage = async (base64Image: string): Promise<string> => {
  try {
    // Initialize GoogleGenAI right before making an API call to ensure latest config
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          { text: "Analyze this image and provide a one-sentence, poetic caption for a community photo gallery." },
        ],
      },
    });

    // Directly access the text property as per guidelines
    return response.text || "A beautiful moment captured and shared.";
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Member shared a new photo.";
  }
};

// Generate a professional bio using Gemini 3 Flash
export const generateBio = async (name: string, role: string, currentBio?: string): Promise<string> => {
  try {
    // Initialize GoogleGenAI right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Rewrite the following community member's bio to be more professional, engaging, and concise. 
    Name: ${name}
    Role: ${role}
    Current Bio: ${currentBio || 'Member of our community.'}
    Return only the rewritten bio text, one single sentence.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the text property as per guidelines
    return response.text || "Dedicated community member contributing to our shared goals.";
  } catch (error) {
    console.error("Bio generation failed:", error);
    return currentBio || "Active community member.";
  }
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
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an expert surfboard shaper with 30 years of experience. 
    Provide a professional, encouraging, and highly technical (yet accessible) consultation for a surfer with the following data:
    - Weight: ${data.weight}kg
    - Height: ${data.height}cm
    - Surfing Level: ${data.level}
    - Fitness Level: ${data.fitness}
    ${data.currentBoard ? `- Current Board: ${data.currentBoard.volume}L, ${data.currentBoard.length}` : ''}
    - Recommended Board: ${data.recommendedBoard.volume}L, ${data.recommendedBoard.length} (${data.recommendedBoard.type})

    Explain WHY this board is recommended, what they should look for in rails, tail shape, and rocker. 
    If they have a current board, compare it to the recommendation.
    Keep the tone like a cool, experienced shaper in a dusty workshop.
    Return the response in Hebrew, formatted with markdown (bullet points, bold text).
    Maximum 4-5 sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "הגלשן המומלץ ייתן לך את הציפה והיציבות הדרושים להתקדמות מהירה במים.";
  } catch (error) {
    console.error("Shaper consultation failed:", error);
    return "שגיאה בחיבור לשייפר הדיגיטלי. נסה שנית מאוחר יותר.";
  }
};

// Get personalized coach analysis based on surfer performance
export const getCoachAnalysis = async (data: {
  name: string;
  rank: string;
  totalSessions: number;
  streak: number;
  sessionsToNextRank: number;
}): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a legendary surfing coach with a focus on community and persistence.
    Provide a short, powerful, and motivational analysis for a surfer with the following stats:
    - Name: ${data.name}
    - Rank: ${data.rank}
    - Total Sessions: ${data.totalSessions}
    - Current Streak: ${data.streak} weeks
    - Sessions to Next Rank: ${data.sessionsToNextRank}

    Acknowledge their progress, emphasize the importance of their streak, and give them a "mission" for their next session.
    Keep the tone very encouraging, slightly mystical (about the ocean), and professional.
    Return the response in Hebrew, formatted with markdown (bold text).
    Maximum 3-4 sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "המשך להתמיד, הים מעריך את המאמץ שלך.";
  } catch (error) {
    console.error("Coach analysis failed:", error);
    return "שגיאה בחיבור למאמן הדיגיטלי. הים מחכה לך בכל מקרה.";
  }
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
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a local surf guru who knows every sandbar and reef.
    Analyze the following surf forecast and provide a short, expert advice for today:
    - Wave Height: ${data.waveHeight}m
    - Water Temp: ${data.waterTemp}°C
    - Wind: ${data.windSpeed} knots from ${data.windDir}
    - Swell: ${data.swellDir} at ${data.period}s

    Tell the surfers what board to take, what wetsuit to wear, and what to expect from the conditions.
    Keep the tone like a salty local who's seen it all.
    Return the response in Hebrew, formatted with markdown (bold text).
    Maximum 3-4 sentences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "הים נראה טוב היום, צא למים ותהנה.";
  } catch (error) {
    console.error("Forecast analysis failed:", error);
    return "שגיאה בחיבור למומחה המקומי. הים מדבר בעד עצמו.";
  }
};
