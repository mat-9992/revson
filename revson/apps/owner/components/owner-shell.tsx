"use client";
import {
  Shell, Badge, Button, Select, StatusBadge, Spinner, supabaseBrowser, APP_URLS, type NavItem
} from "@revson/shared";
import {
  LayoutDashboard, Users, CalendarDays, Wallet, FileText, Megaphone, Star, Settings, UserPlus, LogOut, Eye
} from "lucide-react";
import { BusinessProvider, useBusiness } from "./business-provider";

const NAV: NavItem[] = [
  { href: "/", label: "My Business Overview", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users },
  { href: "/schedules", label: "Schedules", icon: CalendarDays },
  { href: "/payroll", label: "Pay & Payroll", icon: Wallet },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/hiring", label: "Hiring Lab", icon: Megaphone },
  { href: "/reputation", label: "Reputation", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings }
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const { loading, business, businesses, impersonating, switchBusiness } = useBusiness();

  async function signOut() {
    localStorage.removeItem("rv_impersonate");
    await supabaseBrowser().auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-6 w-6" /></div>;
  }

  if (!business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-ink">No business found</h1>
          <p className="mt-2 text-sm text-mute">
            {impersonating
              ? "That business no longer exists."
              : "Your account isn't attached to a business yet. If you're a super admin, open a business with View As Owner."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => { window.location.href = APP_URLS.superAdmin; }}>Super Admin</Button>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Shell
      nav={NAV}
      sidebarHeader={
        businesses.length > 1 ? (
          <Select value={business.id} onChange={(e) => switchBusiness(e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        ) : undefined
      }
      topbarLeft={
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: business.brand_color }} />
          <span className="text-sm font-semibold text-ink">{business.name}</span>
          <StatusBadge status={business.subscription} />
        </div>
      }
      topbarRight={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { window.location.href = "/team?add=1"; }}>
            <UserPlus size={15} /> Add Employee
          </Button>
          <button onClick={signOut} className="ml-1 text-mute hover:text-ink" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      }
    >
      {impersonating && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Eye size={15} />
          Viewing as owner of <strong>{business.name}</strong> — you are a super admin.
          <button
            onClick={() => { localStorage.removeItem("rv_impersonate"); window.location.href = APP_URLS.superAdmin; }}
            className="ml-auto font-medium underline"
          >
            Exit
          </button>
        </div>
      )}
      {children}
    </Shell>
  );
}

export function OwnerShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <ShellInner>{children}</ShellInner>
    </BusinessProvider>
  );
}
