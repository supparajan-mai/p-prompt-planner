import * as React from "react";

// ✅ ดึงจาก components (ต้องเป็น default export)
export { default as Input } from "../components/Input";
export { default as Modal } from "../components/Modal";

/**
 * ✅ Pill (ทำไว้ในไฟล์นี้เลย จะได้ไม่ง้อ components/Pill.tsx)
 */
export function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full text-sm border transition",
        active
          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/**
 * ✅ Textarea (ทำไว้ให้เผื่อแท็บอื่นเรียกใช้)
 */
export function Textarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs text-gray-600">{label}</div> : null}
      <textarea
        {...props}
        className={[
          "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none",
          "focus:border-orange-300 focus:ring-2 focus:ring-orange-100",
          className,
        ].join(" ")}
      />
    </label>
  );
}

/**
 * ✅ StatCard (เผื่อ Finance/Health ใช้)
 */
export function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {sub ? <div className="text-xs text-gray-400 mt-1">{sub}</div> : null}
    </div>
  );
}
