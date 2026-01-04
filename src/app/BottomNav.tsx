import * as React from "react";
import type { TabId } from "../types";

type Props = {
  tab: TabId;
  setTab: (t: TabId) => void;
  /** ถ้าไม่ส่งมา ปุ่ม + จะเป็น “โชว์เฉยๆ” (disabled) */
  onAdd?: () => void;
};

const Item = ({
  active,
  label,
  icon,
  onClick,
}: {
  active?: boolean;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition",
      active ? "text-orange-600" : "text-gray-400 hover:text-gray-600",
    ].join(" ")}
  >
    <div
      className={[
        "h-9 w-9 rounded-2xl flex items-center justify-center",
        active ? "bg-orange-50" : "bg-transparent",
      ].join(" ")}
    >
      {icon}
    </div>
    <div className="text-[11px]">{label}</div>
  </button>
);

export default function BottomNav({ tab, setTab, onAdd }: Props) {
  const addEnabled = typeof onAdd === "function";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* shadow bar */}
      <div className="mx-auto max-w-xl px-4 pb-4">
        <div className="relative rounded-[28px] bg-white/95 backdrop-blur border border-gray-100 shadow-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <Item
              active={tab === "work"}
              label="งาน"
              icon={<span className="text-lg">🧰</span>}
              onClick={() => setTab("work")}
            />
            <Item
              active={tab === "memo"}
              label="โน้ต"
              icon={<span className="text-lg">🗒️</span>}
              onClick={() => setTab("memo")}
            />
            <div className="w-14" />
            <Item
              active={tab === "finance"}
              label="บัญชี"
              icon={<span className="text-lg">💳</span>}
              onClick={() => setTab("finance")}
            />
            <Item
              active={tab === "health"}
              label="สุขภาพ"
              icon={<span className="text-lg">🧡</span>}
              onClick={() => setTab("health")}
            />
          </div>

          {/* Center + */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <button
              type="button"
              onClick={addEnabled ? onAdd : undefined}
              aria-disabled={!addEnabled}
              className={[
                "h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center",
                "transition active:scale-[0.98]",
                addEnabled
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-orange-300/60 text-white cursor-not-allowed",
              ].join(" ")}
              title={addEnabled ? "เพิ่มรายการ" : "เพิ่มจากหน้าแต่ละเมนู"}
            >
              <span className="text-3xl leading-none">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* safe area spacer */}
      <div className="h-3" />
    </div>
  );
}
