import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from "firebase/database";
import { Banknote, BrainCircuit, Loader2, PieChart, Zap } from "lucide-react";

// เรียกใช้ Firebase จากจุดเดียว
import { auth, rtdb as db } from "../lib/firebase";
// เรียกใช้ OpenAI
import { callOpenAI } from "../lib/aiServices";
const appId = 'p-prompt-planner';

export default function FinanceTab() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [debtItems, setDebtItems] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const pPath = `artifacts/${appId}/users/${user.uid}`;
    onValue(ref(db, `${pPath}/incomes`), (s) => setIncomes(s.val() ? Object.values(s.val()) : []));
    onValue(ref(db, `${pPath}/debt_items`), (s) => setDebtItems(s.val() ? Object.values(s.val()) : []));
    onValue(ref(db, `${pPath}/fixed_expenses`), (s) => setFixedExpenses(s.val() ? Object.values(s.val()) : []));
  }, [user]);

  const totalIncome = useMemo(() => incomes.reduce((s, i: any) => s + (Number(i.amount) || 0), 0), [incomes]);
  const totalDebt = useMemo(() => debtItems.reduce((s, i: any) => s + (Number(i.monthlyPay) || 0), 0), [debtItems]);

  const handleAiFinance = async () => {
    setIsAiProcessing(true);
    const prompt = `รายได้รวม ฿${totalIncome}, ภาระหนี้เดือนละ ฿${totalDebt}. ช่วยวิเคราะห์และให้กลยุทธ์การเงิน 3 ข้อสั้นๆ แบบพี่พร้อมจ๊ะ`;
    const res = await callOpenAI(prompt); // เรียกใช้ OpenAI
    setAiAdvice(res);
    setIsAiProcessing(false);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2"><PieChart size={14}/> สถานะเงินรวม</p>
          <h2 className="text-4xl font-black mb-10 italic tracking-tighter">฿{totalIncome.toLocaleString()}</h2>
          <button onClick={handleAiFinance} disabled={isAiProcessing} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
             {isAiProcessing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16}/>} ปรึกษาพี่พร้อมจ๊ะ
          </button>
        </div>
      </div>

      {aiAdvice && (
        <div className="bg-white border-2 border-indigo-100 rounded-[3rem] p-8 shadow-xl text-left relative overflow-hidden">
           <div className="flex items-center gap-3 mb-4 text-indigo-600"><Zap size={20} fill="currentColor"/><p className="text-[11px] font-black uppercase italic">กลยุทธ์จากพี่พร้อม</p></div>
           <p className="text-sm text-slate-600 leading-relaxed font-bold italic whitespace-pre-wrap">{aiAdvice}</p>
           <button onClick={()=>setAiAdvice(null)} className="w-full text-[10px] text-slate-300 font-black mt-6 uppercase text-center">ปิดคำแนะนำ</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
             <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2"><Banknote size={18} className="text-emerald-500"/> รายได้</h3>
             {incomes.map((i: any) => (
               <div key={i.id} className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                 <span className="text-xs font-bold text-slate-600">{i.name}</span>
                 <span className="text-xs font-black text-emerald-600">฿{i.amount.toLocaleString()}</span>
               </div>
             ))}
          </section>
          {/* ส่วนหนี้สินและรายจ่ายประจำปีทำงานในรูปแบบเดียวกันจ๊ะ */}
      </div>
    </div>
  );
}