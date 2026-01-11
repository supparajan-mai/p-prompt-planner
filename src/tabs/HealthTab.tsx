import React, { useEffect, useState } from 'react';
import { onValue, ref, remove as dbRemove, set } from "firebase/database";
import { Heart, Loader2, Trash2 } from "lucide-react";

// เรียกใช้ Firebase จากจุดเดียว
import { auth, rtdb as db } from "../lib/firebase";

const appId = 'p-prompt-planner';
const MOODS = [
  { id: 'happy', emoji: '😊', name: 'มีความสุข' },
  { id: 'calm', emoji: '🧘', name: 'ผ่อนคลาย' },
  { id: 'tired', emoji: '😴', name: 'เหนื่อยจ๊ะ' },
  { id: 'sad', emoji: '🥺', name: 'เศร้านิดๆ' }
];

export default function HealthTab() {
  const [story, setStory] = useState("");
  const [mood, setMood] = useState('happy');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const healthRef = ref(db, `artifacts/${appId}/users/${user.uid}/health`);
    return onValue(healthRef, (snapshot) => {
      const data = snapshot.val();
      setHistory(data ? Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt) : []);
    });
  }, [user]);

  const saveHealth = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!story.trim()) return;
    setLoading(true);
    const id = Date.now().toString();
    await set(ref(db, `artifacts/${appId}/users/${user.uid}/health/${id}`), {
      id,
      story,
      mood,
      createdAt: Date.now()
    });
    setStory("");
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="text-left">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">ดูแลใจ</h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">เล่าความรู้สึกให้พี่พร้อมฟังนะจ๊ะ</p>
      </div>

      <div className="bg-white border-2 border-rose-50 rounded-[3rem] p-10 shadow-sm">
        <div className="flex justify-between mb-8">
          {MOODS.map(m => (
            <button key={m.id} onClick={() => setMood(m.id)} className={`flex flex-col items-center gap-2 transition-all ${mood === m.id ? 'scale-110' : 'opacity-40 grayscale'}`}>
              <span className="text-4xl">{m.emoji}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase">{m.name}</span>
            </button>
          ))}
        </div>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="วันนี้เป็นยังไงบ้างจ๊ะ..." className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 text-sm outline-none focus:ring-2 focus:ring-rose-100 shadow-inner min-h-[150px] font-medium" />
        <button onClick={saveHealth} disabled={loading} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.2rem] mt-6 flex items-center justify-center gap-3 active:scale-95 transition-all">
          {loading ? <Loader2 className="animate-spin" /> : <><Heart size={18} /> บันทึกจ๊ะ</>}
        </button>
      </div>

      <div className="space-y-4">
        {history.map((h: any) => (
          <div key={h.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm relative group text-left">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{MOODS.find(m => m.id === h.mood)?.emoji}</span>
              <button onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/health/${h.id}`))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{h.story}"</p>
            <p className="text-[9px] font-black text-slate-300 uppercase mt-4">{new Date(h.createdAt).toLocaleDateString('th-TH')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}