"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, money, fmtDate, Table, THead, TR, TD, StatusBadge, Badge, Drawer, EmptyState,
  Skeleton, PageTitle, Disclaimer, type PayPeriod
} from "@revson/shared";
import { Wallet } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function PayInner() {
  const { employee, business } = useEmployee();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PayPeriod[]>([]);
  const [selected, setSelected] = useState<PayPeriod | null>(null);

  useEffect(() => {
    if (!employee) return;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("pay_periods").select("*").eq("employee_id", employee.id).order("week_start", { ascending: false });
      setRows((data as PayPeriod[]) ?? []);
      setLoading(false);
    })();
  }, [employee]);

  if (!employee) return null;

  const reg = selected ? Math.max(Number(selected.total_hours) - Number(selected.ot_hours), 0) : 0;

  return (
    <>
      <PageTitle title="My Pay" desc="Your logged hours and pay stubs." />

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No pay history yet" desc="Once your manager logs hours for a week, your pay stubs appear here." />
      ) : (
        <Table>
          <THead cols={["Week of", "Total Hours", "OT Hours", "Total Pay", "Status"]} />
          <tbody>
            {rows.map((p) => (
              <TR key={p.id} onClick={() => setSelected(p)}>
                <TD className="font-medium">{fmtDate(p.week_start)}</TD>
                <TD>{p.total_hours} hrs</TD>
                <TD>{p.ot_hours > 0 ? <Badge tone="amber">{p.ot_hours} hrs</Badge> : "0 hrs"}</TD>
                <TD className="font-medium">{money(p.total_pay)}</TD>
                <TD><StatusBadge status={p.status} /></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Pay stub">
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink">{employee.name}</div>
                <div className="text-xs text-mute">{business?.name ?? "Revson"}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="rounded-xl border border-line bg-slate-50 p-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">Week of {fmtDate(selected.week_start)}</div>
              <dl className="space-y-2">
                <div className="flex justify-between"><dt className="text-mute">Regular hours</dt><dd className="text-ink">{reg} hrs</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Overtime hours</dt><dd className="text-ink">{selected.ot_hours} hrs</dd></div>
                <div className="flex justify-between"><dt className="text-mute">Rate</dt><dd className="text-ink">{money(employee.rate)}/hr</dd></div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt className="text-ink">Total pay</dt><dd className="text-ink">{money(selected.total_pay)}</dd></div>
              </dl>
            </div>

            <Disclaimer>This is an estimate for your reference — not an official pay statement, tax document, or payroll advice.</Disclaimer>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function PayPage() {
  return (
    <EmployeeShell>
      <PayInner />
    </EmployeeShell>
  );
}
