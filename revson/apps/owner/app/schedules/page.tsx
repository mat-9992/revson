"use client";
import { useEffect, useMemo, useState } from "react";
import {
  supabaseBrowser, mondayOf, addDays, isoDate, fmtDate, DAY_LABELS,
  Button, Select, Field, Input, Modal, EmptyState, Skeleton, PageTitle, toast,
  type Employee, type Shift
} from "@revson/shared";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

function SchedulesInner() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => isoDate(mondayOf(new Date())));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<{ employeeId?: string; date?: string } | null>(null);
  const [form, setForm] = useState({ employeeId: "", date: "", start: "09:00", end: "17:00", role: "" });
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => {
    const base = new Date(weekStart + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => isoDate(addDays(base, i)));
  }, [weekStart]);

  function shiftWeek(delta: number) {
    setWeekStart((w) => isoDate(addDays(new Date(w + "T00:00:00"), delta)));
  }

  async function load() {
    if (!business) return;
    setLoading(true);
    const sb = supabaseBrowser();
    const [emps, sh] = await Promise.all([
      sb.from("employees").select("*").eq("business_id", business.id).order("name"),
      sb.from("shifts").select("*").eq("business_id", business.id).gte("date", days[0]).lte("date", days[6])
    ]);
    setEmployees((emps.data as Employee[]) ?? []);
    setShifts((sh.data as Shift[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business, weekStart]);

  function openAdd(employeeId?: string, date?: string) {
    const emp = employeeId ? employees.find((e) => e.id === employeeId) : undefined;
    setForm({ employeeId: employeeId ?? employees[0]?.id ?? "", date: date ?? days[0], start: "09:00", end: "17:00", role: emp?.role ?? "" });
    setModal({ employeeId, date });
  }

  async function save() {
    if (!business) return;
    if (!form.employeeId || !form.date) return toast.error("Pick an employee and date.");
    setBusy(true);
    const { error } = await supabaseBrowser().from("shifts").insert({
      business_id: business.id, employee_id: form.employeeId, date: form.date,
      start_time: form.start, end_time: form.end, role: form.role || null
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Shift added.");
    setModal(null);
    load();
  }

  async function del(id: string) {
    const { error } = await supabaseBrowser().from("shifts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setShifts((s) => s.filter((x) => x.id !== id));
  }

  const cell = (empId: string, date: string) => shifts.filter((s) => s.employee_id === empId && s.date === date);

  return (
    <>
      <PageTitle
        title="Schedules"
        desc="Week at a glance. Click a cell to add a shift."
        right={
          <div className="flex items-center gap-2">
            <button onClick={() => shiftWeek(-7)} className="rounded-lg border border-line p-2 text-mute hover:text-ink"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-ink">Week of {fmtDate(weekStart)}</span>
            <button onClick={() => shiftWeek(7)} className="rounded-lg border border-line p-2 text-mute hover:text-ink"><ChevronRight size={16} /></button>
            <Button onClick={() => openAdd()}><Plus size={15} /> Add Shift</Button>
          </div>
        }
      />

      {loading ? (
        <Skeleton className="h-72" />
      ) : employees.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No team to schedule" desc="Add employees first, then build their week here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50/60">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-mute">Employee</th>
                {days.map((d, i) => (
                  <th key={d} className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-mute">
                    {DAY_LABELS[i]} <span className="text-mute/70">{d.slice(5)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{e.name}</td>
                  {days.map((d) => (
                    <td key={d} className="px-2 py-2 align-top">
                      <div className="space-y-1">
                        {cell(e.id, d).map((s) => (
                          <div key={s.id} className="group flex items-center justify-between gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs text-accent">
                            <span>{s.start_time}–{s.end_time}</span>
                            <button onClick={() => del(s.id)} className="opacity-0 group-hover:opacity-100" aria-label="Delete shift"><X size={12} /></button>
                          </div>
                        ))}
                        <button onClick={() => openAdd(e.id, d)} className="w-full rounded-lg border border-dashed border-line py-1 text-xs text-mute hover:border-accent hover:text-accent">+</button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Add Shift"
        footer={<><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Add Shift"}</Button></>}
      >
        <div className="space-y-4">
          <Field label="Employee">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start"><Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
            <Field label="End"><Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
          </div>
          <Field label="Role (optional)"><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}

export default function SchedulesPage() {
  return (
    <OwnerShell>
      <SchedulesInner />
    </OwnerShell>
  );
}
