import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "REPLACE_WITH_YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in the app settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const stripBase64Prefix = (base64: string) => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// Analyze image and provide a poetic caption using Gemini Flash
export const analyzeImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: stripBase64Prefix(base64Image) } },
          { text: "Analyze this image and provide a one-sentence, poetic caption for a community photo gallery." }
        ]
      }]
    });

    return response.text || "A beautiful moment captured and shared.";
  } catch (error: any) {
    console.error("AI Analysis (analyzeImage) failed:", error);
    return `שגיאה בניתוח התמונה: ${error.message || 'שגיאה לא ידועה'}`;
  }
};

// Generate a professional bio using Gemini Flash
export const generateBio = async (name: string, role: string, currentBio?: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Rewrite the following community member's bio to be more professional, engaging, and concise. 
    Name: ${name}
    Role: ${role}
    ${currentBio ? `Current Bio: ${currentBio}` : ''}
    Return only the rewritten bio text, one single sentence.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "Dedicated community member contributing to our shared goals.";
  } catch (error: any) {
    console.error("AI Analysis (generateBio) failed:", error);
    return "שגיאה ביצירת הביוגרפיה.";
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
    const ai = getAI();
    const prompt = `You are an expert surfboard shaper with 30 years of experience. 
    Provide a professional, encouraging, and highly technical (yet accessible) consultation for a surfer with the following data:
    - Weight: ${data.weight}kg
    - Height: ${data.height}cm
    - Surfing Level: ${data.level}
    - Fitness Level: ${data.fitness}
    ${data.currentBoard ? `- Current Board: ${data.currentBoard.volume}L, ${data.currentBoard.length}` : ''}
    - Recommended Board: ${data.recommendedBoard.volume}L, ${data.recommendedBoard.length} ${data.recommendedBoard.type}
    
    Keep the tone like a cool, experienced shaper in a dusty workshop.
    Return the response in Hebrew, formatted with markdown (bullet points, bold text).
    Maximum 4-5 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "הגלשן המומלץ ייתן לך את הציפה והיציבות הדרושים להתקדמות מהירה במים.";
  } catch (error: any) {
    console.error("AI Analysis (getShaperConsultation) failed:", error);
    return "שגיאה בקבלת ייעוץ שייפר.";
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
    const ai = getAI();
    const prompt = `You are a legendary surfing coach with a focus on community and persistence.
    Provide a short, powerful, and motivational analysis for a surfer with the following stats:
    - Name: ${data.name}
    - Rank: ${data.rank}
    - Total Sessions: ${data.totalSessions}
    - Current Streak: ${data.streak}
    - Progress: ${data.sessionsToNextRank} sessions until next rank
    
    Keep the tone very encouraging, slightly mystical (about the ocean), and professional.
    Return the response in Hebrew, formatted with markdown (bold text).
    Maximum 3-4 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "המשך להתמיד, הים מעריך את המאמץ שלך.";
  } catch (error: any) {
    console.error("AI Analysis (getCoachAnalysis) failed:", error);
    return "שגיאה בקבלת ניתוח מאמן.";
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
  user?: any;
}): Promise<string> => {
  try {
    const ai = getAI();
    let prompt = `You are a local surf guru who knows every sandbar and reef.
    Analyze the following surf forecast and provide a short, expert advice for today:
    - Wave Height: ${data.waveHeight}m
    ${data.waterTemp ? `- Water Temp: ${data.waterTemp}°C` : ''}
    ${data.windSpeed ? `- Wind: ${data.windSpeed}kts ${data.windDir || ''}` : ''}
    ${data.swellDir ? `- Swell Direction: ${data.swellDir}` : ''}
    ${data.period ? `- Period: ${data.period}s` : ''}`;

    if (data.user) {
      prompt += `
      - User Profile: Weight: ${data.user.weight || '?'}kg, Height: ${data.user.height || '?'}cm, Level: ${data.user.surfingLevel || 'Beginner'}.
      IMPORTANT: Our system's daily dashboard calculates exact boards based on ${data.waveHeight}m height and their level.
      If Wave Height is less than 0.2m: UI recommends SUP (סאפ) - Stand Up Paddleboard for ALL levels, because it's flat.
      If User is Beginner in small waves (>=0.2m): UI recommends Softboard 8'0+ (approx 80-100L).
      If User is Intermediate in small waves (>=0.2m): UI recommends Longboard / Mini-mal.
      If User is Advanced in small waves (>=0.2m): UI recommends Fish / Groveler.
      When you suggest a board, DO NOT contradict this logic. Match the board recommendation identically to their Level and Wave Height. Use the exact Hebrew terms: סופטבורד מתחילים, פאן בורד, שורטבורד, פיש, לונגבורד קלאסי, או סאפ (SUP).
      `;
    }

    prompt += `
    Keep the tone like a salty local surfer who's seen it all but is friendly.
    Return the response in Hebrew, formatted with markdown (bold text).
    Maximum 4 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "הים נראה טוב היום, צא למים ותהנה.";
  } catch (error: any) {
    console.error("AI Analysis (getForecastAnalysis) failed:", error);
    return "שגיאה בניתוח התחזית.";
  }
};

// Verify license document using Gemini
export const verifyLicense = async (base64Image: string): Promise<any> => {
  try {
    const ai = getAI();
    const prompt = `Act as a Document Verification Expert. Your task is to analyze an uploaded image of any sports license or certification (Diving, Surfing, Paragliding, etc.) and extract ALL relevant data for a community management app.

### TASK:
1. Identify the type of document.
2. Extract the Holder's Name.
3. Extract the Issuing Organization.
4. Extract the Certification Number or License ID.
5. Extract the Expiration Date (if present).
6. Extract the Rank, Level, and Professional Titles.
7. Extract the Issue Date, School Info, and Instructor details.
8. Extract ALL OTHER details found on the card (e.g., medical notes, special endorsements, club affiliations) into a metadata map.
9. Determine if the document appears to be valid and authentic.

### DATA TO EXTRACT:
- "full_name": Holder's full name.
- "type": "Diving", "Surfing", "Sailing", "Skydiving", "Climbing", or "Other".
- "organization": Issuing body.
- "license_id": Certification number.
- "expiration_date": YYYY-MM-DD or null.
- "rank": Professional rank or title.
- "level": Proficiency level.
- "issue_date": When the card was issued.
- "school_number": ID of the training facility.
- "instructor": Name or ID of the instructor.
- "is_valid": true/false based on the expiration check.
- "metadata": A detailed flat key-value object containing EVERY OTHER piece of text data found on the card. For Diving licenses, prioritize: Date of Birth, Nationality, Specialized certs (Nitrox, Deep, etc.), Blood type, and Medical dates.
- "confidence_score": numeric value of confidence (0-1).

### OUTPUT FORMAT:
Return ONLY a raw JSON object. Do not include conversational text or markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: stripBase64Prefix(base64Image) } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Diving", "Surfing", "Sailing", "Skydiving", "Climbing", "Other"] },
            organization: { type: Type.STRING },
            license_id: { type: Type.STRING },
            expiration_date: { type: Type.STRING },
            rank: { type: Type.STRING },
            level: { type: Type.STRING },
            issue_date: { type: Type.STRING },
            school_number: { type: Type.STRING },
            instructor: { type: Type.STRING },
            is_valid: { type: Type.BOOLEAN },
            confidence_score: { type: Type.NUMBER },
            metadata: { 
              type: Type.OBJECT,
              properties: {
                // Since Gemini doesn't always handle dynamic keys in schema well, 
                // we'll keep it as a general object and rely on the AI's understanding
              }
            }
          },
          required: ["full_name", "type", "organization", "license_id", "is_valid"]
        }
      }
    });

    const result = response.text || "{}";
    return JSON.parse(result);
  } catch (error: any) {
    console.error("AI Analysis (verifyLicense) failed:", error);
    if (error.message?.includes('API key not valid') || error.message?.includes('unauthorized')) {
      return { error: "מפתח ה-API של Gemini אינו תקין או שאינו מורשה. אנא וודא שהגדרת את GEMINI_API_KEY כראוי בהגדרות היישום." };
    }
    return { error: error.message || "Failed to process document" };
  }
};
