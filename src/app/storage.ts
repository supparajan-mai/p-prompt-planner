export const APP_ID = "p-prompt-surat";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadLS<T>(key: string, fallback: T): T {
  return safeJsonParse(localStorage.getItem(key), fallback);
}

export function toGCalDateTime(dateYMD: string, timeHM: string) {
  const [y, m, d] = dateYMD.split("-");
  const [hh, mm] = timeHM.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

export function buildGCalTemplateUrl(args: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  details?: string;
  location?: string;
}) {
  const dates = `${toGCalDateTime(args.date, args.startTime)}/${toGCalDateTime(
    args.date,
    args.endTime
  )}`;
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", args.title || "นัดหมาย");
  url.searchParams.set("dates", dates);
  if (args.details) url.searchParams.set("details", args.details);
  if (args.location) url.searchParams.set("location", args.location);
  return url.toString();
}
