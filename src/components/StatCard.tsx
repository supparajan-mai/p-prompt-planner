import * as React from "react";

type Props = {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
};

export default function StatCard({ title, value, sub }: Props) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-gray-500">{sub}</div> : null}
    </div>
  );
}
