export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** regHours = min(total, 40); otHours = max(total - 40, 0); pay = reg*rate + ot*rate*1.5 */
export function calcPay(hours: number[], rate: number) {
  const totalHours = hours.reduce((a, b) => a + (Number(b) || 0), 0);
  const regHours = Math.min(totalHours, 40);
  const otHours = Math.max(totalHours - 40, 0);
  const totalPay = regHours * rate + otHours * rate * 1.5;
  return {
    totalHours: round2(totalHours),
    regHours: round2(regHours),
    otHours: round2(otHours),
    totalPay: round2(totalPay)
  };
}

export function mondayOf(d: Date = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
