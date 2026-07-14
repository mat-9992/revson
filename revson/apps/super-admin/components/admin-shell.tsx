"use client";
import { useState } from "react";
import {
  Shell, Badge, Button, toast, supabaseBrowser,
  type NavItem
} from "@revson/shared";
import { LayoutDashboard, Building2, Users, CreditCard, LifeBuoy, Plus, Database, Trash2, LogOut } from "lucide-react";

const NAV: NavItem[] = [
  { href: "/", label: "Global Dashboard", icon: LayoutDashboard },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/users", label: "Users & Owners", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/support", label: "Support", icon: LifeBuoy }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [seeding, setSeeding] = useState(false);
  const [wiping, setWiping] = useState(false);

  async function seed() {
    setSeeding(true);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    setSeeding(false);
    if (!res.ok) return toast.error("Seed failed.");
    toast.success("Demo data seeded.");
    setTimeout(() => window.location.reload(), 600);
  }

  async function deleteAll() {
    if (!confirm("Delete ALL businesses, users and data? This cannot be undone.")) return;
    setWiping(true);
    const res = await fetch("/api/admin/delete-all", { method: "POST" });
    setWiping(false);
    if (!res.ok) return toast.error("Delete failed.");
    toast.success("All data deleted.");
    setTimeout(() => window.location.reload(), 600);
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <Shell
      nav={NAV}
      topbarLeft={<Badge tone="indigo">Super Admin</Badge>}
      topbarRight={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={seed} disabled={seeding}>
            <Database size={15} /> {seeding ? "Seeding…" : "Seed Demo Data"}
          </Button>
          <Button variant="danger" onClick={deleteAll} disabled={wiping}>
            <Trash2 size={15} /> {wiping ? "Deleting…" : "Delete All Data"}
          </Button>
          <Button onClick={() => { window.location.href = "/businesses?add=1"; }}>
            <Plus size={15} /> Add Business
          </Button>
          <button onClick={signOut} className="ml-1 text-mute hover:text-ink" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      }
    >
      {children}
    </Shell>
  );
}
