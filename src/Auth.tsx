import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // สำคัญ: รับผลจาก redirect login (กรณี popup โดนบล็อก)
    (async () => {
      try {
        await getRedirectResult(auth);
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : "เข้าสู่ระบบไม่สำเร็จ";
        setAuthError(msg);
      }
    })();

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function signInGoogle() {
    setAuthError(null);
    const provider = new GoogleAuthProvider();

    try {
      // ลอง popup ก่อน (ในบาง environment ใช้ได้)
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      const code = String(e?.code || "");

      // ถ้า popup โดนบล็อก/ถูกปิด/ไม่อนุญาต → ใช้ redirect แทน
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }

      // error อื่น ๆ ให้โชว์ข้อความ
      const msg = e?.message ? String(e.message) : "เข้าสู่ระบบไม่สำเร็จ";
      setAuthError(msg);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">กำลังโหลด…</div>;
  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm rounded-3xl border bg-white p-6">
        <div className="text-lg font-semibold mb-1">พี่พร้อม</div>
        <div className="text-sm text-gray-500 mb-4">เข้าสู่ระบบเพื่อใช้งาน</div>

        <button
          onClick={signInGoogle}
          className="w-full rounded-2xl bg-black text-white py-3 hover:bg-black/90"
        >
          เข้าสู่ระบบด้วย Google
        </button>

        {authError && (
          <div className="mt-3 text-xs text-red-600 break-words">
            {authError}
          </div>
        )}
      </div>
    </div>
  );
}

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      className="rounded-2xl border px-3 py-2 text-sm hover:bg-gray-50"
    >
      ออกจากระบบ
    </button>
  );
}
