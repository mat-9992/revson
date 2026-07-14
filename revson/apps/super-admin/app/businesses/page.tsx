"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  supabaseBrowser, moneyInt, fmtDate, Button, Input, Select, Field, Modal, Table, THead, TR, TD,
  StatusBadge, EmptyState, Skeleton, PageTitle, toast, APP_URLS,
  BUSINESS_TYPES, BRAND_COLORS, cn, type Business
} from "@revson/shared";
import { Building2, Eye, Pencil, Trash2, Plus, Search, Copy } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";

type BizRow = Business & { employees: { count: number }[] };

const EMPTY_FORM = {
  name: "", type: BUSINESS_TYPES[0], address: "", phone: "", email: "",
  owner_name: "", owner_email: "", brand_color: BRAND_COLORS[0], subscription: "trial"
};

function BusinessesInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BizRow[]>([]);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [editing, setEditing] = useState<Business | null>(null);

  async function load() {
    const sb = supabaseBrowser();
    const { data } = await sb
      .from("businesses")
      .select("*, employees(count)")
      .order("created_at", { ascending: false });
    setRows((data as BizRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { if (params.get("add") === "1") setAddOpen(true); }, [params]);

  const filtered = useMemo(
    () => rows.filter((r) => (r.name + " " + (r.owner_name ?? "") + " " + r.type).toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  function set<K extends keyof typeof EMPTY_FORM>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function create() {
    if (!form.name.trim()) return toast.error("Business name is required.");
    if (!form.owner_email.trim()) return toast.error("Owner email is required.");
    setBusy(true);
    const res = await fetch("/api/admin/create-business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Create failed." }));
      return toast.error(error ?? "Create failed.");
    }
    const data = await res.json();
    toast.success("Business created and owner invited.");
    setAddOpen(false);
    setForm({ ...EMPTY_FORM });
    if (data.tempPassword) setCreds({ email: form.owner_email, password: data.tempPassword });
    router.replace("/businesses");
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from("businesses").update({
      name: editing.name, type: editing.type, address: editing.address, phone: editing.phone,
      email: editing.email, owner_name: editing.owner_name, brand_color: editing.brand_color,
      subscription: editing.subscription
    }).eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Business saved.");
    setEditing(null);
    load();
  }

  async function remove(b: Business) {
    if (!confirm(`Delete ${b.name}? All employees, documents and pay data will be removed.`)) return;
    const { error } = await supabaseBrowser().from("businesses").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Business deleted.");
    setRows((r) => r.filter((x) => x.id !== b.id));
  }

  const colorPicker = (value: string, onPick: (c: string) => void) => (
    <div className="flex gap-2">
      {BRAND_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={cn("h-7 w-7 rounded-full border-2", value === c ? "border-ink" : "border-transparent")}
          style={{ background: c }}
          aria-label={c}
        />
      ))}
    </div>
  );

  return (
    <AdminShell>
      <PageTitle
        title="Businesses"
        desc="Every workspace on Revson."
        right={<Button onClick={() => setAddOpen(true)}><Plus size={15} /> Add Business</Button>}
      />

      <div className="mb-4 relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <Input placeholder="Search businesses…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={rows.length === 0 ? "No businesses yet" : "No matches"}
          desc={rows.length === 0 ? "Create the first workspace — the owner gets their own portal instantly." : "Try a different search."}
          action={rows.length === 0 ? <Button onClick={() => setAddOpen(true)}><Plus size={15} /> Add First Business</Button> : undefined}
        />
      ) : (
        <Table>
          <THead cols={["Name", "Type", "Owner", "Employees", "Plan", "MRR", "Created", "Actions"]} />
          <tbody>
            {filtered.map((b) => (
              <TR key={b.id}>
                <TD className="font-medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.brand_color }} />
                    {b.name}
                  </span>
                </TD>
                <TD>{b.type}</TD>
                <TD className="text-mute">{b.owner_name ?? "—"}</TD>
                <TD>{b.employees?.[0]?.count ?? 0}</TD>
                <TD><StatusBadge status={b.subscription} /></TD>
                <TD>{moneyInt(b.mrr)}</TD>
                <TD className="text-mute">{fmtDate(b.created_at)}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <a
                      href={`${APP_URLS.owner}/?impersonate=${b.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink"
                      title="View As Owner"
                    >
                      <Eye size={15} />
                    </a>
                    <button onClick={() => setEditing({ ...b })} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(b)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add Business */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); router.replace("/businesses"); }}
        title="Add Business"
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={busy}>{busy ? "Creating…" : "Create Business"}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business Name *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Business Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Subscription">
            <Select value={form.subscription} onChange={(e) => set("subscription", e.target.value)}>
              <option value="trial">Trial — $0</option>
              <option value="starter">Starter — $49</option>
              <option value="pro">Pro — $149</option>
              <option value="business">Business — $299</option>
            </Select>
          </Field>
          <Field label="Owner Name"><Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></Field>
          <Field label="Owner Email *"><Input type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Brand Color">{colorPicker(form.brand_color, (c) => set("brand_color", c))}</Field>
          </div>
        </div>
      </Modal>

      {/* Owner credentials */}
      <Modal
        open={!!creds}
        onClose={() => setCreds(null)}
        title="Owner login created"
        footer={<Button onClick={() => setCreds(null)}>Done</Button>}
      >
        {creds && (
          <div className="space-y-3 text-sm">
            <p className="text-mute">Share these credentials with the owner. They can change the password after logging in.</p>
            <div className="rounded-xl border border-line bg-slate-50 p-4 font-mono text-xs">
              <p>Email: {creds.email}</p>
              <p>Temp password: {creds.password}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => { navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`); toast.success("Copied."); }}
            >
              <Copy size={14} /> Copy credentials
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit Business */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Business"
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business Name"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Type">
              <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Address"><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></Field>
            <Field label="Phone"><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
            <Field label="Business Email"><Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Subscription">
              <Select value={editing.subscription} onChange={(e) => setEditing({ ...editing, subscription: e.target.value as Business["subscription"] })}>
                <option value="trial">Trial — $0</option>
                <option value="starter">Starter — $49</option>
                <option value="pro">Pro — $149</option>
                <option value="business">Business — $299</option>
              </Select>
            </Field>
            <Field label="Owner Name"><Input value={editing.owner_name ?? ""} onChange={(e) => setEditing({ ...editing, owner_name: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <Field label="Brand Color">{colorPicker(editing.brand_color, (c) => setEditing({ ...editing, brand_color: c }))}</Field>
            </div>
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense>
      <BusinessesInner />
    </Suspense>
  );
}
