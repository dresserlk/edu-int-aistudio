import { GoogleGenAI } from "@google/genai";

export const GeminiService = {
  async getInsights(data: any) {
    if (!process.env.API_KEY) {
        return "API Key not configured. Unable to fetch AI insights.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Act as an educational institute consultant. Analyze the following JSON data representing our school's current state.
      Data: ${JSON.stringify(data)}
      
      Provide a brief, bulleted report (Markdown format) covering:
      1. Revenue Analysis (Projected vs Actual).
      2. Student Attendance trends (identify low attendance).
      3. Teacher Performance (based on class sizes/popularity).
      4. One specific recommendation for improvement.

      Keep it concise and professional.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Failed to generate insights. Please try again later.";
    }
  }
};