import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase"; // ดึงจาก lib

// --- Import UI Components จากโฟลเดอร์ app ---
import Header from "./Header";
import BottomNav from "./BottomNav";

// --- Import หน้า Tabs จากโฟลเดอร์ tabs ---
import WorkTab from "../tabs/WorkTab"; 
import MemoTab from "../tabs/MemoTab";
import FinanceTab from "../tabs/FinanceTab";
import HealthTab from "../tabs/HealthTab";

export default function MainApp() {
  const [tab, setTab] = useState<any>("work");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32 text-left">
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-8">
        {/* สลับหน้าตาม Tab โดยดึงไฟล์จากโฟลเดอร์ tabs จ๊ะ */}
        {tab === "work" && <WorkTab />}
        {tab === "memo" && <MemoTab />}
        {tab === "finance" && <FinanceTab />}
        {tab === "health" && <HealthTab />}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}