import * as React from "react";
import { LayoutGrid, StickyNote, Wallet, Heart } from "lucide-react";

type Props = {
  tab: string;
  setTab: (t: string) => void;
};

const NavItem = ({ active, label, icon, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all ${active ? "text-indigo-600" : "text-slate-400"}`}>
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-indigo-50" : "bg-transparent"}`}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default function BottomNav({ tab, setTab }: Props) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/90 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] px-6 py-3 z-[100] flex justify-between items-center">
      <NavItem active={tab === "work"} label="งาน" icon={<LayoutGrid size={20}/>} onClick={() => setTab("work")} />
      <NavItem active={tab === "memo"} label="โน้ต" icon={<StickyNote size={20}/>} onClick={() => setTab("memo")} />
      <NavItem active={tab === "finance"} label="เงิน" icon={<Wallet size={20}/>} onClick={() => setTab("finance")} />
      <NavItem active={tab === "health"} label="ใจ" icon={<Heart size={20}/>} onClick={() => setTab("health")} />
    </nav>
  );
}