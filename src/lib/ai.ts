
import "dotenv/config";
import OpenAI from "openai";

// Initialize OpenAI Client (Configured for Groq)
const getClient = () => {
  // Use GROQ_API_KEY preferentially, fall back to OPENAI_API_KEY if specific one missing
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Error: API Key (GROQ or OPENAI) is missing.");
    return null;
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.groq.com/openai/v1", // Point to Groq
  });
};

const MODEL = "llama-3.1-8b-instant"; // Fast, Free, High Quality Llama 3.1 on Groq

async function safeGenerate(systemPrompt: string, userPrompt: string): Promise<string> {
  const openai = getClient();
  if (!openai) return "AI Configuration Error: Missing API Key.";

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: MODEL,
    });

    return completion.choices[0].message.content || "No response generated.";
  } catch (error: any) {
    console.error("AI Provider Error:", error);

    // Check for common errors
    if (error.status === 401) {
      return "AI Error: Invalid API Key. Please check your Groq API Key.";
    }
    if (error.status === 429) {
      return "AI Error: Rate limit exceeded. Please try again in a moment.";
    }

    return `AI Unavailable: ${error.message || "Unknown error"}`;
  }
}

// --- Exported Functions (Same Interface) ---

export async function generateSummary(text: string) {
  const system = "You are an expert educational assistant. Summarize the provided content in exactly 4 concise bullet points. Each bullet should start with a '*'. Ensure the summary is complete and not truncated. Make it engaging for a student.";
  return await safeGenerate(system, text);
}

export async function explainTopic(topic: string, context: string) {
  const system = "You are a helpful tutor. Explain the concept to a college student simply and clearly. Use an analogy if helpful.";
  const prompt = `Topic: "${topic}"\nContext: ${context}`;
  return await safeGenerate(system, prompt);
}

export async function getDoubtAnalysis(doubt: string, context: string) {
  const system = "Analyze the student's doubt and suggest a quick 1-sentence hint.";
  const prompt = `Doubt: "${doubt}"\nContext: "${context}"`;
  return await safeGenerate(system, prompt);
}

export async function chatWithAI(query: string, context: string) {
  const system = `You are Max, a helpful AI study companion.
  Context provided: "${context || 'General Chat'}"
  
  Instructions: 
  1. If the Context is useful for the Question, use it.
  2. If the Context is empty or irrelevant, answer using your general knowledge.
  3. Be concise, friendly, and encouraging.`;

  return await safeGenerate(system, query);
}

export async function generateQuizQuestions(topic: string, count: number = 5, difficulty: string = "Medium") {
  const system = `You are a quiz generator. Generate a ${difficulty} difficulty quiz on the topic "${topic}" with ${count} questions.
  Return STRICTLY a JSON array associated with the quiz. Do not include markdown formatting (like \`\`\`json).
  
  Each question object in the array must have:
  - text: string (The question)
  - type: "MCQ"
  - options: string[] (Array of 4 options)
  - correctOption: number (0-3 index)
  - explanation: string (Brief explanation)
  
  Example format:
  [
    {
      "text": "What is 2+2?",
      "type": "MCQ",
      "options": ["3", "4", "5", "6"],
      "correctOption": 1,
      "explanation": "2 plus 2 equals 4."
    }
  ]`;

  const result = await safeGenerate(system, "Generate the quiz now.");
  // Clean up potential markdown formatting if the model disobeys
  let cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();

  // Try to find the array if there's extra text
  const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleanJson = arrayMatch[0];
  }

  return cleanJson;
}

export async function generateFlashcards(text: string) {
  const system = `You are a revision expert. Create 5 high-yield flashcards from the provided text for quick revision.
  Return STRICTLY a JSON array. Each object must have:
  - front: string (The concept or question)
  - back: string (The answer or definition)
  
  Example:
  [
    {"front": "Mitochondria", "back": "Powerhouse of the cell"},
    {"front": "F=ma", "back": "Newton's Second Law"}
  ]`;

  const prompt = `Text to summarize: "${text.substring(0, 3000)}"`; // Limit context window
  const result = await safeGenerate(system, prompt);
  return result.replace(/```json/g, '').replace(/```/g, '').trim();
}
