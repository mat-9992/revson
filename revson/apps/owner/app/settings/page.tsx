"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, Button, Input, Select, Field, Card, PageTitle, toast,
  BUSINESS_TYPES, BRAND_COLORS, type Business
} from "@revson/shared";
import { Save, Trash2 } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

type Draft = Pick<Business, "name" | "type" | "address" | "phone" | "email" | "owner_name" | "ein" | "brand_color">;

function SettingsInner() {
  const { business, refresh, impersonating } = useBusiness();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!business) return;
    setDraft({
      name: business.name, type: business.type, address: business.address, phone: business.phone,
      email: business.email, owner_name: business.owner_name, ein: business.ein, brand_color: business.brand_color
    });
  }, [business]);

  if (!business || !draft) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!business || !draft) return;
    if (!draft.name.trim()) return toast.error("Business name is required.");
    setSaving(true);
    const { error } = await supabaseBrowser().from("businesses").update({
      name: draft.name, type: draft.type, address: draft.address, phone: draft.phone,
      email: draft.email, owner_name: draft.owner_name, ein: draft.ein, brand_color: draft.brand_color
    }).eq("id", business.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved.");
    await refresh();
  }

  async function destroy() {
    if (!business) return;
    setDeleting(true);
    const { error } = await supabaseBrowser().from("businesses").delete().eq("id", business.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Business deleted.");
    localStorage.removeItem("rv_business");
    localStorage.removeItem("rv_impersonate");
    window.location.href = "/";
  }

  return (
    <>
      <PageTitle title="Settings" desc="Business details and account controls." />

      <Card className="max-w-2xl p-6">
        <div className="mb-4 text-sm font-semibold text-ink">Business details</div>
        <div className="space-y-4">
          <Field label="Business name *"><Input value={draft.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={draft.type} onChange={(e) => set("type", e.target.value)}>
                {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Phone"><Input value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          </div>
          <Field label="Address"><Input value={draft.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><Input type="email" value={draft.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Owner name"><Input value={draft.owner_name ?? ""} onChange={(e) => set("owner_name", e.target.value)} /></Field>
          </div>
          <Field label="EIN (optional)"><Input value={draft.ein ?? ""} onChange={(e) => set("ein", e.target.value)} placeholder="00-0000000" /></Field>
          <Field label="Brand color">
            <div className="flex items-center gap-2">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("brand_color", c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${draft.brand_color === c ? "border-ink" : "border-transparent"}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>
          <div className="pt-1">
            <Button onClick={save} disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </div>
      </Card>

      <Card className="mt-6 max-w-2xl border-red-200 p-6">
        <div className="text-sm font-semibold text-red-600">Danger zone</div>
        <p className="mt-1 text-sm text-mute">
          Deleting <strong>{business.name}</strong> permanently removes its employees, schedules, pay logs, documents,
          job posts, and reviews. This cannot be undone.
        </p>
        {impersonating && (
          <p className="mt-2 text-sm text-amber-700">You are impersonating this business as a super admin — delete with care.</p>
        )}
        <div className="mt-4 max-w-sm space-y-3">
          <Field label={'Type "DELETE" to confirm'}>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
          </Field>
          <Button variant="danger" onClick={destroy} disabled={confirmText !== "DELETE" || deleting}>
            <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete Business"}
          </Button>
        </div>
      </Card>
    </>
  );
}

export default function SettingsPage() {
  return (
    <OwnerShell>
      <SettingsInner />
    </OwnerShell>
  );
}
