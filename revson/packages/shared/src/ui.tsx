"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { X, type LucideIcon } from "lucide-react";
export { Toaster, toast } from "sonner";

export const cn = clsx;

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "yellow";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-white hover:bg-indigo-700",
    secondary: "bg-white text-ink border border-line hover:bg-slate-50",
    ghost: "text-mute hover:text-ink hover:bg-slate-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    yellow: "bg-sun text-coal hover:brightness-95"
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-white rounded-2xl border border-line shadow-sm", className)} {...props} />;
}

export function StatCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: LucideIcon }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-mute">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
        </div>
        {Icon && (
          <span className="rounded-xl bg-indigo-50 p-2 text-accent">
            <Icon size={18} />
          </span>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type BadgeTone = "gray" | "green" | "amber" | "red" | "indigo" | "yellow";

export function Badge({ tone = "gray", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  const tones: Record<BadgeTone, string> = {
    gray: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-accent",
    yellow: "bg-sun/20 text-amber-800"
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeTone> = {
    active: "green", invited: "amber", inactive: "gray",
    pending: "amber", approved: "indigo", paid: "green",
    draft: "gray", live: "green",
    trial: "amber", starter: "gray", pro: "indigo", business: "green"
  };
  return <Badge tone={map[status] ?? "gray"} className="capitalize">{status}</Badge>;
}

export function RiskBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge>—</Badge>;
  if (score > 70) return <Badge tone="red">High · {score}</Badge>;
  if (score >= 40) return <Badge tone="amber">Medium · {score}</Badge>;
  return <Badge tone="green">Low · {score}</Badge>;
}

/* ---------------------------------- Inputs --------------------------------- */

const fieldBase =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[96px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open, onClose, title, children, footer, wide
}: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className={cn("relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-white shadow-xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-mute hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({
  open, onClose, title, children
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-line bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-mute hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------------- Table ---------------------------------- */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-line bg-slate-50/60">
        {cols.map((c) => (
          <th key={c} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-mute">{c}</th>
        ))}
      </tr>
    </thead>
  );
}
export function TR({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick} className={cn("border-b border-line last:border-0 hover:bg-slate-50/60", onClick && "cursor-pointer")}>
      {children}
    </tr>
  );
}
export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 text-ink", className)}>{children}</td>;
}

/* ------------------------------- Empty / misc ------------------------------ */

export function EmptyState({
  icon: Icon, title, desc, action
}: { icon: LucideIcon; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-white px-6 py-16 text-center">
      <span className="mb-4 rounded-2xl bg-indigo-50 p-3 text-accent">
        <Icon size={24} />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-mute">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent", className)} />;
}

export function PageTitle({ title, desc, right }: { title: string; desc?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {desc && <p className="mt-1 text-sm text-mute">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-xs text-mute">{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

/* ---------------------------------- Shell ---------------------------------- */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Shell({
  nav, brand, sidebarHeader, sidebarFooter, topbarLeft, topbarRight, width = 280, children
}: {
  nav: NavItem[];
  brand?: React.ReactNode;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  topbarLeft?: React.ReactNode;
  topbarRight?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-white">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-white md:flex"
        style={{ width }}
      >
        <div className="px-5 py-5">
          {brand ?? (
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">R</span>
              <span className="font-semibold text-ink">Revson</span>
            </Link>
          )}
        </div>
        {sidebarHeader && <div className="px-4 pb-3">{sidebarHeader}</div>}
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-indigo-50 text-accent" : "text-mute hover:bg-slate-50 hover:text-ink"
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {sidebarFooter && <div className="border-t border-line px-4 py-4">{sidebarFooter}</div>}
      </aside>

      <div className="flex min-h-screen w-full flex-col md:pl-[var(--shell-w)]" style={{ ["--shell-w" as string]: `${width}px` }}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/90 px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">{topbarLeft}</div>
          <div className="flex items-center gap-3">{topbarRight}</div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
