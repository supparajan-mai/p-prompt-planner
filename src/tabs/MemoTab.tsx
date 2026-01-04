import { useEffect, useMemo, useState } from "react";
import type { NoteItem } from "../types";
import { APP_ID, loadLS, saveLS, uid } from "../app/storage";
import { Input, Modal, Pill, Textarea } from "../app/ui";

const COLORS = [
  { key: "orange-100", dot: "bg-orange-200", ring: "ring-orange-300" },
  { key: "yellow-100", dot: "bg-yellow-200", ring: "ring-yellow-300" },
  { key: "emerald-100", dot: "bg-emerald-200", ring: "ring-emerald-300" },
  { key: "sky-100", dot: "bg-sky-200", ring: "ring-sky-300" },
  { key: "violet-100", dot: "bg-violet-200", ring: "ring-violet-300" },
] as const;

export default function MemoTab() {
  const [items, setItems] = useState<NoteItem[]>(() =>
    loadLS(`${APP_ID}:notes`, [])
  );

  useEffect(() => saveLS(`${APP_ID}:notes`, items), [items]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<(typeof COLORS)[number]["key"]>("orange-100");

  const reset = () => {
    setTitle("");
    setContent("");
    setColor("orange-100");
  };

  const save = () => {
    const t = title.trim();
    const c = content.trim();
    if (!t) return alert("กรุณาใส่หัวข้อโน้ต");
    const it: NoteItem = {
      id: uid("note"),
      title: t,
      content: c,
      color,
      createdAt: Date.now(),
    };
    setItems((p) => [it, ...p]);
    setOpen(false);
    reset();
  };

  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  const view = useMemo(
    () => items.slice().sort((a, b) => b.createdAt - a.createdAt),
    [items]
  );

  const colorToCard = (key: string) => {
    switch (key) {
      case "orange-100":
        return "bg-orange-50 border-orange-100";
      case "yellow-100":
        return "bg-yellow-50 border-yellow-100";
      case "emerald-100":
        return "bg-emerald-50 border-emerald-100";
      case "sky-100":
        return "bg-sky-50 border-sky-100";
      case "violet-100":
        return "bg-violet-50 border-violet-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">โน้ต</div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
        >
          เพิ่มโน้ต
        </button>
      </div>

      {view.length === 0 ? (
        <div className="rounded-2xl bg-white border p-6 text-sm text-gray-500">
          ยังไม่มีโน้ต 📝
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {view.map((n) => (
            <div
              key={n.id}
              className={[
                "rounded-2xl border p-4",
                "shadow-sm",
                colorToCard(n.color),
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{n.title}</div>
                  {n.content ? (
                    <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                      {n.content}
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="เพิ่มรายการใหม่"
        wide
      >
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="หัวข้อโน้ต" />
          <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="พิมพ์สิ่งที่อยากจดไว้..." />

          <div className="text-sm font-medium text-gray-700">สีโน้ต</div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => {
              const active = c.key === color;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={[
                    "h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center",
                    active ? `ring-2 ${c.ring}` : "hover:bg-gray-50",
                  ].join(" ")}
                  title={c.key}
                >
                  <div className={["h-6 w-6 rounded-full", c.dot].join(" ")} />
                </button>
              );
            })}
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
    </div>
  );
}
