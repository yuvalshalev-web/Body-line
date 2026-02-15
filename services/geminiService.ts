
import { GoogleGenAI } from "@google/genai";

// Analyze image and provide a poetic caption using Gemini 3 Flash
export const analyzeImage = async (base64Image: string): Promise<string> => {
  try {
    // Initialize GoogleGenAI right before making an API call to ensure latest config
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
