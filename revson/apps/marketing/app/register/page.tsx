"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser, APP_URLS, BUSINESS_TYPES, Button, Card, Field, Input, Select, toast } from "@revson/shared";

export default function RegisterPage() {
  const [form, setForm] = useState({ businessName: "", ownerName: "", email: "", password: "", type: BUSINESS_TYPES[0], phone: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.businessName || !form.email || !form.password) return toast.error("Business name, email, and password are required.");
    setBusy(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) { setBusy(false); return toast.error(data.error ?? "Registration failed."); }

    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setBusy(false); return toast.error(error.message); }

    toast.success("Business created — taking you to your portal.");
    window.location.href = APP_URLS.owner;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">R</span>
          <span className="font-semibold text-ink">Revson Services</span>
        </Link>
        <h1 className="text-xl font-semibold text-ink">Start your free trial</h1>
        <p className="mt-1 text-sm text-mute">30 documents, 5 employees, no card required.</p>
        <div className="mt-6 space-y-4">
          <Field label="Business Name"><Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Tony's Barber Shop" /></Field>
          <Field label="Owner Name"><Input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Tony Marchetti" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@shop.com" /></Field>
          <Field label="Password"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="8+ characters" /></Field>
          <Field label="Business Type">
            <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(734) 555-0123" /></Field>
          <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Creating your workspace…" : "Create my workspace"}</Button>
          <p className="text-center text-sm text-mute">Already have an account? <Link href="/login" className="font-medium text-accent">Log in</Link></p>
        </div>
      </Card>
    </main>
  );
}
