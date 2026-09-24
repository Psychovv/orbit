import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const key = envFile.match(/GEMINI_API_KEY="([^"]+)"/)[1];

async function run() {
  const genAI = new GoogleGenerativeAI(key);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
  } catch (e) {
    console.error(e);
  }
}
run();
