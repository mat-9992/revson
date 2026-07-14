"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, money, fmtDate, mondayOf, isoDate, StatCard, Button, Card, Skeleton, PageTitle, toast,
  type Shift
} from "@revson/shared";
import { Clock, CalendarClock, Wallet, CalendarDays, Play, Square } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function DashboardInner() {
  const { employee, business } = useEmployee();
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(0);
  const [pending, setPending] = useState(0);
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [clockedIn, setClockedIn] = useState(false);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const sb = supabaseBrowser();
      const week = isoDate(mondayOf(new Date()));
      const today = isoDate(new Date());
      const [wk, pend, next] = await Promise.all([
        sb.from("pay_periods").select("total_hours").eq("employee_id", employee.id).eq("week_start", week),
        sb.from("pay_periods").select("total_pay").eq("employee_id", employee.id).eq("status", "pending"),
        sb.from("shifts").select("*").eq("employee_id", employee.id).gte("date", today).order("date", { ascending: true }).limit(1)
      ]);
      setHours((wk.data ?? []).reduce((s, r) => s + Number(r.total_hours ?? 0), 0));
      setPending((pend.data ?? []).reduce((s, r) => s + Number(r.total_pay ?? 0), 0));
      setNextShift(((next.data as Shift[]) ?? [])[0] ?? null);
      setLoading(false);
    })();
  }, [employee]);

  if (!employee) return null;

  function clock() {
    setClockedIn((v) => !v);
    toast.success(clockedIn ? "Clocked out — have a good one." : "Clocked in. Time is running.");
  }

  return (
    <>
      <PageTitle title={`Welcome, ${employee.name.split(" ")[0]}`} desc={business ? `${employee.role ?? "Team member"} · ${business.name}` : undefined} />

      {loading ? (
        <Skeleton className="h-28" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Hours this week" value={`${hours} hrs`} icon={Clock} />
          <StatCard label="Next shift" value={nextShift ? fmtDate(nextShift.date) : "None scheduled"} icon={CalendarClock} />
          <StatCard label="Pay pending" value={money(pending)} icon={Wallet} />
        </div>
      )}

      <Card className="mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">Time clock</div>
          <div className="text-sm text-mute">{clockedIn ? "You’re on the clock." : "You’re clocked out."}</div>
        </div>
        <Button variant={clockedIn ? "danger" : "primary"} onClick={clock}>
          {clockedIn ? <><Square size={15} /> Clock Out</> : <><Play size={15} /> Clock In</>}
        </Button>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button onClick={() => { window.location.href = "/schedule"; }} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 text-left shadow-sm transition hover:border-slate-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-accent"><CalendarDays size={18} /></span>
          <div>
            <div className="text-sm font-semibold text-ink">View schedule</div>
            <div className="text-xs text-mute">See your upcoming shifts</div>
          </div>
        </button>
        <button onClick={() => { window.location.href = "/pay"; }} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 text-left shadow-sm transition hover:border-slate-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-accent"><Wallet size={18} /></span>
          <div>
            <div className="text-sm font-semibold text-ink">View pay</div>
            <div className="text-xs text-mute">Check hours and pay stubs</div>
          </div>
        </button>
      </div>
    </>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <EmployeeShell>
      <DashboardInner />
    </EmployeeShell>
  );
}
