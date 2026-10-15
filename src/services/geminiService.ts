import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "REPLACE_WITH_YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
      return null;
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

// Fallback bio generator when AI service is unavailable or credits are depleted
export const fallbackBioGenerator = (name: string, role: string, currentBio?: string): string => {
  const trimmed = currentBio?.trim();
  if (trimmed && trimmed.length > 5 && !trimmed.includes('שגיאה')) {
    return trimmed;
  }

  const cleanName = name?.trim() || 'חבר/ת קהילה';
  switch (role) {
    case 'Volunteer':
      return `${cleanName} - מתנדב/ת מסור/ה בעמותת חבל זוג, פעיל/ה בליווי חברים במים ובקידום רוח הנתינה וההעצמה בים.`;
    case 'Instructor':
      return `${cleanName} - מדריך/ת גלישה וספורט ימי מוסמך/ת בעמותת חבל זוג, מוביל/ה חברים בביטחון, מקצועיות ואהבת הים.`;
    case 'Admin':
      return `${cleanName} - רכז/ת מוביל/ה בעמותת חבל זוג, פועל/ת למען חיבורים משמעותיים, ניהול הפעילות והעצמת הקהילה.`;
    case 'Staff':
      return `${cleanName} - חבר/ת צוות עמותת חבל זוג, מחויב/ת לקידום חזון העמותה, ליווי הפעילות וחיזוק החוסן הקהילתי.`;
    case 'Support':
      return `${cleanName} - אפ-שייפר ומוביל/ת טכנולוגי/ת בקהילה, תורם/ת מניסיונו/ה המקצועי לקידום הפרויקט והחברים.`;
    case 'Member':
    default:
      return `${cleanName} - משתתף/ת פעיל/ה בקהילת חבל זוג, שואף/ת להתמיד, ללמוד ולהתפתח יחד על הגלים ובקהילה.`;
  }
};

// Analyze image and provide a poetic caption using Gemini Flash
export const analyzeImage = async (base64Image: string): Promise<string> => {
  try {
    const ai = getAI();
    if (!ai) {
      return "רגע מיוחד של חיבור, חברות ועוצמה במימי חבל זוג.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: stripBase64Prefix(base64Image) } },
          { text: "Analyze this image and provide a one-sentence, poetic Hebrew caption for a community surf photo gallery." }
        ]
      }]
    });

    return response.text?.trim() || "רגע מיוחד של חיבור, חברות ועוצמה במימי חבל זוג.";
  } catch (error: any) {
    console.warn("AI Analysis (analyzeImage) notice - using fallback caption:", error?.message || error);
    return "רגע מיוחד של חיבור, חברות ועוצמה במימי חבל זוג.";
  }
};

