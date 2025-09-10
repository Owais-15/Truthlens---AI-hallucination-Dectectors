import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  factualityScore: number;
  issues: Array<{
    text: string;
    severity: 'low' | 'medium' | 'high';
    explanation: string;
    correction: string;
    startIndex: number;
    endIndex: number;
  }>;
  summary: string;
}

export async function analyzeContent(content: string): Promise<AnalysisResult> {
  try {
    const systemPrompt = `You are an expert fact-checker and AI content analyzer. 
    Analyze the given text for factual accuracy, hallucinations, and unverifiable claims.
    
    For each issue found, provide:
    1. The exact problematic text
    2. Severity level (low, medium, high)
    3. Explanation of why it's problematic
    4. Suggested correction
    5. Character positions (startIndex, endIndex)
    
    Also provide an overall factuality score from 0-100 and a summary.
    
    Respond with JSON in this exact format:
    {
      "factualityScore": number,
      "issues": [
        {
          "text": "exact problematic text",
          "severity": "low|medium|high",
          "explanation": "why this is problematic",
          "correction": "suggested correction",
          "startIndex": number,
          "endIndex": number
        }
      ],
      "summary": "overall analysis summary"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            factualityScore: { type: "number" },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  explanation: { type: "string" },
                  correction: { type: "string" },
                  startIndex: { type: "number" },
                  endIndex: { type: "number" }
                },
                required: ["text", "severity", "explanation", "correction", "startIndex", "endIndex"]
              }
            },
            summary: { type: "string" }
          },
          required: ["factualityScore", "issues", "summary"]
        },
      },
      contents: content,
    });

    const rawJson = response.text;
    if (rawJson) {
      const data: AnalysisResult = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error(`Failed to analyze content: ${error}`);
  }
}

export async function generateDetailedExplanation(
  flaggedText: string, 
  originalContext: string
): Promise<{
  explanation: string;
  correction: string;
  confidence: number;
}> {
  try {
    const prompt = `Provide a detailed explanation for why this text is problematic: "${flaggedText}"
    
    Context: "${originalContext}"
    
    Respond with JSON:
    {
      "explanation": "detailed explanation",
      "correction": "suggested correction", 
      "confidence": number (0-100)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            explanation: { type: "string" },
            correction: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["explanation", "correction", "confidence"]
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini explanation error:", error);
    throw new Error(`Failed to generate explanation: ${error}`);
  }
}
