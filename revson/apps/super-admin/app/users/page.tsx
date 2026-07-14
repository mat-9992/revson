"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, fmtDate, Table, THead, TR, TD, Badge, EmptyState, Skeleton, PageTitle, toast, type Profile
} from "@revson/shared";
import { Users, KeyRound, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

type Row = Profile & { businesses: { name: string } | null };

const ROLE_TONE: Record<string, "indigo" | "green" | "gray"> = {
  super_admin: "indigo",
  owner: "green",
  employee: "gray"
};

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    const { data } = await supabaseBrowser()
      .from("profiles")
      .select("*, businesses(name)")
      .order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function resetPassword(u: Row) {
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: u.email })
    });
    if (!res.ok) return toast.error("Could not generate reset link.");
    const { link } = await res.json();
    await navigator.clipboard.writeText(link);
    toast.success("Password reset link copied to clipboard.");
  }

  async function remove(u: Row) {
    if (u.role === "super_admin") return toast.error("Cannot delete a super admin here.");
    if (!confirm(`Delete user ${u.email}?`)) return;
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id })
    });
    if (!res.ok) return toast.error("Delete failed.");
    toast.success("User deleted.");
    setRows((r) => r.filter((x) => x.id !== u.id));
  }

  return (
    <AdminShell>
      <PageTitle title="Users & Owners" desc="Every login across every workspace." />
      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" desc="Users appear here when businesses register or you add them." />
      ) : (
        <Table>
          <THead cols={["Email", "Name", "Role", "Business", "Created", "Actions"]} />
          <tbody>
            {rows.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">{u.email}</TD>
                <TD>{u.name ?? "—"}</TD>
                <TD><Badge tone={ROLE_TONE[u.role] ?? "gray"}>{u.role.replace("_", " ")}</Badge></TD>
                <TD className="text-mute">{u.businesses?.name ?? "—"}</TD>
                <TD className="text-mute">{fmtDate(u.created_at)}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <button onClick={() => resetPassword(u)} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="Reset Password">
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => remove(u)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
