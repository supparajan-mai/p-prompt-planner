import * as React from "react";

type Props = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function Pill({ active, onClick, children, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-4 py-2 rounded-full text-sm border transition " +
        (active
          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}
