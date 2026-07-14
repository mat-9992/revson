"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  supabaseBrowser, money, mondayOf, Button, Input, Select, Field, Modal, Table, THead, TR, TD,
  StatusBadge, EmptyState, Skeleton, PageTitle, toast, EMPLOYEE_ROLES, type Employee
} from "@revson/shared";
import { Users, Pencil, Trash2, UserPlus, Send, Copy } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

const EMPTY = { name: "", role: EMPLOYEE_ROLES[0], rate: "", phone: "", createLogin: false, email: "" };

function TeamInner() {
  const { business } = useBusiness();
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Employee[]>([]);
  const [hoursByEmp, setHoursByEmp] = useState<Record<string, number>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { if (params.get("add") === "1") setAddOpen(true); }, [params]);

  async function load() {
    if (!business) return;
    const sb = supabaseBrowser();
    const week = mondayOf(new Date());
    const [emps, pays] = await Promise.all([
      sb.from("employees").select("*").eq("business_id", business.id).order("created_at", { ascending: true }),
      sb.from("pay_periods").select("employee_id, total_hours").eq("business_id", business.id).eq("week_start", week)
    ]);
    setRows((emps.data as Employee[]) ?? []);
    const map: Record<string, number> = {};
    (pays.data ?? []).forEach((p) => { map[p.employee_id] = (map[p.employee_id] ?? 0) + Number(p.total_hours ?? 0); });
    setHoursByEmp(map);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function create() {
    if (!business) return;
    if (!form.name.trim()) return toast.error("Name is required.");
    setBusy(true);
    if (form.createLogin) {
      const res = await fetch("/api/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id, name: form.name, role: form.role,
          rate: Number(form.rate || 0), phone: form.phone || null, email: form.email || null
        })
      });
      setBusy(false);
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Invite failed." }));
        return toast.error(error ?? "Invite failed.");
      }
      const data = await res.json();
      toast.success("Employee invited.");
      if (data.credentials) setCreds(data.credentials);
    } else {
      const { error } = await supabaseBrowser().from("employees").insert({
        business_id: business.id, name: form.name, role: form.role,
        rate: Number(form.rate || 0), phone: form.phone || null, status: "active"
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Employee added.");
    }
    setAddOpen(false);
    setForm({ ...EMPTY });
    router.replace("/team");
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabaseBrowser().from("employees").update({
      name: editing.name, role: editing.role, rate: editing.rate, phone: editing.phone, status: editing.status
    }).eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Employee saved.");
    setEditing(null);
    load();
  }

  async function resend(emp: Employee) {
    const res = await fetch("/api/invite-employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resend: true, employeeId: emp.id, businessId: emp.business_id })
    });
    if (!res.ok) return toast.error("Could not create invite link.");
    const { link } = await res.json();
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied — send it to them.");
  }

  async function remove(emp: Employee) {
    if (!confirm(`Remove ${emp.name}? Their shifts and pay logs will be deleted.`)) return;
    const { error } = await supabaseBrowser().from("employees").delete().eq("id", emp.id);
    if (error) return toast.error(error.message);
    toast.success("Employee removed.");
    setRows((r) => r.filter((x) => x.id !== emp.id));
  }

  const totalHours = useMemo(() => Object.values(hoursByEmp).reduce((s, h) => s + h, 0), [hoursByEmp]);

  return (
    <>
      <PageTitle
        title="Team"
        desc={rows.length ? `${rows.length} people · ${totalHours} hrs logged this week` : "Your people, rates and access."}
        right={<Button onClick={() => setAddOpen(true)}><UserPlus size={15} /> Add Employee</Button>}
      />

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          desc="Add your first team member — give them a login and they get their own portal."
          action={<Button onClick={() => setAddOpen(true)}><UserPlus size={15} /> Add First Employee</Button>}
        />
      ) : (
        <Table>
          <THead cols={["Name", "Role", "Rate", "Status", "Hours This Week", "Actions"]} />
          <tbody>
            {rows.map((e) => (
              <TR key={e.id}>
                <TD className="font-medium">{e.name}</TD>
                <TD>{e.role ?? "—"}</TD>
                <TD>{money(e.rate)}/hr</TD>
                <TD><StatusBadge status={e.status} /></TD>
                <TD>{hoursByEmp[e.id] ?? 0} hrs</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    {e.status === "invited" && e.user_id && (
                      <button onClick={() => resend(e)} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="Resend invite">
                        <Send size={15} />
                      </button>
                    )}
                    <button onClick={() => setEditing({ ...e })} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(e)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add Employee */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); router.replace("/team"); }}
        title="Add Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setAddOpen(false); router.replace("/team"); }}>Cancel</Button>
            <Button onClick={create} disabled={busy}>{busy ? "Saving…" : "Add Employee"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select value={form.role} onChange={(e) => set("role", e.target.value)}>
                {EMPLOYEE_ROLES.map((r) => <option key={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Rate ($/hr)"><Input type="number" min="0" step="0.5" value={form.rate} onChange={(e) => set("rate", e.target.value)} /></Field>
          </div>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.createLogin} onChange={(e) => set("createLogin", e.target.checked)} className="h-4 w-4 rounded border-line text-accent" />
            Create login — they get access to the employee portal
          </label>
          {form.createLogin && (
            <Field label="Login email (optional — we'll generate one if blank)">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="worker@example.com" />
            </Field>
          )}
        </div>
      </Modal>

      {/* Credentials */}
      <Modal open={!!creds} onClose={() => setCreds(null)} title="Employee login created" footer={<Button onClick={() => setCreds(null)}>Done</Button>}>
        {creds && (
          <div className="space-y-3 text-sm">
            <p className="text-mute">Hand these to your employee. They log in at the employee portal.</p>
            <div className="rounded-xl border border-line bg-slate-50 p-4 font-mono text-xs">
              <p>Email: {creds.email}</p>
              <p>Temp password: {creds.password}</p>
            </div>
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`); toast.success("Copied."); }}>
              <Copy size={14} /> Copy credentials
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Role">
                <Select value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {EMPLOYEE_ROLES.map((r) => <option key={r}>{r}</option>)}
                </Select>
              </Field>
              <Field label="Rate ($/hr)"><Input type="number" min="0" step="0.5" value={editing.rate} onChange={(e) => setEditing({ ...editing, rate: Number(e.target.value) })} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Employee["status"] })}>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function TeamPage() {
  return (
    <OwnerShell>
      <Suspense>
        <TeamInner />
      </Suspense>
    </OwnerShell>
  );
}
