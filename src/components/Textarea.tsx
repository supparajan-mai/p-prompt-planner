import * as React from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
};

export default function Textarea({ label, hint, className = "", ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-gray-800">{label}</div> : null}
      <textarea
        {...props}
        className={
          "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm " +
          "outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 " +
          className
        }
      />
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </label>
  );
}