// Generate a professional bio using Gemini Flash
export const generateBio = async (name: string, role: string, currentBio?: string): Promise<string> => {
  try {
    const ai = getAI();
    if (!ai) {
      return fallbackBioGenerator(name, role, currentBio);
    }

    const prompt = `Rewrite the following community member's bio in Hebrew to be inspiring, professional, engaging, and concise (one single punchy sentence).
    Name: ${name}
    Role in Surfing Community: ${role}
    ${currentBio ? `Current Bio: ${currentBio}` : ''}
    Return only the rewritten bio text in Hebrew, one single sentence. No quotation marks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    const generated = response.text?.trim();
    if (generated && generated.length > 5 && !generated.toLowerCase().includes('error')) {
      return generated;
    }
    return fallbackBioGenerator(name, role, currentBio);
  } catch (error: any) {
    console.warn("AI Analysis (generateBio) notice - using tailored fallback bio:", error?.message || error);
    return fallbackBioGenerator(name, role, currentBio);
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
  const fallbackConsultation = `לפי נתוני הגוף והכושר שלך, הבחירה המיטבית עבורך היא גלשן **${data.recommendedBoard.type}** באורך **${data.recommendedBoard.length}** בנפח של **${data.recommendedBoard.volume} ליטר**. שילוב זה יבטיח לך כושר ציפה מעולה, תפיסת גלים קלה ותמרון מדויק במים.`;

  try {
    const ai = getAI();
    if (!ai) return fallbackConsultation;

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
      model: "gemini-3.8-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text?.trim() || fallbackConsultation;
  } catch (error: any) {
    console.warn("AI Analysis (getShaperConsultation) notice - using fallback:", error?.message || error);
    return fallbackConsultation;
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
  const fallbackCoach = `כל הכבוד **${data.name}**! עם **${data.totalSessions}** כניסות למים ורצף מרשים של **${data.streak}** סשנים, הים הפך לבית השני שלך. עוד **${data.sessionsToNextRank}** כניסות לדרגה הבאה — המשך להתמיד, הים תמיד מתגמל נוכחות והתמדה!`;

  try {
    const ai = getAI();
    if (!ai) return fallbackCoach;

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
      model: "gemini-3.8-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text?.trim() || fallbackCoach;
  } catch (error: any) {
    console.warn("AI Analysis (getCoachAnalysis) notice - using fallback:", error?.message || error);
    return fallbackCoach;
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
  beachName?: string;
}): Promise<string> => {
  const height = data.waveHeight;
  const spot = data.beachName || 'החוף';
  let fallbackForecast = '';
  if (height < 0.2) {
    fallbackForecast = `הים שטוח היום ב${spot} (${height} מ׳). מומלץ מאוד לצאת לאימון חתירה מרגיע על **סאפ (SUP)** לשמירה על כושר ומיקוד.`;
  } else if (height <= 0.6) {
    fallbackForecast = `תנאי ים רגועים ומזמינים ב${spot} בגובה של כ-**${height} מ׳**. גלים אידיאליים לאימון טכניקה על **סופטבורד** או **פאן בורד**.`;
  } else if (height <= 1.2) {
    fallbackForecast = `תנאים קלאסיים ומצוינים ב${spot}! גלים בגובה של כ-**${height} מ׳** עם פוטנציאל מעולה לגלישה זורמת ומהנה. צאו למים!`;
  } else {
    fallbackForecast = `ים עוצמתי ומאתגר ב${spot} בגובה **${height} מ׳**. מתאים לגולשים מנוסים המצוידים ב**שורטבורד**. הקפידו על כללי הבטיחות!`;
  }

  try {
    const ai = getAI();
    if (!ai) return fallbackForecast;

    let prompt = `You are a local surf guru who knows every sandbar and reef in Israel.
    Analyze the surf forecast for the following beach and provide a short, expert advice for today:
    ${data.beachName ? `- Beach Spot: ${data.beachName}` : ''}
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
    Maximum 3-4 sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text?.trim() || fallbackForecast;
  } catch (error: any) {
    console.warn("AI Analysis (getForecastAnalysis) notice - using fallback:", error?.message || error);
    return fallbackForecast;
  }
};

// Verify license document using Gemini
export const verifyLicense = async (base64Image: string): Promise<any> => {
  try {
    const ai = getAI();
    if (!ai) {
      return { error: "שירות פיענוח המסמכים האוטומטי אינו זמין כעת. באפשרותך למלא את פרטי התעודה ידנית." };
    }

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
- "metadata": A detailed flat key-value object containing EVERY OTHER piece of text data found on the card.
- "confidence_score": numeric value of confidence (0-1).

### OUTPUT FORMAT:
Return ONLY a raw JSON object. Do not include conversational text or markdown code blocks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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
              properties: {}
            }
          },
          required: ["full_name", "type", "organization", "license_id", "is_valid"]
        }
      }
    });

    const result = response.text || "{}";
    return JSON.parse(result);
  } catch (error: any) {
    console.warn("AI Analysis (verifyLicense) notice:", error?.message || error);
    return { error: "לא ניתן היה לפענח את התעודה אוטומטית כרגע. באפשרותך להזין את פרטי התעודה ידנית בטופס." };
  }
};
