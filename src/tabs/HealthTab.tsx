import React, { useState, useEffect } from 'react';
import { ref, set, onValue, remove } from "firebase/database";
import { auth, rtdb as db } from "../lib/firebase";
import { callOpenAI } from "../lib/aiServices";
import { Heart, MessageCircle, History, Sparkles, Loader2, Trash2 } from "lucide-react";

const appId = 'p-prompt-planner';

export default function HealthTab() {
  const [story, setStory] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const healthRef = ref(db, `artifacts/${appId}/users/${user.uid}/health`);
    return onValue(healthRef, (s) => setEntries(s.val() ? Object.values(s.val()).sort((a:any, b:any) => b.createdAt - a.createdAt) : []));
  }, [user]);

  const handleSave = async () => {
    if (!story.trim()) return;
    setLoading(true);
    const aiRes = await callOpenAI(`ผู้ใช้งานเล่าว่า: "${story}" ช่วยให้กำลังใจเขาแบบอบอุ่นในฐานะพี่พร้อมจ๊ะ`);
    const id = Date.now().toString();
    await set(ref(db, `artifacts/${appId}/users/${user?.uid}/health/${id}`), {
      id, story, aiResponse: aiRes, createdAt: Date.now(), date: new Date().toLocaleDateString('th-TH')
    });
    setStory("");
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-20">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><MessageCircle className="text-rose-500" /> วันนี้เป็นยังไงบ้างจ๊ะ?</h2>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="เล่าให้พี่พร้อมฟังนะ..." className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 text-sm outline-none focus:ring-2 focus:ring-rose-100 min-h-[150px] font-medium" />
        <button onClick={handleSave} disabled={loading || !story.trim()} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.2rem] mt-6 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
          {loading ? <Loader2 className="animate-spin" /> : "บันทึกเรื่องราววันนี้จ๊ะ"}
        </button>
      </div>

      <div className="space-y-6 px-2">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2 italic"><History size={20} className="text-slate-400"/> บันทึกที่ผ่านมา</h3>
        {entries.map((entry: any) => (
          <div key={entry.id} className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm group relative">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-300">{entry.date}</p>
              <button onClick={() => remove(ref(db, `artifacts/${appId}/users/${user?.uid}/health/${entry.id}`))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
            </div>
            <p className="text-sm text-slate-700 font-bold mb-6 italic">"{entry.story}"</p>
            {entry.aiResponse && (
              <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-dashed border-indigo-100">
                <div className="flex items-center gap-2 mb-2 text-indigo-600"><Sparkles size={14}/><p className="text-[10px] font-black uppercase italic">พี่พร้อมดูแลใจจ๊ะ...</p></div>
                <p className="text-xs text-slate-600 leading-relaxed italic">{entry.aiResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}