"use client";
import { useEffect, useMemo, useState } from "react";
import {
  supabaseBrowser, money, calcPay, mondayOf, isoDate, fmtDate, DAY_KEYS, DAY_LABELS,
  Button, Select, Field, Input, Card, Table, THead, TR, TD, StatusBadge, EmptyState, Skeleton,
  PageTitle, Disclaimer, toast, type Employee, type PayPeriod
} from "@revson/shared";
import { Wallet, Download, Check, DollarSign } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

function PayrollInner() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [periods, setPeriods] = useState<PayPeriod[]>([]);

  const [empId, setEmpId] = useState("");
  const [weekStart, setWeekStart] = useState(() => isoDate(mondayOf(new Date())));
  const [hours, setHours] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!business) return;
    const sb = supabaseBrowser();
    const [emps, pays] = await Promise.all([
      sb.from("employees").select("*").eq("business_id", business.id).order("name"),
      sb.from("pay_periods").select("*, employees(name)").eq("business_id", business.id).order("week_start", { ascending: false }).order("created_at", { ascending: false })
    ]);
    const list = (emps.data as Employee[]) ?? [];
    setEmployees(list);
    setEmpId((prev) => prev || list[0]?.id || "");
    setPeriods((pays.data as PayPeriod[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business]);

  const rate = useMemo(() => employees.find((e) => e.id === empId)?.rate ?? 0, [employees, empId]);
  const calc = useMemo(() => calcPay(hours, rate), [hours, rate]);
  const pending = periods.filter((p) => p.status === "pending");

  function setHour(i: number, v: string) {
    setHours((h) => h.map((x, idx) => (idx === i ? Number(v || 0) : x)));
  }

  async function saveLog() {
    if (!business || !empId) return toast.error("Pick an employee.");
    setSaving(true);
    const hoursObj = Object.fromEntries(DAY_KEYS.map((d, i) => [d, hours[i]]));
    const { error } = await supabaseBrowser().from("pay_periods").insert({
      business_id: business.id, employee_id: empId, week_start: weekStart,
      hours: hoursObj, total_hours: calc.totalHours, ot_hours: calc.otHours, total_pay: calc.totalPay, status: "pending"
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Time log saved.");
    setHours([0, 0, 0, 0, 0, 0, 0]);
    load();
  }

  async function setStatus(p: PayPeriod, status: "approved" | "paid") {
    const { error } = await supabaseBrowser().from("pay_periods").update({ status }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved." : "Marked paid.");
    setPeriods((rows) => rows.map((r) => (r.id === p.id ? { ...r, status } : r)));
  }

  function exportCsv() {
    const header = ["Employee", "Week Start", "Total Hours", "OT Hours", "Total Pay", "Status"];
    const lines = periods.map((p) => [
      (p.employees?.name ?? "").replace(/,/g, " "),
      p.week_start, p.total_hours, p.ot_hours, p.total_pay, p.status
    ].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business?.name?.replace(/\s+/g, "-").toLowerCase() ?? "payroll"}-pay-log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle title="Pay & Payroll" desc="Log hours, approve time, export for your accountant." right={periods.length ? <Button variant="secondary" onClick={exportCsv}><Download size={15} /> Export CSV</Button> : undefined} />
      <Disclaimer>
        Tracker only — Revson is not a certified payroll provider. Overtime rules vary by state. Confirm all figures with your accountant before paying.
      </Disclaimer>

      {loading ? (
        <Skeleton className="h-64" />
      ) : employees.length === 0 ? (
        <EmptyState icon={Wallet} title="No team to pay" desc="Add employees first, then log their hours here." />
      ) : (
        <div className="space-y-8">
          {/* Pending */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Pending time logs</h2>
            {pending.length === 0 ? (
              <Card className="p-5 text-sm text-mute">Nothing pending. Log hours below and they&apos;ll appear here for approval.</Card>
            ) : (
              <Table>
                <THead cols={["Employee", "Week Start", "Total Hours", "OT", "Total Pay", "Actions"]} />
                <tbody>
                  {pending.map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium">{p.employees?.name ?? "—"}</TD>
                      <TD>{fmtDate(p.week_start)}</TD>
                      <TD>{p.total_hours}</TD>
                      <TD>{p.ot_hours}</TD>
                      <TD>{money(p.total_pay)}</TD>
                      <TD>
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => setStatus(p, "approved")}><Check size={14} /> Approve</Button>
                          <Button variant="secondary" onClick={() => setStatus(p, "paid")}><DollarSign size={14} /> Mark Paid</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Hours logger */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Hours logger</h2>
            <Card className="p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employee">
                  <Select value={empId} onChange={(e) => setEmpId(e.target.value)}>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {money(e.rate)}/hr</option>)}
                  </Select>
                </Field>
                <Field label="Week Start"><Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {DAY_LABELS.map((d, i) => (
                  <Field key={d} label={d}>
                    <Input type="number" min="0" step="0.25" value={hours[i] || ""} onChange={(e) => setHour(i, e.target.value)} />
                  </Field>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div className="flex gap-6">
                  <span>Total: <strong className="text-ink">{calc.totalHours} hrs</strong></span>
                  <span>Reg: <strong className="text-ink">{calc.regHours}</strong></span>
                  <span>OT: <strong className="text-ink">{calc.otHours}</strong></span>
                  <span>Pay: <strong className="text-ink">{money(calc.totalPay)}</strong></span>
                </div>
                <Button onClick={saveLog} disabled={saving}>{saving ? "Saving…" : "Save Log"}</Button>
              </div>
            </Card>
          </div>

          {/* History */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Pay log history</h2>
            {periods.length === 0 ? (
              <Card className="p-5 text-sm text-mute">No logs yet.</Card>
            ) : (
              <Table>
                <THead cols={["Employee", "Week", "Total Hours", "OT", "Pay", "Status"]} />
                <tbody>
                  {periods.map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium">{p.employees?.name ?? "—"}</TD>
                      <TD>{fmtDate(p.week_start)}</TD>
                      <TD>{p.total_hours}</TD>
                      <TD>{p.ot_hours}</TD>
                      <TD>{money(p.total_pay)}</TD>
                      <TD><StatusBadge status={p.status} /></TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function PayrollPage() {
  return (
    <OwnerShell>
      <PayrollInner />
    </OwnerShell>
  );
}
