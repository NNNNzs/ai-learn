import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(import.meta.dirname, '../../.env');


dotenv.config({
  path: envPath,
});

export const createOpenAI = () => new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY,
  baseURL: process.env.SILICONFLOW_BASE_URL,
});

export const defaultModel = process.env.SILICONFLOW_FREE_DEEPSEEK as string;
export const QWEN_MODEL = process.env.SILICONFLOW_FREE_QWEN as string;



export const createOpenRouter = () => {
  return new OpenAI({
    apiKey: process.env.OPEN_ROUTER_API_KEY,
    baseURL: process.env.OPEN_ROUTER_BASE_URL,
  });
}
export const OPEN_ROUTER_CLAUDE3_5_MODEL = process.env.OPEN_ROUTER_CLAUDE as string;