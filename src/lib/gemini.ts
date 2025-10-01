import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

export const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY!,
    model: "models/gemini-2.5-flash",
    temperature: 0,
    streaming: true,
  });

