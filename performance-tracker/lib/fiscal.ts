export function getThaiFiscalYear(date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const fiscalGregorian = month >= 10 ? year + 1 : year;
  return fiscalGregorian + 543;
}

export function getEvaluationCycle(date: Date): "1" | "2" {
  const month = date.getMonth() + 1;
  return month >= 10 || month <= 3 ? "1" : "2";
}

export function cycleLabel(cycle: string): string {
  return cycle === "1" ? "รอบที่ 1 (ต.ค.–มี.ค.)" : "รอบที่ 2 (เม.ย.–ก.ย.)";
}

export function thaiDate(dateString: string): string {
  if (!dateString) return "-";
  const d = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const fiscalMonths = [
  { key: 10, label: "ต.ค." }, { key: 11, label: "พ.ย." }, { key: 12, label: "ธ.ค." },
  { key: 1, label: "ม.ค." }, { key: 2, label: "ก.พ." }, { key: 3, label: "มี.ค." },
  { key: 4, label: "เม.ย." }, { key: 5, label: "พ.ค." }, { key: 6, label: "มิ.ย." },
  { key: 7, label: "ก.ค." }, { key: 8, label: "ส.ค." }, { key: 9, label: "ก.ย." },
];
