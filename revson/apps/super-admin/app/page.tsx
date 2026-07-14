"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabaseBrowser, moneyInt, fmtDate, StatCard, Card, Table, THead, TR, TD,
  StatusBadge, EmptyState, Skeleton, PageTitle, type Business
} from "@revson/shared";
import { Building2, DollarSign, Users, FileText } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

export default function GlobalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ businesses: 0, mrr: 0, employees: 0, documents: 0 });
  const [recent, setRecent] = useState<Business[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const [b, e, d, mrrRows, last] = await Promise.all([
        sb.from("businesses").select("*", { count: "exact", head: true }),
        sb.from("employees").select("*", { count: "exact", head: true }),
        sb.from("documents").select("*", { count: "exact", head: true }),
        sb.from("businesses").select("mrr"),
        sb.from("businesses").select("*").order("created_at", { ascending: false }).limit(5)
      ]);
      setStats({
        businesses: b.count ?? 0,
        employees: e.count ?? 0,
        documents: d.count ?? 0,
        mrr: (mrrRows.data ?? []).reduce((s, r) => s + (r.mrr ?? 0), 0)
      });
      setRecent((last.data as Business[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell>
      <PageTitle title="Global Dashboard" desc="Everything across every Revson workspace." />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Businesses" value={stats.businesses} icon={Building2} />
            <StatCard label="Total MRR" value={moneyInt(stats.mrr)} icon={DollarSign} />
            <StatCard label="Total Employees" value={stats.employees} icon={Users} />
            <StatCard label="Docs Processed" value={stats.documents} icon={FileText} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-ink">Recent businesses</h2>
              {recent.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No businesses yet"
                  desc="Add your first business or seed demo data to see Revson in action."
                  action={<Link href="/businesses?add=1" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">Add First Business</Link>}
                />
              ) : (
                <Table>
                  <THead cols={["Name", "Type", "Plan", "MRR", "Created"]} />
                  <tbody>
                    {recent.map((b) => (
                      <TR key={b.id}>
                        <TD className="font-medium">{b.name}</TD>
                        <TD>{b.type}</TD>
                        <TD><StatusBadge status={b.subscription} /></TD>
                        <TD>{moneyInt(b.mrr)}</TD>
                        <TD className="text-mute">{fmtDate(b.created_at)}</TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink">MRR</h2>
              <p className="mt-1 text-xs text-mute">Chart coming soon.</p>
              <div className="mt-4 flex h-40 items-end gap-2">
                {[28, 44, 36, 58, 70, 64, 82].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-lg bg-indigo-100" style={{ height: `${h}%` }} />
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminShell>
  );
}
