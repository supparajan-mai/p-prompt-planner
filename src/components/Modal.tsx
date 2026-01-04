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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-3">
        <div
          className={[
            "relative w-full rounded-3xl bg-white shadow-xl border border-gray-100",
            wide ? "sm:max-w-3xl" : "sm:max-w-xl",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="text-lg font-semibold text-gray-900">{title || ""}</div>
            <button
              onClick={onClose}
              className="rounded-full w-9 h-9 grid place-items-center hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-5 pb-5 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
