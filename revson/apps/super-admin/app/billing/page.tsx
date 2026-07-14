"use client";
import { useEffect, useMemo, useState } from "react";
import {
  supabaseBrowser, moneyInt, StatCard, Table, THead, TR, TD, StatusBadge, EmptyState, Skeleton, PageTitle,
  PLAN_MRR, type Business, type Subscription
} from "@revson/shared";
import { CreditCard } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

const PLANS: Subscription[] = ["trial", "starter", "pro", "business"];

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Business[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser().from("businesses").select("*").order("mrr", { ascending: false });
      setRows((data as Business[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const byPlan = useMemo(() => {
    const m = new Map<Subscription, { count: number; mrr: number }>();
    PLANS.forEach((p) => m.set(p, { count: 0, mrr: 0 }));
    rows.forEach((b) => {
      const e = m.get(b.subscription)!;
      e.count += 1;
      e.mrr += b.mrr ?? 0;
    });
    return m;
  }, [rows]);

  const total = rows.reduce((s, b) => s + (b.mrr ?? 0), 0);

  return (
    <AdminShell>
      <PageTitle title="Billing" desc={`Total MRR ${moneyInt(total)} across ${rows.length} businesses.`} />
      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="No billing yet" desc="MRR shows up here as businesses pick plans." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <StatCard
                key={p}
                label={`${p[0].toUpperCase()}${p.slice(1)} — ${moneyInt(PLAN_MRR[p])}/mo`}
                value={`${byPlan.get(p)!.count} · ${moneyInt(byPlan.get(p)!.mrr)}`}
              />
            ))}
          </div>
          <div className="mt-8">
            <Table>
              <THead cols={["Business", "Plan", "MRR"]} />
              <tbody>
                {rows.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-medium">{b.name}</TD>
                    <TD><StatusBadge status={b.subscription} /></TD>
                    <TD>{moneyInt(b.mrr)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
