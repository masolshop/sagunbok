/**
 * AI 호출 헬퍼 (외부 크롤러용)
 * aiController.js의 callAI를 재사용
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function callAI(modelType, apiKey, systemPrompt, userPrompt, maxTokens = 2000) {
  if (modelType === 'gpt') {
    return await callGPT(apiKey, systemPrompt, userPrompt, maxTokens);
  } else if (modelType.startsWith('gemini')) {
    return await callGemini(apiKey, systemPrompt, userPrompt, modelType);
  } else {
    throw new Error(`Unsupported model type: ${modelType}`);
  }
}

async function callGPT(apiKey, systemPrompt, userPrompt, maxTokens) {
  const client = new OpenAI({ apiKey });
  
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  });
  
  return response.choices[0].message.content.trim();
}

async function callGemini(apiKey, systemPrompt, userPrompt, modelType) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7
    }
  });
  
  const prompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  
  return response.text().trim();
}
