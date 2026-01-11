import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from "firebase/database";
import { auth, rtdb as db } from "../lib/firebase"; // ดึงจากศูนย์กลาง
import { callOpenAI } from "../lib/aiServices"; // ใช้ OpenAI แทน Gemini
import Modal from "../components/Modal";
import Input from "../components/Input";
import { BrainCircuit, Plus, Loader2, Trash2, Briefcase, Zap, X } from "lucide-react";

const appId = 'p-prompt-planner';

export default function WorkTab() {
  const [tasks, setTasks] = useState([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const tasksRef = ref(db, `artifacts/${appId}/users/${user.uid}/tasks`);
    return onValue(tasksRef, (s) => setTasks(s.val() ? Object.values(s.val()) : []));
  }, [user]);

  const handleAiSort = async () => {
    setIsAiProcessing(true);
    const prompt = `ช่วยจัดลำดับความสำคัญของงานเหล่านี้: ${tasks.map(t => t.title).join(", ")} โดยเรียงจากงานที่ควรทำก่อนไปหลัง พร้อมเหตุผลสั้นๆ แบบพี่พร้อมจ๊ะ`;
    const result = await callOpenAI(prompt);
    alert(result || "พี่พร้อมคิดไม่ออกจ๊ะ ลองใหม่อีกทีนะ");
    setIsAiProcessing(false);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-20">
      <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><BrainCircuit size={20} className="text-amber-400" /> แผนงานจ๊ะ</h2>
          <p className="text-[10px] opacity-60">ให้พี่พร้อมช่วยเรียงลำดับความสำคัญให้นะจ๊ะ</p>
        </div>
        <button onClick={handleAiSort} disabled={isAiProcessing} className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">
          {isAiProcessing ? <Loader2 className="animate-spin" /> : "เรียงงาน"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((t: any) => (
          <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Briefcase size={20}/></div>
              <h3 className="text-sm font-black text-slate-800">{t.title}</h3>
            </div>
            <button onClick={() => remove(ref(db, `artifacts/${appId}/users/${user?.uid}/tasks/${t.id}`))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-28 right-8 w-14 h-14 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl active:scale-90 transition-all z-40 border-4 border-white"><Plus size={28}/></button>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="เพิ่มงานใหม่จ๊ะ">
        <form className="space-y-4 p-4" onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const id = Date.now().toString();
          await set(ref(db, `artifacts/${appId}/users/${user?.uid}/tasks/${id}`), { id, title: fd.get('title'), createdAt: Date.now() });
          setIsModalOpen(false);
        }}>
          <Input name="title" label="หัวข้องาน" placeholder="ทำอะไรดีจ๊ะ..." required />
          <button type="submit" className="w-full bg-indigo-900 text-white py-4 rounded-2xl font-black shadow-lg">บันทึกแผนจ๊ะ</button>
        </form>
      </Modal>
    </div>
  );
}