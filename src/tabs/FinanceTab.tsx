import { useEffect, useMemo, useState } from "react";
import type { FinanceItem } from "../types";
import { APP_ID, loadLS, saveLS, todayYMD, uid } from "../app/storage";
import { Input, Modal, Pill, StatCard, Textarea } from "../app/ui";

type AddMode = "รายการ";

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-gray-500 mb-1">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function FinanceTab() {
  const [items, setItems] = useState<FinanceItem[]>(() => loadLS(`${APP_ID}:finance`, []));

  useEffect(() => saveLS(`${APP_ID}:finance`, items), [items]);

  const [addOpen, setAddOpen] = useState(false);
  const [addMode] = useState<AddMode>("รายการ");

  // form
  const [date, setDate] = useState(todayYMD());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FinanceItem["type"]>("รายจ่าย");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [necessity, setNecessity] = useState<FinanceItem["necessity"]>("จำเป็น");
  const [note, setNote] = useState("");

  const reset = () => {
    setDate(todayYMD());
    setTitle("");
    setType("รายจ่าย");
    setAmount(0);
    setCategory("");
    setNecessity("จำเป็น");
    setNote("");
  };

  const monthKey = useMemo(() => date.slice(0, 7), [date]);

  const monthItems = useMemo(
    () => items.filter((x) => x.date.startsWith(monthKey)).sort((a, b) => b.date.localeCompare(a.date)),
    [items, monthKey]
  );

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const it of monthItems) {
      if (it.type === "รายรับ") income += Number(it.amount || 0);
      else expense += Number(it.amount || 0);
    }
    return {
      income,
      expense,
      net: income - expense,
      count: monthItems.length,
    };
  }, [monthItems]);

  const save = () => {
    if (!title.trim()) return alert("กรุณากรอกรายการ");
    if (!amount || Number.isNaN(Number(amount))) return alert("กรุณากรอกจำนวนเงิน");

    const item: FinanceItem = {
      id: uid("fin"),
      date,
      title: title.trim(),
      type,
      amount: Number(amount),
      category: category.trim(),
      necessity,
      note: note.trim(),
      createdAt: Date.now(),
    };

    setItems((p) => [item, ...p]);
    setAddOpen(false);
    reset();
  };

  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  const thMonth = (ym: string) => {
    // ym = YYYY-MM
    const [y, m] = ym.split("-").map((v) => Number(v));
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${months[(m || 1) - 1]} ${y}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900">บัญชี</div>
          <div className="text-xs text-gray-500">สรุปเดือนนี้ • {thMonth(monthKey)}</div>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
        >
          เพิ่มรายการ
        </button>
      </div>

      {/* สรุป */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="รายรับเดือนนี้" value={stats.income.toLocaleString()} sub={`เดือน ${monthKey}`} />
        <StatCard title="รายจ่ายเดือนนี้" value={stats.expense.toLocaleString()} sub="รวมทั้งหมด" />
        <StatCard title="คงเหลือสุทธิ" value={stats.net.toLocaleString()} sub="รายรับ - รายจ่าย" />
        <StatCard title="รายการทั้งหมด" value={String(stats.count)} sub="รายการ" />
      </div>

      {/* รายการเดือนนี้ */}
      <div className="rounded-2xl bg-white border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">รายการเดือนนี้</div>
          <div className="text-xs text-gray-500">{monthKey}</div>
        </div>

        {monthItems.length === 0 ? (
          <div className="text-sm text-gray-500">ยังไม่มีรายการ 🧾</div>
        ) : (
          <div className="space-y-2">
            {monthItems.map((x) => (
              <div key={x.id} className="rounded-xl bg-gray-50 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{x.title}</div>
                    <span
                      className={
                        "text-xs px-2 py-0.5 rounded-full " +
                        (x.type === "รายรับ" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")
                      }
                    >
                      {x.type}
                    </span>
                    {x.necessity ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white border text-gray-600">
                        {x.necessity}
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {x.date}
                    {x.category ? ` • ${x.category}` : ""}
                    {x.note ? ` • ${x.note}` : ""}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={"font-semibold " + (x.type === "รายรับ" ? "text-emerald-700" : "text-gray-900")}>
                    {x.type === "รายรับ" ? "+" : "-"}
                    {Number(x.amount || 0).toLocaleString()} บาท
                  </div>
                  <button onClick={() => remove(x.id)} className="text-sm text-gray-500 hover:underline mt-1">
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          reset();
        }}
        title="เพิ่มรายการใหม่"
        wide
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <Pill active={true} onClick={() => {}}>
            {addMode}
          </Pill>
        </div>

        {/* ✅ ใส่ label ให้ครบ */}
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="วันที่">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field label="ประเภท">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FinanceItem["type"])}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <option value="รายจ่าย">รายจ่าย</option>
                <option value="รายรับ">รายรับ</option>
              </select>
            </Field>
          </div>

          <Field label="รายการ (ชื่อ/คำอธิบายสั้น ๆ)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น กาแฟ, ค่าน้ำมัน, เงินเดือน" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="จำนวนเงิน (บาท)">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="เช่น 120"
              />
            </Field>

            <Field label="หมวดหมู่">
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="เช่น อาหาร, เดินทาง, งาน" />
            </Field>
          </div>

          <Field label="ความจำเป็น">
            <div className="flex flex-wrap gap-2">
              {(["จำเป็น", "ฟุ่มเฟือย"] as const).map((x) => (
                <Pill key={x} active={necessity === x} onClick={() => setNecessity(x)}>
                  {x}
                </Pill>
              ))}
            </div>
          </Field>

          <Field label="หมายเหตุ (ไม่บังคับ)">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ซื้อให้แม่ / มีโปรลดราคา" />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              setAddOpen(false);
              reset();
            }}
            className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 hover:bg-gray-50"
            type="button"
          >
            ยกเลิก
          </button>
          <button onClick={save} className="flex-1 rounded-2xl bg-black text-white py-3 hover:bg-black/90" type="button">
            บันทึก
          </button>
        </div>
      </Modal>
    </div>
  );
}
