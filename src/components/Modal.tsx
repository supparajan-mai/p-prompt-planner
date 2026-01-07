// src/components/Modal.tsx
import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  wide?: boolean;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, wide, children }: Props) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="close overlay"
        onClick={onClose}
      />
      <div
        className={
          "relative w-full sm:mx-4 mx-0 bg-white rounded-t-3xl sm:rounded-3xl shadow-xl " +
          (wide ? "max-w-3xl" : "max-w-lg")
        }
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-base font-semibold">{title || ""}</div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
