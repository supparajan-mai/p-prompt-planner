// src/lib/aiServices.ts
export async function callOpenAI(prompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY; 
  if (!apiKey) return "ขออภัยจ๊ะ ไม่พบ API Key สำหรับ OpenAI";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือ 'พี่พร้อม' ผู้ช่วยส่วนตัวที่อบอุ่นและสุภาพ" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "พี่พร้อมประมวลผลขัดข้องจ๊ะ";
  }
}