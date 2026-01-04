import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-xs text-gray-600">{label}</div> : null}
      <input
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
