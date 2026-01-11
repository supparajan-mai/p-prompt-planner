import React, { useState, useEffect, useMemo } from 'react';
import { 
  getDatabase, ref, set, onValue, remove as dbRemove 
} from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  PiggyBank, Wallet, Banknote, Receipt, Plus, Trash2, Loader2, 
  Check, AlertTriangle, ShieldCheck, BrainCircuit, Lightbulb, 
  Zap, PieChart, Coins, TrendingUp, X, Calculator, ArrowRight
} from "lucide-react";

// --- 1. การตั้งค่า Firebase ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "p-prompt.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://p-prompt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "p-prompt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "p-prompt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "566289872852",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:566289872852:web:4ea11ccbe1c619fded0841"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus] = useState('เพื่อนผู้มีพระคุณ');
  const [notification, setNotification] = useState(null);
  const [dbError, setDbError] = useState(null);

  // ข้อมูลการเงิน
  const [incomes, setIncomes] = useState([]);
  const [financeGoals, setFinanceGoals] = useState([]);
  const [debtItems, setDebtItems] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  
  // สถานะ AI และ UI
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [financeAiPlan, setFinanceAiPlan] = useState(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showFixedModal, setShowFixedModal] = useState(false);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // การจัดการสิทธิ์ (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Failure", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  // ดึงข้อมูล (Rule 1 & 2)
  useEffect(() => {
    if (!user) return;
    const pPath = `artifacts/${appId}/users/${user.uid}`;
    const hErr = (e) => { if (e.code === 'PERMISSION_DENIED') setDbError("การเชื่อมต่อข้อมูลขัดข้องจ๊ะ"); };

    const unsubs = [
      onValue(ref(db, `${pPath}/incomes`), (s) => setIncomes(s.val() ? Object.values(s.val()) : []), hErr),
      onValue(ref(db, `${pPath}/finance_goals`), (s) => setFinanceGoals(s.val() ? Object.values(s.val()) : []), hErr),
      onValue(ref(db, `${pPath}/debt_items`), (s) => setDebtItems(s.val() ? Object.values(s.val()) : []), hErr),
      onValue(ref(db, `${pPath}/fixed_expenses`), (s) => setFixedExpenses(s.val() ? Object.values(s.val()) : []), hErr)
    ];
    return () => unsubs.forEach(un => un());
  }, [user]);

  // คำนวณรายได้/รายจ่าย
  const totalRegularIncome = useMemo(() => incomes.filter(i => i.type === 'regular').reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalSpecialIncome = useMemo(() => incomes.filter(i => i.type === 'special').reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalMonthlyDebtPay = useMemo(() => debtItems.reduce((s, i) => s + (Number(i.monthlyPay) || 0), 0), [debtItems]);

  // AI Strategic Advice
  const handleFinanceAi = (type, data) => {
    setIsAiProcessing(true);
    setFinanceAiPlan(null);

    setTimeout(() => {
      let plan = [];
      const surplus = totalRegularIncome - totalMonthlyDebtPay;

      if (type === 'summary') {
        plan = [
          `สถานะกระแสเงินสด: รายได้ประจำ ฿${totalRegularIncome.toLocaleString()} หักภาระหนี้ ฿${totalMonthlyDebtPay.toLocaleString()} จ๊ะ`,
          `เงินคงเหลือสุทธิ: ฿${surplus.toLocaleString()} (ประมาณ ${((surplus/totalRegularIncome)*100).toFixed(0)}% ของรายได้)`,
          `กลยุทธ์พี่พร้อม: แนะนำให้นำรายได้พิเศษ ฿${totalSpecialIncome.toLocaleString()} ไปออมเพื่อเป้าหมาย 70% และปิดหนี้ดอกเบี้ยสูง 30% จ๊ะ`
        ];
      } else if (type === 'debt') {
        plan = [
          `หนี้ "${data.name}" ดอกเบี้ย ${data.interest}% แนะนำให้ใช้รายได้พิเศษมาโปะก้อนนี้ก่อนเป็นอันดับแรกจ๊ะ`,
          `หากเจ๊เพิ่มเงินโปะอีกเดือนละ ฿1,000 จะช่วยลดระยะเวลาผ่อนลงได้ถึง 3 เดือน และเซฟดอกเบี้ยได้หลักพันเลยนะจ๊ะ`
        ];
      } else if (type === 'fixed') {
        const monthlyReserve = data.amount / 12;
        plan = [
          `รายการ "${data.name}" ยอด ฿${data.amount.toLocaleString()} ต้องจ่ายเดือน${data.month}จ๊ะ`,
          `เพื่อความอุ่นใจ: พี่พร้อมแนะให้เริ่มหักเงินสำรองจากรายได้ประจำเดือนละ ฿${Math.ceil(monthlyReserve).toLocaleString()} บาท แยกลงบัญชีออมไว้เลยจ๊ะ`
        ];
      } else if (type === 'goal') {
        const monthlySaving = data.amount / data.months;
        plan = [
          `เป้าหมาย "${data.name}" ยอด ฿${data.amount.toLocaleString()} ในอีก ${data.months} เดือนข้างหน้า`,
          `ต้องออมเดือนละ ฿${Math.ceil(monthlySaving).toLocaleString()} บาทจ๊ะ... พี่พร้อมแนะ: ลองลดค่ากาแฟวันละ 1 แก้ว จะช่วยให้ถึงเป้าหมายไวขึ้น 2 เดือนเลยนะ!`
        ];
      }

      setFinanceAiPlan({ id: data ? data.id : 'summary', plan });
      setIsAiProcessing(false);
      notify("พี่พร้อมวิเคราะห์แผนการเงินเสร็จแล้วจ๊ะ");
    }, 1800);
  };

  const handleSave = async (coll, data, close) => {
    if (!user) return;
    const id = Date.now().toString();
    try {
        await set(ref(db, `artifacts/${appId}/users/${user.uid}/${coll}/${id}`), { ...data, id });
        close();
        notify("บันทึกเรียบร้อยแล้วจ๊ะ");
    } catch (e) { notify("บันทึกไม่สำเร็จจ๊ะ", "error"); }
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("ลบรายการนี้ใช่ไหมจ๊ะ?")) {
        await dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/${coll}/${id}`));
        notify("ลบรายการแล้วจ๊ะ");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-36 overflow-y-auto">
      {/* ส่วนหัวหน้าต่างที่ปรับขนาดตามจอ */}
      <header className="bg-white px-4 sm:px-8 pt-12 pb-8 rounded-b-[3.5rem] shadow-sm border-b border-slate-100 mb-8 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800">วางแผนการเงิน</h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Strategic Financial Advisor</p>
          </div>
          <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] sm:text-xs font-bold border border-indigo-100 flex items-center gap-2 shadow-sm shrink-0">
            <ShieldCheck size={14} /> {userStatus}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        {/* สรุปสถานะการเงินภาพรวม (Dashboard) */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 text-left">
                <div className="flex items-center gap-2 mb-4 opacity-60"><PieChart size={16}/> <span className="text-[10px] font-bold uppercase tracking-[0.2em]">สถานะเงินสด</span></div>
                <h2 className="text-2xl sm:text-4xl font-black mb-8 italic">รายได้รวม ฿{(totalRegularIncome + totalSpecialIncome).toLocaleString()}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-inner">
                        <p className="text-[10px] opacity-60 font-black uppercase mb-1">รายได้ประจำ/เดือน</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-400">฿{totalRegularIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/10 shadow-inner">
                        <p className="text-[10px] opacity-60 font-black uppercase mb-1">รายได้พิเศษ (เงินก้อน)</p>
                        <p className="text-xl sm:text-2xl font-black text-amber-400">฿{totalSpecialIncome.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setShowIncomeModal(true)} className="px-6 py-3.5 bg-white text-indigo-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">เพิ่มรายได้</button>
                    <button onClick={() => handleFinanceAi('summary', null)} className="px-6 py-3.5 bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all border border-indigo-400 flex items-center gap-2">
                         {isAiProcessing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16}/>} พี่พร้อมวิเคราะห์ภาพรวม
                    </button>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/10 rounded-full -mr-40 -mt-40 blur-3xl transition-all group-hover:bg-indigo-400/20"></div>
        </div>

        {/* AI Strategic Plan Display */}
        {financeAiPlan && financeAiPlan.id === 'summary' && (
            <div className="p-8 bg-white border-2 border-indigo-100 rounded-[3rem] animate-in zoom-in duration-500 shadow-2xl border-l-8 border-l-indigo-600 text-left">
                <div className="flex items-center gap-3 mb-6 text-indigo-600"><Zap size={24} fill="currentColor"/><p className="text-[11px] font-black uppercase tracking-[0.2em] italic">กลยุทธ์จากพี่พร้อม</p></div>
                <ul className="space-y-6">
                    {financeAiPlan.plan.map((p, i) => (
                        <li key={i} className="flex gap-4 items-start"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 shadow-sm"/><p className="text-sm text-slate-600 leading-relaxed font-bold italic">{p}</p></li>
                    ))}
                </ul>
                <button onClick={() => setFinanceAiPlan(null)} className="w-full text-[10px] text-slate-300 font-black mt-8 hover:text-indigo-600 uppercase tracking-widest text-center transition-colors">พับคำแนะนำ</button>
            </div>
        )}

        {/* ระบบบริหารจัดการย่อย 3 ส่วน */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. ออมเงิน */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4"><h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><PiggyBank className="text-emerald-600" size={22}/> เป้าหมายออม</h3><button onClick={() => setShowGoalModal(true)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors active:scale-90"><Plus size={20}/></button></div>
                <div className="space-y-4">
                    {financeGoals.map(goal => (
                        <div key={goal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-100 transition-all text-left">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-slate-800 leading-tight">{goal.name}</h4>
                                <button onClick={()=>handleDelete('finance_goals', goal.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                            </div>
                            <p className="text-[11px] text-emerald-600 font-bold mb-5 italic">฿{goal.amount?.toLocaleString()} (ใช้เวลา {goal.months} เดือน)</p>
                            <button onClick={() => handleFinanceAi('goal', goal)} className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-100"><Lightbulb size={14}/> ปรึกษาแผนออม</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. จัดการหนี้สิน */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4"><h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Banknote className="text-amber-600" size={22}/> จัดการหนี้</h3><button onClick={() => setShowDebtModal(true)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors active:scale-90"><Plus size={20}/></button></div>
                <div className="space-y-4">
                    {debtItems.map(debt => (
                        <div key={debt.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-amber-100 transition-all text-left">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-slate-800 leading-tight">{debt.name}</h4>
                                <button onClick={()=>handleDelete('debt_items', debt.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                            </div>
                            <p className="text-[11px] text-amber-600 font-bold mb-5 italic">ยอด: ฿{debt.amount?.toLocaleString()} (ดอกเบี้ย {debt.interest}%)</p>
                            <button onClick={() => handleFinanceAi('debt', debt)} className="w-full bg-amber-50 text-amber-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-100"><BrainCircuit size={14}/> วางแผนปิดหนี้</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. รายจ่ายรายปี */}
            <section className="space-y-6">
                <div className="flex justify-between items-center px-4"><h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><Receipt className="text-blue-600" size={22}/> รายจ่ายรายปี</h3><button onClick={() => setShowFixedModal(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90"><Plus size={20}/></button></div>
                <div className="space-y-4">
                    {fixedExpenses.map(exp => (
                        <div key={exp.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-100 transition-all text-left">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-black text-slate-800 leading-tight">{exp.name}</h4>
                                <button onClick={()=>handleDelete('fixed_expenses', exp.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                            </div>
                            <p className="text-[11px] text-blue-600 font-bold mb-5 italic">จ่าย ฿{exp.amount?.toLocaleString()} (กำหนด {exp.month})</p>
                            <button onClick={() => handleFinanceAi('fixed', exp)} className="w-full bg-blue-50 text-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-100"><Calculator size={14}/> คำนวณเงินสำรอง</button>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        {/* AI Strategic Plan for Items */}
        {financeAiPlan && financeAiPlan.id !== 'summary' && (
            <div className="p-8 bg-slate-50 border-2 border-dashed border-indigo-200 rounded-[3rem] animate-in slide-in-from-top duration-500 shadow-lg text-left">
                <div className="flex items-center gap-3 mb-6 text-indigo-600"><Lightbulb size={24} fill="currentColor"/><p className="text-[11px] font-black uppercase tracking-[0.2em] italic">พี่พร้อมเสนอแนวทางให้จ๊ะ</p></div>
                <ul className="space-y-5">
                    {financeAiPlan.plan.map((p, i) => (
                        <li key={i} className="flex gap-4 items-start"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shadow-sm shrink-0"/><p className="text-sm text-slate-700 leading-relaxed font-bold">{p}</p></li>
                    ))}
                </ul>
                <button onClick={() => setFinanceAiPlan(null)} className="w-full text-[10px] text-slate-400 font-black mt-10 hover:text-indigo-600 uppercase tracking-widest text-center transition-colors">รับทราบจ๊ะ</button>
            </div>
        )}
      </main>

      {/* --- MODALS (ปรับขนาดแบบ Responsive) --- */}
      
      {/* 1. Modal: เพิ่มรายได้ */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 sm:p-12 relative animate-in zoom-in shadow-2xl text-left max-h-[90vh] overflow-y-auto font-sans">
            <button onClick={() => setShowIncomeModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-indigo-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-indigo-200 decoration-8 text-left font-serif">บันทึกรายได้</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('incomes', { name: fd.get('name'), amount: Number(fd.get('amount')), type: fd.get('type'), createdAt: Date.now() }, () => setShowIncomeModal(false));
            }} className="space-y-8 text-left">
                <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest">ชื่อรายการรายได้</label><input name="name" required placeholder="เช่น เงินเดือน, ปันผล..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner font-bold" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest text-left">จำนวนเงิน (บาท)</label><input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-sm font-black outline-none shadow-inner" /></div>
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-widest text-left">ประเภทรายได้</label>
                        <select name="type" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-sm font-black shadow-inner outline-none">
                            <option value="regular">รายได้ประจำ</option>
                            <option value="special">รายได้พิเศษ (เงินก้อน)</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-indigo-950 active:scale-95 transition-all mt-4 shadow-indigo-900/40">ยืนยันบันทึกรายได้</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: ออมเงิน */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-950/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 sm:p-12 relative animate-in zoom-in shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowGoalModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-emerald-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-emerald-200 decoration-8 text-left font-serif">เป้าหมายออมเงิน</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('finance_goals', { name: fd.get('name'), amount: Number(fd.get('amount')), months: Number(fd.get('months')), createdAt: Date.now() }, () => setShowGoalModal(false));
            }} className="space-y-8">
                <input name="name" required placeholder="สิ่งที่อยากออมเพื่อ..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm focus:ring-2 focus:ring-emerald-100 outline-none shadow-inner font-bold" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase">ราคา (บาท)</label><input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase">กี่เดือนจะใช้เงิน</label><input name="months" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                </div>
                <button type="submit" className="w-full bg-emerald-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-emerald-950 active:scale-95 transition-all mt-4 shadow-emerald-900/40">ตั้งเป้าหมายจ๊ะ</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: หนี้สิน */}
      {showDebtModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-amber-950/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 sm:p-12 relative animate-in zoom-in shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowDebtModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-amber-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-amber-200 decoration-8 text-left font-serif">รายการหนี้สิน</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('debt_items', { name: fd.get('name'), amount: Number(fd.get('amount')), interest: Number(fd.get('interest')), monthlyPay: Number(fd.get('monthlyPay')) }, () => setShowDebtModal(false));
            }} className="space-y-6">
                <input name="name" required placeholder="ชื่อหนี้ (เช่น บัตรเครดิต, รถ)..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm outline-none shadow-inner font-bold" />
                <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4">ยอดคงเหลือ (บาท)</label><input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4">ดอกเบี้ย (%)</label><input name="interest" type="number" step="0.1" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4">ผ่อนต่อเดือน</label><input name="monthlyPay" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                </div>
                <button type="submit" className="w-full bg-amber-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-amber-950 active:scale-95 mt-4 shadow-amber-900/40">บันทึกรายการหนี้</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: รายจ่ายรายปี */}
      {showFixedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-blue-950/80 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 sm:p-12 relative animate-in zoom-in shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowFixedModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-blue-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-blue-200 decoration-8 text-left font-serif">รายจ่ายประจำปี</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('fixed_expenses', { name: fd.get('name'), amount: Number(fd.get('amount')), month: fd.get('month') }, () => setShowFixedModal(false));
            }} className="space-y-8">
                <input name="name" required placeholder="ชื่อรายการ (เช่น ประกันรถ, ภาษี)..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm outline-none shadow-inner font-bold" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase">ยอดรวมรายปี (บาท)</label><input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div>
                    <div className="space-y-2 text-left"><label className="text-[11px] font-black text-slate-400 ml-4 uppercase text-left">เดือนที่จ่าย</label>
                        <select name="month" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black shadow-inner outline-none">
                            {['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map(m=><option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full bg-blue-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-blue-950 active:scale-95 mt-4 shadow-blue-900/40">บันทึกรายจ่ายรายปี</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}