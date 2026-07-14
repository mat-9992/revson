"use client";
import { useEffect, useMemo, useState } from "react";
import {
  supabaseBrowser, fmtDate, mondayOf, isoDate, Card, EmptyState, Skeleton, PageTitle, Badge,
  type Shift
} from "@revson/shared";
import { CalendarDays, Clock } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function fmtTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:${m ?? "00"} ${ampm}`;
}

function ScheduleInner() {
  const { employee } = useEmployee();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("shifts").select("*").eq("employee_id", employee.id).order("date", { ascending: true });
      setShifts((data as Shift[]) ?? []);
      setLoading(false);
    })();
  }, [employee]);

  const weeks = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const wk = isoDate(mondayOf(new Date(s.date + "T00:00:00")));
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk)!.push(s);
    }
    return Array.from(map.entries());
  }, [shifts]);

  if (!employee) return null;

  return (
    <>
      <PageTitle title="My Schedule" desc={shifts.length ? `${shifts.length} shifts scheduled` : "Your upcoming shifts."} />

      {loading ? (
        <Skeleton className="h-64" />
      ) : shifts.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No shifts scheduled" desc="When your manager adds you to the schedule, your shifts show up here." />
      ) : (
        <div className="space-y-6">
          {weeks.map(([wk, list]) => (
            <div key={wk}>
              <div className="mb-2 text-sm font-semibold text-ink">Week of {fmtDate(wk)}</div>
              <div className="space-y-2">
                {list.map((s) => {
                  const start = fmtTime(s.start_time);
                  const end = fmtTime(s.end_time);
                  return (
                    <Card key={s.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="text-sm font-medium text-ink">{fmtDate(s.date)}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm text-mute">
                          <Clock size={14} />
                          {start && end ? `${start} – ${end}` : start ? `From ${start}` : "Time TBD"}
                        </div>
                      </div>
                      {s.role && <Badge tone="indigo">{s.role}</Badge>}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function SchedulePage() {
  return (
    <EmployeeShell>
      <ScheduleInner />
    </EmployeeShell>
  );
}
