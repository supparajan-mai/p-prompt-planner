import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body || '{}');
  const apiKey = process.env.OPENAI_API_KEY; // ไม่ต้องมี VITE_ prefix

  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API Key not configured' }) 
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'คุณคือพี่พร้อม ผู้ช่วยที่อบอุ่น' },
          { role: 'user', content: prompt }
        ]
      })
    });

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: result.choices[0].message.content 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API Error' })
    };
  }
};