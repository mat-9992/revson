"use client";
import { Shell, Button, Spinner, supabaseBrowser, APP_URLS, type NavItem } from "@revson/shared";
import { LayoutDashboard, CalendarDays, Wallet, FileText, CheckSquare, User, LogOut } from "lucide-react";
import { EmployeeProvider, useEmployee } from "./employee-provider";

const NAV: NavItem[] = [
  { href: "/", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "My Schedule", icon: CalendarDays },
  { href: "/pay", label: "My Pay", icon: Wallet },
  { href: "/documents", label: "My Documents", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/profile", label: "Profile", icon: User }
];

async function signOut() {
  await supabaseBrowser().auth.signOut();
  window.location.href = "/login";
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { loading, employee, business } = useEmployee();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-6 w-6" /></div>;
  }

  if (!employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-ink">Account not linked yet</h1>
          <p className="mt-2 text-sm text-mute">
            Your login isn&apos;t connected to an employee record. Ask your manager to re-send your invite,
            then sign in again.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => { window.location.href = APP_URLS.marketing; }}>Home</Button>
            <Button variant="secondary" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Shell
      nav={NAV}
      width={240}
      sidebarHeader={
        <div className="px-1">
          <div className="text-sm font-semibold text-ink">{employee.name}</div>
          <div className="text-xs text-mute">{employee.role ?? "Team member"}</div>
        </div>
      }
      topbarLeft={<span className="text-sm font-semibold text-ink">{business?.name ?? "Revson"}</span>}
      topbarRight={
        <button onClick={signOut} className="text-mute hover:text-ink" title="Sign out">
          <LogOut size={16} />
        </button>
      }
    >
      {children}
    </Shell>
  );
}

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <EmployeeProvider>
      <ShellInner>{children}</ShellInner>
    </EmployeeProvider>
  );
}
