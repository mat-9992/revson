export function money(n: number | null | undefined) {
  const v = Number(n) || 0;
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function moneyInt(n: number | null | undefined) {
  return "$" + (Number(n) || 0).toLocaleString("en-US");
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
