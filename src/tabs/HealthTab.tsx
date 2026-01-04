import { useEffect, useMemo, useState } from "react";
import type { HealthEntry } from "../types";
import { APP_ID, loadLS, saveLS, todayYMD, uid } from "../app/storage";
import { Input, Modal, Pill, StatCard, Textarea } from "../app/ui";

const MOODS: { id: 1 | 2 | 3 | 4 | 5; emoji: string; name: string }[] = [
  { id: 5, emoji: "🤩", name: "Excited" },
  { id: 4, emoji: "😊", name: "Happy" },
  { id: 3, emoji: "🥱", name: "Tired" },
  { id: 2, emoji: "🥲", name: "Cry" },
  { id: 1, emoji: "😣", name: "Bad" },
];

export default function HealthTab() {
  const [items, setItems] = useState<HealthEntry[]>(() => loadLS(`${APP_ID}:health`, []));
  useEffect(() => saveLS(`${APP_ID}:health`, items), [items]);

  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(todayYMD());
  const [steps, setSteps] = useState<number>(0);
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [teaCoffeeGlasses, setTeaCoffeeGlasses] = useState<number>(0);
  const [sleepHours, setSleepHours] = useState<number>(0);
  const [moodLevel, setMoodLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [detail, setDetail] = useState("");

  const reset = () => {
    setDate(todayYMD());
    setSteps(0);
    setWaterGlasses(0);
    setTeaCoffeeGlasses(0);
    setSleepHours(0);
    setMoodLevel(3);
    setDetail("");
  };

  const save = () => {
    const it: HealthEntry = {
      id: uid("health"),
      date,
      steps: Number(steps || 0),
      waterGlasses: Number(waterGlasses || 0),
      teaCoffeeGlasses: Number(teaCoffeeGlasses || 0),
      sleepHours: Number(sleepHours || 0),
      moodLevel,
      detail: detail.trim(),
      createdAt: Date.now(),
    };

    // วันซ้ำ -> เขียนทับ
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.date === date);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...prev[idx], ...it, id: prev[idx].id };
        return next;
      }
      return [it, ...prev];
    });

    setOpen(false);
    reset();
  };

  const latest = useMemo(() => {
    const sorted = items.slice().sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0] || null;
  }, [items]);

  const avg = useMemo(() => {
    if (items.length === 0) return { steps: 0, water: 0, sleep: 0, mood: 0 };
    const n = items.length;
    const sum = items.reduce(
      (acc, x) => {
        acc.steps += x.steps || 0;
        acc.water += x.waterGlasses || 0;
        acc.sleep += x.sleepHours || 0;
        acc.mood += x.moodLevel || 0;
        return acc;
      },
      { steps: 0, water: 0, sleep: 0, mood: 0 }
    );
    return {
      steps: Math.round(sum.steps / n),
      water: Math.round((sum.water / n) * 10) / 10,
      sleep: Math.round((sum.sleep / n) * 10) / 10,
      mood: Math.round((sum.mood / n) * 10) / 10,
    };
  }, [items]);

  const moodLabel = (m: 1 | 2 | 3 | 4 | 5) => MOODS.find((x) => x.id === m)?.emoji ?? "🙂";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">สุขภาพ</div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
        >
          บันทึกวันนี้
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="เฉลี่ยก้าว/วัน" value={avg.steps.toLocaleString()} sub={`จาก ${items.length} วัน`} />
        <StatCard title="เฉลี่ยน้ำ/วัน (แก้ว)" value={avg.water} />
        <StatCard title="เฉลี่ยนอน/วัน (ชม.)" value={avg.sleep} />
        <StatCard title="เฉลี่ยอารมณ์" value={avg.mood || 0} sub="(1-5)" />
      </div>

      <div className="rounded-2xl bg-white border p-4">
        <div className="text-xs text-gray-500">{latest?.date || "ยังไม่มีข้อมูล"}</div>

        {latest ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill active>ก้าว: {latest.steps}</Pill>
            <Pill active>น้ำ: {latest.waterGlasses}</Pill>
            <Pill active>ชา/กาแฟ: {latest.teaCoffeeGlasses}</Pill>
            <Pill active>นอน: {latest.sleepHours}</Pill>
            <Pill active>
              อารมณ์: {moodLabel(latest.moodLevel)} {MOODS.find((x) => x.id === latest.moodLevel)?.name}
            </Pill>
          </div>
        ) : (
          <div className="text-sm text-gray-500 mt-2">ยังไม่มีการบันทึกสุขภาพ</div>
        )}

        {latest?.detail ? (
          <div className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{latest.detail}</div>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="บันทึกสุขภาพวันนี้"
        wide
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">วันที่</div>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-600 mb-1">ก้าว (steps)</div>
              <Input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">นอน (ชั่วโมง)</div>
              <Input type="number" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-600 mb-1">น้ำ (แก้ว)</div>
              <Input type="number" value={waterGlasses} onChange={(e) => setWaterGlasses(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">ชา/กาแฟ (แก้ว)</div>
              <Input
                type="number"
                value={teaCoffeeGlasses}
                onChange={(e) => setTeaCoffeeGlasses(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="text-sm font-medium text-gray-700">ระดับอารมณ์</div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMoodLevel(m.id)}
                className={[
                  "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
                  moodLevel === m.id ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-gray-200 text-gray-700",
                ].join(" ")}
              >
                <span className="text-lg">{m.emoji}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">เล่าอะไรสั้นๆ</div>
            <Textarea
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="เช่น วันนี้เหนื่อย / กินแป้งเยอะ / เดินเยอะ 😊"
            />
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 hover:bg-gray-50"
              type="button"
            >
              ยกเลิก
            </button>
            <button
              onClick={save}
              className="flex-1 rounded-2xl bg-black text-white py-3 hover:bg-black/90"
              type="button"
            >
              บันทึก
            </button>
          </div>
        </div>
      </Modal>

      <div className="h-28" />
    </div>
  );
}
