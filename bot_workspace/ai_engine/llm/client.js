import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});

export const LLM_MODEL = process.env.LLM_MODEL_NAME || 'gpt-5-nano';
