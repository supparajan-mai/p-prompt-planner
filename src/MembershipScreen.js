import React, { useState, useEffect } from 'react';
import { ref, update, onValue } from "firebase/database";
import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, rtdb as db, storage } from "../lib/firebase"; // ดึงจาก lib
import { User, Coffee, ShieldCheck, Award, Check, Loader2, Camera, X, ChevronRight, Sparkles } from 'lucide-react';

const appId = 'p-prompt-planner';

export default function MembershipTab() {
  const [userData, setUserData] = useState({ status: 'เพื่อน', fullName: '-', coffeePoints: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `artifacts/${appId}/public/data/users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUserData(data);
      setLoading(false);
    });
  }, [user]);

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const fileRef = sRef(storage, `artifacts/${appId}/slips/${user.uid}_${Date.now()}.jpg`);
      const snap = await uploadBytes(fileRef, selectedFile);
      const url = await getDownloadURL(snap.ref);
      await update(ref(db, `artifacts/${appId}/public/data/users/${user.uid}`), {
        slipUrl: url,
        status: "รอตรวจสอบ"
      });
      alert("ส่งหลักฐานเรียบร้อยจ๊ะ!");
      setIsModalOpen(false);
    } catch (e) { alert("เกิดข้อผิดพลาดจ๊ะ"); } finally { setUploading(false); }
  };

  if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="bg-white p-10 rounded-b-[4rem] shadow-sm border-b border-slate-50 -mt-8 mx-[-24px] px-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">คุณ {userData.fullName}</h1>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase">{userData.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <Coffee className="mx-auto text-amber-500 mb-2" size={24} />
          <p className="text-[10px] font-black text-slate-400 uppercase">แต้มกาแฟ</p>
          <p className="text-xl font-black text-slate-800">{userData.coffeePoints}</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
          <ShieldCheck className="mx-auto text-emerald-500 mb-2" size={24} />
          <p className="text-[10px] font-black text-slate-400 uppercase">ความปลอดภัย</p>
          <p className="text-xl font-black text-slate-800">ยืนยันแล้ว</p>
        </div>
      </div>

      {userData.status !== 'เพื่อนผู้มีพระคุณ' && (
        <button onClick={() => setIsModalOpen(true)} className="w-full bg-slate-900 text-white p-6 rounded-[2.5rem] font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
          <Award size={20} className="text-amber-400" /> อัปเกรดเป็นเพื่อนผู้มีพระคุณ <ChevronRight size={18} />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-black text-slate-900 mb-6">ส่งหลักฐานการสนับสนุน</h3>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 transition-all">
              <Camera className="text-slate-300 mb-2" size={32} />
              <span className="text-xs font-bold text-slate-400">เลือกรูปสลิปจ๊ะ</span>
              <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0])} />
            </label>
            {selectedFile && <p className="text-[10px] text-emerald-500 font-black mt-2 text-center">เลือกไฟล์แล้ว: {selectedFile.name}</p>}
            <button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full bg-indigo-600 text-white py-5 rounded-2xl mt-6 font-black">
              {uploading ? <Loader2 className="animate-spin mx-auto" /> : "ส่งข้อมูลจ๊ะ"}
            </button>
            <button onClick={() => setIsModalOpen(false)} className="w-full text-[10px] font-black text-slate-300 uppercase mt-4">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}