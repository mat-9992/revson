"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabaseBrowser, fmtDate, StatCard, Card, Badge, Skeleton, PageTitle
} from "@revson/shared";
import { Users, FileText, Wallet, CalendarDays, UserPlus, Upload, Megaphone, Star } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

interface Activity { kind: string; label: string; created_at: string }

function OverviewInner() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ team: 0, docs: 0, pending: 0, shifts: 0 });
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const sb = supabaseBrowser();
      const today = new Date().toISOString().slice(0, 10);
      const [team, docs, pending, shifts, dRows, pRows, jRows, rRows] = await Promise.all([
        sb.from("employees").select("*", { count: "exact", head: true }).eq("business_id", business.id),
        sb.from("documents").select("*", { count: "exact", head: true }).eq("business_id", business.id),
        sb.from("pay_periods").select("*", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "pending"),
        sb.from("shifts").select("*", { count: "exact", head: true }).eq("business_id", business.id).gte("date", today),
        sb.from("documents").select("file_name, created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
        sb.from("pay_periods").select("week_start, created_at, employees(name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
        sb.from("job_posts").select("title, created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
        sb.from("reviews").select("stars, created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5)
      ]);
      setStats({ team: team.count ?? 0, docs: docs.count ?? 0, pending: pending.count ?? 0, shifts: shifts.count ?? 0 });

      const acts: Activity[] = [
        ...(dRows.data ?? []).map((d) => ({ kind: "Document", label: `Analyzed ${d.file_name ?? "a document"}`, created_at: d.created_at })),
        ...(pRows.data ?? []).map((p) => {
          const emp = p.employees as unknown as { name: string } | null;
          return { kind: "Payroll", label: `Logged hours for ${emp?.name ?? "an employee"} (week of ${fmtDate(p.week_start)})`, created_at: p.created_at };
        }),
        ...(jRows.data ?? []).map((j) => ({ kind: "Hiring", label: `Job post: ${j.title ?? "Untitled"}`, created_at: j.created_at })),
        ...(rRows.data ?? []).map((r) => ({ kind: "Review", label: `Responded to a ${r.stars ?? "?"}★ review`, created_at: r.created_at }))
      ].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);
      setActivity(acts);
      setLoading(false);
    })();
  }, [business]);

  if (!business) return null;

  const quick = [
    { href: "/team?add=1", label: "Add employee", icon: UserPlus },
    { href: "/documents", label: "Upload a lease", icon: Upload },
    { href: "/hiring", label: "Write a job post", icon: Megaphone },
    { href: "/reputation", label: "Answer a review", icon: Star }
  ];

  return (
    <>
      <PageTitle
        title={business.name}
        desc={business.address ?? undefined}
        right={<Badge tone="indigo">{business.type}</Badge>}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Team" value={stats.team} icon={Users} />
          <StatCard label="Docs Analyzed" value={stats.docs} icon={FileText} />
          <StatCard label="Payroll Pending" value={stats.pending} icon={Wallet} />
          <StatCard label="Open Shifts" value={stats.shifts} icon={CalendarDays} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Quick actions</h2>
            <div className="grid gap-3 sm:grid-cols-4">
              {quick.map((q) => (
                <Link key={q.href} href={q.href} className="flex flex-col items-start gap-2 rounded-2xl border border-line bg-white p-4 shadow-sm transition-colors hover:border-accent">
                  <q.icon size={18} className="text-accent" />
                  <span className="text-sm font-medium text-ink">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Recent activity</h2>
            <Card className="divide-y divide-line">
              {activity.length === 0 ? (
                <p className="p-5 text-sm text-mute">Nothing yet. Your first upload, hire or review response will show up here.</p>
              ) : (
                activity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Badge tone="gray">{a.kind}</Badge>
                      <span className="text-sm text-ink">{a.label}</span>
                    </div>
                    <span className="text-xs text-mute">{fmtDate(a.created_at)}</span>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Business details</h2>
          <Card className="p-5 text-sm">
            <dl className="space-y-3">
              {[
                ["Name", business.name],
                ["Type", business.type],
                ["Address", business.address],
                ["Phone", business.phone],
                ["Email", business.email],
                ["Owner", business.owner_name],
                ["Plan", business.subscription]
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4">
                  <dt className="text-mute">{k}</dt>
                  <dd className="text-right font-medium text-ink">{(v as string) ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <OwnerShell>
      <OverviewInner />
    </OwnerShell>
  );
}
