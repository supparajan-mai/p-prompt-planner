import logo from "../assets/logo.png";

type Plan = "เพื่อน" | "คนคุย" | "เพื่อนผู้มีพระคุณ";

export default function Header() {
  // ปรับค่าตามจริงภายหลัง (ตอนนี้ทำ UI ให้เหมือนรูป)
  const plan: Plan = "เพื่อน";
  const renewDate = ""; // เช่น "หมดอายุ 31/01/2569" (ใส่เฉพาะคนคุย/เพื่อนผู้มีพระคุณ)

  const greet = "สวัสดี"; // หรือ "วันนี้ไหวไหม" / "พร้อมลุยไหม" เดี๋ยวปรับได้

  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-100 grid place-items-center overflow-hidden">
          <img src={logo} alt="พี่พร้อม" className="w-full h-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <div className="font-semibold text-gray-900 truncate">พี่พร้อม</div>
                      </div>
          <div className="text-xs text-gray-500 truncate">{greet} 👋</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">สถานะ : <span className="font-semibold text-orange-600">{plan}</span></div>
          {plan !== "เพื่อน" && renewDate ? (
            <div className="text-[11px] text-gray-400">{renewDate}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
