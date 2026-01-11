import React, { useState, useEffect } from 'react';
import { 
  getDatabase, ref, update, onValue 
} from "firebase/database";
import { 
  getStorage, ref as sRef, uploadBytes, getDownloadURL 
} from "firebase/storage";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, onSnapshot 
} from 'firebase/firestore';
import { 
  CheckCircle, 
  Award, 
  ShieldCheck, 
  Camera, 
  CreditCard, 
  X, 
  Loader2,
  Coffee,
  Info,
  ChevronRight,
  User,
  Calendar,
  Settings,
  Laugh,
  MessageSquareQuote,
  Check,
  Sparkles,
  FileText,
  Lock,
  Scale,
  Gift
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "p-prompt.firebaseapp.com",
      databaseURL: "https://p-prompt-default-rtdb.firebaseio.com",
      projectId: "p-prompt",
      storageBucket: "p-prompt.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const store = getFirestore(app);
const storage = getStorage(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); 

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    status: 'เพื่อน',
    fullName: '-',
    joinDate: '-',
    coffeePoints: 0
  });
  const [quoteConfig, setQuoteConfig] = useState({ frequency: 'always' });
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // ข้อมูลราคาใหม่ตามที่คุณกำหนด
  const priceYear1 = 590;
  const priceYear2 = 890;
  const earlyRenewalPrice = 790;

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ดึงข้อมูลสมาชิก (Rule 1)
  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `artifacts/${appId}/public/data/users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData({
          status: data.status || 'เพื่อน',
          fullName: data.fullName || (user.displayName || "ยังไม่ได้ระบุชื่อ"),
          joinDate: data.joinDate ? new Date(data.joinDate).toLocaleDateString('th-TH') : "เริ่มใช้งานวันนี้",
          coffeePoints: data.coffeePoints || 0
        });
      }
    });
    return () => unsubscribe();
  }, [user]);

  // ดึงข้อมูลตั้งค่าคำคม (Firestore Rule 1)
  useEffect(() => {
    if (!user) return;
    const configRef = doc(store, 'artifacts', appId, 'users', user.uid, 'settings', 'funny_quote_config');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setQuoteConfig(docSnap.data());
      }
    }, (err) => console.error("Firestore Error:", err));
    return () => unsubscribe();
  }, [user]);

  const handleUpdateQuoteFreq = async (newFreq) => {
    if (!user) return;
    setIsConfigSaving(true);
    const configRef = doc(store, 'artifacts', appId, 'users', user.uid, 'settings', 'funny_quote_config');
    try {
      await setDoc(configRef, { frequency: newFreq }, { merge: true });
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfigSaving(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleConfirmPayment = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);
    try {
      const storageRef = sRef(storage, `artifacts/${appId}/slips/${user.uid}_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await update(ref(db, `artifacts/${appId}/public/data/users/${user.uid}`), {
        slipUrl: downloadURL,
        status: "รอตรวจสอบ",
        upgradeRequestDate: new Date().toISOString()
      });
      setModalVisible(false);
      alert("ได้รับข้อมูลเรียบร้อยแล้วจ๊ะ เจ้าหน้าที่กำลังตรวจสอบให้นะจ๊ะ!");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอัปโหลดจ๊ะ");
    } finally { setUploading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#FDFCFB]"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-32 overflow-y-auto text-left">
      {/* ส่วนหัวโปรไฟล์ */}
      <div className="bg-white px-6 pt-16 pb-8 rounded-b-[3.5rem] shadow-sm border-b border-slate-100 mb-8 relative">
        <div className="max-w-xl mx-auto flex items-center gap-5 px-2">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0 border-4 border-white transition-transform hover:scale-105 duration-500">
             <User size={40} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-800 leading-tight truncate">สวัสดีครับคุณ {userData.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${userData.status === 'เพื่อนผู้มีพระคุณ' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {userData.status}
                </span>
                <span className="text-[10px] text-slate-300 font-bold italic">สมาชิกตั้งแต่ {userData.joinDate}</span>
            </div>
          </div>
        </div>

        {/* ข้อมูลสรุป */}
        <div className="grid grid-cols-2 gap-3 mt-10 max-w-xl mx-auto px-4">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center group hover:bg-white hover:shadow-md transition-all">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">ค่ากาแฟสะสม</p>
                <div className="flex items-center justify-center gap-2 text-slate-800 font-black text-xl italic">
                    <Coffee size={20} className="text-amber-500" /> {userData.coffeePoints}
                </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-center group hover:bg-white hover:shadow-md transition-all">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">สถานะบัญชี</p>
                <div className="flex items-center justify-center gap-2 text-slate-800 font-black text-xl italic">
                    <ShieldCheck size={20} className="text-emerald-500" /> ปลอดภัย
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 space-y-10">
        
        {/* ส่วน: ตั้งค่าการใช้งาน */}
        <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <Settings size={20} className="text-indigo-600" />
                <h3 className="text-lg font-black text-slate-800">ตั้งค่าการใช้งาน</h3>
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                        <Laugh size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <h4 className="text-sm font-black text-slate-800 mb-1">คำคมกวนๆ จากพี่พร้อม</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">เลือกว่าจะให้พี่พร้อมโผล่ออกมาทักทายคุณบ่อยแค่ไหนจ๊ะ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'always', label: 'ทักทุกครั้ง', desc: 'โผล่มาทักทายทุกรอบที่เข้าแอปเลยจ๊ะ' },
                        { id: 'daily', label: 'วันละครั้งพอ', desc: 'เจอกันวันละหนกำลังดีจ๊ะ' },
                        { id: 'off', label: 'ไม่ต้องทัก (ปิด)', desc: 'แอบอยู่เงียบๆ ไม่รบกวนจ๊ะ' }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            disabled={isConfigSaving}
                            onClick={() => handleUpdateQuoteFreq(opt.id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${quoteConfig.frequency === opt.id ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-50 hover:border-slate-200'}`}
                        >
                            <div>
                                <p className={`text-xs font-black ${quoteConfig.frequency === opt.id ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</p>
                                <p className="text-[9px] text-slate-400 font-medium">{opt.desc}</p>
                            </div>
                            {quoteConfig.frequency === opt.id && (
                                isConfigSaving ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Check size={18} className="text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </section>

        {/* Upgrade Card */}
        {userData.status !== 'เพื่อนผู้มีพระคุณ' && userData.status !== 'รอตรวจสอบ' && (
          <div className="bg-gradient-to-br from-[#1e1b4b] to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 text-left">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-400" /> ยกระดับสถานะสมาชิก
              </h3>
              
              <div className="p-5 bg-white/10 rounded-3xl border border-white/10 mb-8 text-left">
                  <p className="text-[10px] font-black text-indigo-200 mb-4 uppercase tracking-[0.2em]">สิทธิประโยชน์พิเศษ</p>
                  <ul className="space-y-3 text-xs font-medium opacity-90">
                      <li className="flex items-center gap-2 italic"><Sparkles size={14} className="text-amber-300"/> AI ช่วยวิเคราะห์แผนการเงินและงานเชิงลึก</li>
                      <li className="flex items-center gap-2 italic"><Sparkles size={14} className="text-amber-300"/> สะสมแต้มค่ากาแฟแลกรับรางวัลสุดพิเศษ</li>
                      <li className="flex items-center gap-2 italic"><Sparkles size={14} className="text-amber-300"/> พื้นที่ปรึกษาส่วนตัวและดูแลใจระดับ VIP</li>
                  </ul>
              </div>

              <button onClick={() => { setStep(1); setModalVisible(true); }} className="w-full bg-white text-indigo-900 font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-xl active:scale-95">
                เป็น "เพื่อนผู้มีพระคุณ" <ChevronRight size={18} />
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl transition-all group-hover:scale-125"></div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between shadow-sm italic">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">P'Prompt Application v1.0.6</p>
          <div className="text-[10px] text-indigo-400 font-black uppercase">Standard PDPA Secured</div>
        </div>
      </div>

      {/* --- Upgrade Modal --- */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3rem] p-10 relative max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-500 text-left font-sans">
            <button onClick={() => setModalVisible(false)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>

            {step === 1 ? (
              <div className="space-y-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><FileText size={20}/></div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight underline decoration-indigo-200 decoration-8 font-serif">สนับสนุนพี่พร้อมจ๊ะ</h2>
                </div>

                {/* ส่วนข้อตกลงการใช้งาน (Terms & Conditions) ที่ปรับปรุงราคาแล้ว */}
                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 max-h-[280px] overflow-y-auto space-y-5 shadow-inner custom-scrollbar">
                    <section>
                        <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5"><Scale size={12}/> 1. ข้อตกลงการใช้บริการ</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            แอปพลิเคชัน "พี่พร้อม" จัดทำขึ้นเพื่อช่วยวางแผนและบริหารจัดการชีวิตส่วนบุคคล ข้อมูลที่คุณบันทึกจะถูกเก็บเป็นความลับตามมาตรฐานความปลอดภัยสูงสุดจ๊ะ
                        </p>
                    </section>
                    <section className="bg-white p-4 rounded-2xl border border-indigo-100">
                        <h4 className="text-xs font-black text-indigo-800 mb-2 flex items-center gap-1.5"><CreditCard size={12}/> 2. รายละเอียดค่าสนับสนุนระบบ</h4>
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
                                • ปีแรก: ฿{priceYear1} บาท
                            </p>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
                                • ปีที่ 2 เป็นต้นไป: ฿{priceYear2} บาท
                            </p>
                            <div className="flex items-start gap-1.5 mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                <Gift size={10} className="text-emerald-600 mt-0.5 shrink-0" />
                                <p className="text-[9px] text-emerald-700 font-black italic">
                                    พิเศษ! หากต่ออายุก่อนครบกำหนด จ่ายเพียง ฿{earlyRenewalPrice} บาทจ๊ะ
                                </p>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed mt-2 italic">
                                * ค่าใช้จ่ายดังกล่าวเป็นค่าบำรุงรักษา Server และการพัฒนาฟีเจอร์ AI โดยมีอายุการใช้งานตามที่ระบุในแผนงานจ๊ะ
                            </p>
                        </div>
                    </section>
                    <section>
                        <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5"><Lock size={12}/> 3. นโยบายความเป็นส่วนตัว (PDPA)</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            เราเก็บรวบรวมข้อมูล ได้แก่ ชื่อ, อีเมล, บันทึกสุขภาพใจ และแผนงานของคุณเพื่อประมวลผลผ่าน AI คุณมีสิทธิ์เข้าถึง แก้ไข และลบข้อมูลทั้งหมดของคุณได้ด้วยตัวเองตลอดเวลาจ๊ะ
                        </p>
                    </section>
                    <section>
                        <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5"><Info size={12}/> 4. ข้อจำกัดความรับผิดชอบ (Disclaimer)</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            คำแนะนำจากพี่พร้อม (AI) เป็นเพียงการวิเคราะห์ข้อมูลเบื้องต้น ไม่สามารถทดแทนคำแนะนำจากผู้เชี่ยวชาญทางการแพทย์หรือการเงินได้ คุณควรใช้วิจารณญาณในการตัดสินใจจ๊ะ
                        </p>
                    </section>
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <ShieldCheck className="text-indigo-500 shrink-0" size={24}/>
                    <p className="text-[10px] text-indigo-700 font-bold leading-relaxed italic">
                        "พี่พร้อมสัญญาว่าจะดูแลข้อมูลของคุณให้ดีที่สุด<br/>และอยู่เคียงข้างแผนชีวิตคุณตลอดไปจ๊ะ"
                    </p>
                </div>

                <button onClick={() => setStep(2)} className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2rem] hover:bg-indigo-800 shadow-2xl shadow-indigo-100 active:scale-95 transition-all mt-6">ยอมรับข้อตกลงและไปต่อจ๊ะ</button>
              </div>
            ) : (
              <div className="space-y-8 py-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 font-serif underline decoration-indigo-200 decoration-8 italic">ชำระเงินสนับสนุนจ๊ะ</h2>
                <div className="bg-[#1e1435] text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-4 border-indigo-400/20">
                    <p className="text-white/30 text-[9px] uppercase font-black mb-4 tracking-[0.3em]">SCB Bank Account</p>
                    <p className="text-2xl font-mono font-black tracking-[0.2em] mb-4">552-422373-2</p>
                    <p className="text-sm font-bold text-indigo-200 italic">นางสาวศุภรา เจนพิชัย</p>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div>
                <div className="text-center"><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">ยอดสนับสนุนในปีแรก</p><p className="text-5xl font-black text-indigo-900 tracking-tighter">฿{priceYear1}.00</p></div>
                <div className="relative">
                  <input type="file" id="slip-up" className="hidden" accept="image/*" onChange={handleFileChange} />
                  <label htmlFor="slip-up" className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${selectedFile ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-indigo-400'}`}>
                    {selectedFile ? <div className="text-center animate-in zoom-in"><CheckCircle className="w-10 h-10 mb-3 mx-auto text-emerald-500" /><span className="text-xs font-black block truncate px-4">{selectedFile.name}</span><span className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">แตะเพื่อเปลี่ยนรูปจ๊ะ</span></div> : <><Camera className="w-10 h-10 mb-3 text-slate-300" /><span className="text-xs font-black">แนบสลิปเพื่อยืนยันจ๊ะ</span></>}
                  </label>
                </div>
                <button onClick={handleConfirmPayment} disabled={uploading} className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.2rem] flex items-center justify-center gap-3 disabled:bg-slate-200 shadow-2xl active:scale-95 transition-all">{uploading ? <Loader2 className="animate-spin" /> : "ส่งหลักฐานให้พี่พร้อมจ๊ะ"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;