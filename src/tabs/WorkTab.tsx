import { useState } from "react";
import { callCloudFunction } from "../lib/function";

type AiResultItem = {
  taskId: string;
  title: string;
  reason: string;
  suggestedStart: string;
  suggestedMinutes: number;
};

export default function WorkTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResultItem[] | null>(null);

  async function handleAiPrioritize() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // mock tasks สำหรับทดสอบ UI
      // (ขั้นถัดไปค่อยเปลี่ยนเป็น tasks จริงจาก state)
      const mockTasks = [
        { id: "t1", title: "ทำสไลด์รายงาน" },
        { id: "t2", title: "ตอบไลน์ทีม" },
      ];

      const res = await callCloudFunction<
        { tasks: { id: string; title: string }[] },
        { items: AiResultItem[] }
      >("aiPrioritizeTasks", { tasks: mockTasks });

      setResult(res.items);
    } catch (e: any) {
      setError(e?.message || "เรียก AI ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-medium text-gray-900 mb-1">
          งานของวันนี้
        </div>
        <div className="text-sm text-gray-500 mb-3">
          ให้พี่พร้อมช่วยจัดลำดับงานให้ทำทัน
        </div>

        <button
          onClick={handleAiPrioritize}
          disabled={loading}
          className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:bg-black/90 disabled:opacity-60"
          type="button"
        >
          {loading ? "กำลังจัดลำดับ..." : "จัดลำดับงานด้วย AI"}
        </button>

        {error && (
          <div className="mt-2 text-xs text-red-600">
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-2">
          {result.map((it) => (
            <div
              key={it.taskId}
              className="rounded-2xl border bg-white p-3"
            >
              <div className="font-medium text-gray-900">
                {it.title}
              </div>
              <div className="text-xs text-gray-500">
                {it.suggestedStart} • {it.suggestedMinutes} นาที
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {it.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
