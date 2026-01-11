import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from "firebase/database";
import { auth, rtdb as db } from "../lib/firebase";
import { callOpenAI } from "../lib/aiServices";
import { Wallet, PieChart, BrainCircuit, Loader2, Zap } from "lucide-react";

const appId = 'p-prompt-planner';

export default function FinanceTab() {
  const [incomes, setIncomes] = useState([]);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const incomeRef = ref(db, `artifacts/${appId}/users/${user.uid}/incomes`);
    return onValue(incomeRef, (s) => setIncomes(s.val() ? Object.values(s.val()) : []));
  }, [user]);

  const totalIncome = useMemo(() => incomes.reduce((s, i: any) => s + (Number(i.amount) || 0), 0), [incomes]);

  const handleAiFinance = async () => {
    setIsProcessing(true);
    const res = await callOpenAI(`ฉันมีรายได้รวม ฿${totalIncome} ช่วยแนะนำสัดส่วนการออมและการใช้จ่ายที่ยั่งยืนให้หน่อยจ๊ะ ขอ 3 ข้อสั้นๆ`);
    setAiAdvice(res);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 flex items-center gap-2"><PieChart size={14}/> รายได้รวมของคุณ</p>
          <h2 className="text-4xl font-black mb-8 italic">฿{totalIncome.toLocaleString()}</h2>
          <button onClick={handleAiFinance} disabled={isProcessing} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-3 shadow-xl active:scale-95 transition-all">
             {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16}/>} วิเคราะห์โดยพี่พร้อม
          </button>
        </div>
      </div>

      {aiAdvice && (
        <div className="bg-white border-2 border-indigo-100 rounded-[3rem] p-8 shadow-lg border-l-8 border-l-indigo-600">
           <div className="flex items-center gap-2 mb-4 text-indigo-600"><Zap size={18} fill="currentColor"/><p className="text-[11px] font-black uppercase italic">กลยุทธ์จากพี่พร้อม</p></div>
           <p className="text-sm text-slate-600 leading-relaxed font-bold italic whitespace-pre-wrap">{aiAdvice}</p>
        </div>
      )}
    </div>
  );
}