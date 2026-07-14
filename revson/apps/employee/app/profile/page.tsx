"use client";
import { useState } from "react";
import { supabaseBrowser, money, Button, Card, Field, Input, Modal, PageTitle, toast } from "@revson/shared";
import { Pencil, Mail, Phone, Briefcase, DollarSign, Building2 } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-accent"><Icon size={16} /></span>
      <div>
        <div className="text-xs text-mute">{label}</div>
        <div className="text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}

function ProfileInner() {
  const { employee, business, profile, refresh } = useEmployee();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (!employee) return null;

  function openEdit() {
    setPhone(employee!.phone ?? "");
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    const { error } = await supabaseBrowser().from("employees").update({ phone: phone || null }).eq("id", employee!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Phone updated.");
    setEditing(false);
    await refresh();
  }

  return (
    <>
      <PageTitle title="Profile" desc="Your details. Update your phone number anytime." right={<Button variant="secondary" onClick={openEdit}><Pencil size={15} /> Edit phone</Button>} />

      <Card className="max-w-xl p-6">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-white" style={{ background: business?.brand_color ?? "#4F46E5" }}>
            {employee.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="text-base font-semibold text-ink">{employee.name}</div>
            <div className="text-sm text-mute">{employee.role ?? "Team member"}</div>
          </div>
        </div>

        <div className="mt-4">
          {profile?.email && <Row icon={Mail} label="Login email" value={profile.email} />}
          <Row icon={Phone} label="Phone" value={employee.phone ?? "Not set"} />
          <Row icon={Briefcase} label="Role" value={employee.role ?? "—"} />
          <Row icon={DollarSign} label="Pay rate" value={`${money(employee.rate)}/hr`} />
          {business && <Row icon={Building2} label="Workplace" value={business.name} />}
        </div>
      </Card>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit phone number"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" /></Field>
      </Modal>
    </>
  );
}

export default function ProfilePage() {
  return (
    <EmployeeShell>
      <ProfileInner />
    </EmployeeShell>
  );
}
