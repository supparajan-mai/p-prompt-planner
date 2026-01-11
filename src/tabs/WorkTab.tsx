import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref, remove as dbRemove, set, update } from "firebase/database";
import { Plus, CheckCircle, Trash2, X } from "lucide-react";

// เรียกใช้ Firebase จากจุดเดียว
import { auth, rtdb as db } from "../lib/firebase";
const appId = 'p-prompt-planner';

export default function WorkTab() {
  type Task = {
    id: string;
    title?: string;
    description?: string;
    budget?: number;
    quarters?: string[];
    status?: 'pending' | 'completed';
    createdAt?: number;
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const tasksRef = ref(db, `artifacts/${appId}/users/${user.uid}/tasks`);
    return onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      setTasks(data ? Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt) : []);
    });
  }, [user]);

  const totalBudget = useMemo(
    () => tasks.reduce((sum, t) => sum + (Number(t.budget) || 0), 0),
    [tasks]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = Date.now().toString();
    const quarters = Array.from(fd.getAll('quarters'));
    
    await set(ref(db, `artifacts/${appId}/users/${user.uid}/tasks/${id}`), {
      id,
      title: fd.get('title'),
      description: fd.get('description'),
      budget: Number(fd.get('budget')) || 0,
      quarters,
      status: 'pending',
      createdAt: Date.now()
    });
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: Task['status']) => {
    update(ref(db, `artifacts/${appId}/users/${user.uid}/tasks/${id}`), {
      status: currentStatus === 'completed' ? 'pending' : 'completed'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-left">แผนงานจ๊ะ</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 text-left italic">งบรวม: {totalBudget.toLocaleString()} บาท</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-100 active:scale-90 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((t: any) => (
          <div key={t.id} className={`group bg-white border-2 ${t.status === 'completed' ? 'border-emerald-100' : 'border-slate-50'} rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center gap-6">
              <button onClick={() => toggleStatus(t.id, t.status)} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${t.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                {t.status === 'completed' ? <CheckCircle size={20} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
              </button>
              <div className="flex-1 text-left">
                <h3 className={`font-black text-sm ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</h3>
                <div className="flex gap-2 mt-2">
                   {t.quarters?.map(q => <span key={q} className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md uppercase">{q}</span>)}
                   <span className="text-[9px] font-bold text-slate-300 italic">| ฿{Number(t.budget).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/tasks/${t.id}`))} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-black text-slate-900">เพิ่มแผนงานจ๊ะ</h3>
                 <X onClick={() => setIsModalOpen(false)} className="text-slate-300 cursor-pointer" />
               </div>
               <input name="title" required placeholder="หัวข้อแผนงาน..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
               <input name="budget" type="number" placeholder="งบประมาณ..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
               <div className="grid grid-cols-4 gap-2">
                 {['Q1','Q2','Q3','Q4'].map(q => (
                   <label key={q} className="cursor-pointer">
                     <input type="checkbox" name="quarters" value={q} className="hidden peer" />
                     <div className="py-3 rounded-xl bg-slate-50 text-[10px] font-black text-center peer-checked:bg-indigo-600 peer-checked:text-white transition-all">{q}</div>
                   </label>
                 ))}
               </div>
               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg">บันทึกแผนจ๊ะ</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}