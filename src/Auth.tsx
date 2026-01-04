import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "./lib/firebase";
import logo from "./assets/logo.png";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        if (displayName.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
      }
    } catch (e: any) {
      setErr(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
        <img
  src={logo}
  alt="พี่พร้อม"
  className="w-10 h-10 rounded-full object-contain"
/>

          <div>
            <div className="font-semibold text-gray-900">พี่พร้อม</div>
            <div className="text-xs text-gray-500">เพื่อนคู่ใจ ไปไหนไปกัน</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            className={[
              "flex-1 rounded-2xl py-2 text-sm border",
              mode === "login"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200",
            ].join(" ")}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={[
              "flex-1 rounded-2xl py-2 text-sm border",
              mode === "signup"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200",
            ].join(" ")}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
        </div>

        {mode === "signup" ? (
          <input
            className="w-full rounded-2xl border px-4 py-3 text-sm mb-3"
            placeholder="ชื่อที่อยากให้เรียก (ไม่ใส่ก็ได้)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        ) : null}

        <input
          className="w-full rounded-2xl border px-4 py-3 text-sm mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border px-4 py-3 text-sm mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err ? <div className="text-sm text-red-600 mb-3">{err}</div> : null}

        <button
          className="w-full rounded-2xl bg-orange-500 text-white py-3 hover:bg-orange-600 disabled:opacity-60"
          onClick={submit}
          disabled={loading || !email.trim() || !password}
        >
          {loading ? "กำลังเข้า..." : mode === "login" ? "เข้าใช้งาน" : "สร้างบัญชี"}
        </button>

        <div className="text-xs text-gray-500 mt-4">
          * ใช้ Firebase Auth (Email/Password)
        </div>
      </div>
    </div>
  );
}
