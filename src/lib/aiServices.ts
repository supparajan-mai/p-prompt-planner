// src/lib/aiServices.ts
/**
 * เรียก OpenAI ผ่าน Netlify Function (ปลอดภัย - ไม่มี API Key ใน Frontend)
 */
 export async function callOpenAI(prompt: string) {
  try {
    const response = await fetch('/.netlify/functions/openai', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Function call failed');
    }
    
    const data = await response.json();
    return data.message || "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  }
}
