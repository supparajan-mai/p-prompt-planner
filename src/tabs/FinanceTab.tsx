import { useEffect, useMemo, useState } from "react";
import type { FinanceItem } from "../types";
import { APP_ID, loadLS, saveLS, todayYMD, uid } from "../app/storage";
import { Input, Modal, Pill, StatCard, Textarea } from "../app/ui";


type AddMode = "รายรับ" | "รายจ่าย";

export default function FinanceTab() {
  const [finance, setFinance] = useState<FinanceItem[]>(
    () => loadLS(`${APP_ID}:finance`, [])
  );
  useEffect(() => saveLS(`${APP_ID}:finance`, finance), [finance]);

  const monthSummary = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const list = finance.filter((x) => x.date.startsWith(ym));
    const income = list.filter((x) => x.type === "รายรับ").reduce((s, x) => s + x.amount, 0);
    const expense = list.filter((x) => x.type === "รายจ่าย").reduce((s, x) => s + x.amount, 0);
    return { ym, income, expense, net: income - expense };
  }, [finance]);

  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(todayYMD());
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AddMode>("รายจ่าย");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [necessity, setNecessity] = useState<"จำเป็น" | "ฟุ่มเฟือย">("จำเป็น");
  const [note, setNote] = useState("");

  const add = () => {
    if (!title.trim()) return alert("กรุณากรอกรายการ");
    const item: FinanceItem = {
      id: uid("fin"),
      date,
      title: title.trim(),
      type,
      amount: Math.abs(amount || 0),
      category: category.trim(),
      necessity,
      note: note.trim(),
      createdAt: Date.now(),
    };
    setFinance((p) => [item, ...p]);
    setOpen(false);
    setTitle("");
    setAmount(0);
    setCategory("");
    setNote("");
  };

  const remove = (id: string) => setFinance((p) => p.filter((x) => x.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">บัญชี</div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
        >
          เพิ่มรายการ
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <StatCard label="รายรับเดือนนี้" value={monthSummary.income.toLocaleString()} sub={`เดือน ${monthSummary.ym}`} />
        <StatCard label="รายจ่ายเดือนนี้" value={monthSummary.expense.toLocaleString()} />
        <StatCard label="คงเหลือสุทธิ" value={monthSummary.net.toLocaleString()} />
        <StatCard label="จำนวนรายการ" value={String(finance.length)} />
      </div>

      {finance.length === 0 ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-500">
          ยังไม่มีรายการบัญชี
        </div>
      ) : (
        <div className="space-y-2">
          {finance.slice(0, 40).map((f) => (
            <div key={f.id} className="rounded-2xl border bg-white p-4">
              <div className="text-xs text-gray-500">{f.date}</div>
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-gray-600 mt-1">
                {f.type} {f.amount.toLocaleString()} • {f.category || "ไม่ระบุหมวด"} •{" "}
                {f.type === "รายจ่าย" ? f.necessity : "—"}
              </div>
              {f.note ? <div className="text-sm text-gray-600 mt-2">{f.note}</div> : null}
              <button onClick={() => remove(f.id)} className="text-sm text-gray-500 hover:underline mt-2">
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="เพิ่มรายการบัญชี">
        <div className="space-y-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex gap-2">
            <Pill active={type === "รายรับ"} onClick={() => setType("รายรับ")}>รายรับ</Pill>
            <Pill active={type === "รายจ่าย"} onClick={() => setType("รายจ่าย")}>รายจ่าย</Pill>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="รายการ" />
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="จำนวนเงิน" />
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="หมวดหมู่" />

          {type === "รายจ่าย" ? (
            <div className="flex gap-2">
              <Pill active={necessity === "จำเป็น"} onClick={() => setNecessity("จำเป็น")}>จำเป็น</Pill>
              <Pill active={necessity === "ฟุ่มเฟือย"} onClick={() => setNecessity("ฟุ่มเฟือย")}>ฟุ่มเฟือย</Pill>
            </div>
          ) : null}

          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ" />

          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-2xl border py-3" type="button">
              ยกเลิก
            </button>
            <button onClick={add} className="flex-1 rounded-2xl bg-black text-white py-3" type="button">
              บันทึก
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
