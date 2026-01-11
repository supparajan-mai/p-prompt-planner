// src/lib/aiServices.ts
export async function callOpenAI(prompt: string) {
  // ดึงค่าจาก Secret ที่ตั้งไว้ใน Netlify หรือ .env
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY; 
  
  if (!apiKey) return "ไม่พบ API Key จ๊ะ";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
}