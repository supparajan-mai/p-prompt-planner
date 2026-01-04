export type Project = {
  id: string;
  name: string;
  budget: number;
  quarters: ("Q1" | "Q2" | "Q3" | "Q4")[];
  target: string;
  tasks: Task[]; // ✅ เปลี่ยนเป็น Task[]
  createdAt: number;
};
