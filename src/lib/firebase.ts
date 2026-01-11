export async function callOpenAI(prompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return "ไม่พบคีย์ AI จ๊ะ";

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
          { role: "system", content: "คุณคือพี่พร้อม ผู้ช่วยที่อบอุ่น" },
          { role: "user", content: prompt }
        ]
      })
    });
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    return "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  }
}