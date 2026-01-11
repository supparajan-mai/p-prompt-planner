import React, { useEffect, useState } from 'react';
import { onValue, ref, remove as dbRemove, set } from "firebase/database";
import { Plus, Trash2 } from "lucide-react";

// เรียกใช้ Firebase จากจุดเดียว
import { auth, rtdb as db } from "../lib/firebase";

// Components
import Modal from "../components/Modal";
import Input from "../components/Input";
import Textarea from "../components/Textarea";

export default function MemoTab() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const memoRef = ref(db, `notes/${user.uid}`);
    return onValue(memoRef, (s) => setNotes(s.val() ? Object.values(s.val()) : []));
  }, [user]);

  const addNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = Date.now().toString();
    await set(ref(db, `notes/${user.uid}/${id}`), {
      id, title: fd.get('title'), content: fd.get('content'), createdAt: Date.now()
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-800 italic">MEMO BOX</h2>
        <button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-all">
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes.map((n: any) => (
          <div key={n.id} className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 relative group">
            <button onClick={() => dbRemove(ref(db, `notes/${user.uid}/${n.id}`))} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all text-amber-900/30 hover:text-rose-500">
              <Trash2 size={16} />
            </button>
            <h3 className="font-black text-slate-800 mb-2 italic"># {n.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{n.content}</p>
          </div>
        ))}
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title="จดอะไรดีจ๊ะ">
        <form onSubmit={addNote} className="p-6 space-y-4">
          <Input name="title" label="หัวข้อ" placeholder="สั้นๆ พอนะจ๊ะ" required />
          <Textarea name="content" label="เนื้อหา" placeholder="พิมพ์ตรงนี้ได้เลยจ๊ะ..." rows={4} required />
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">บันทึกโน้ตจ๊ะ</button>
        </form>
      </Modal>
    </div>
  );
}