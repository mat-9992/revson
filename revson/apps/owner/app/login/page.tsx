"use client";
import { useState } from "react";
import { supabaseBrowser, portalForRole, Button, Card, Field, Input, toast } from "@revson/shared";

export default function OwnerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); return toast.error(error?.message ?? "Login failed."); }
    const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).single();
    if (!profile) { setBusy(false); return toast.error("No profile found."); }
    window.location.href = profile.role === "owner" ? "/" : portalForRole(profile.role);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">R</span>
          <span className="font-semibold text-ink">Revson — Owner Portal</span>
        </div>
        <div className="space-y-4">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></Field>
          <Button className="w-full" onClick={submit} disabled={busy}>{busy ? "Signing in…" : "Log in"}</Button>
        </div>
      </Card>
    </main>
  );
}
