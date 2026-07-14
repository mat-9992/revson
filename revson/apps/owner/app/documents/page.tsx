"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  supabaseBrowser, fmtDate, Button, Input, Card, Table, THead, TR, TD, RiskBadge, Badge,
  Drawer, EmptyState, Skeleton, PageTitle, Disclaimer, Spinner, toast, type DocumentRow
} from "@revson/shared";
import { FileText, Upload, Eye, Trash2, Search, Save } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

const SEV_TONE: Record<string, "red" | "amber" | "green"> = { high: "red", medium: "amber", low: "green" };

function DocumentsInner() {
  const { business } = useBusiness();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<DocumentRow | null>(null);
  const [money, setMoney] = useState<Record<string, string>>({});
  const [savingMoney, setSavingMoney] = useState(false);

  async function load() {
    if (!business) return;
    const { data } = await supabaseBrowser().from("documents").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setRows((data as DocumentRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business]);

  const filtered = useMemo(
    () => rows.filter((r) => (r.file_name ?? "").toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  function toBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF."); return; }
    setUploading(true);
    const sb = supabaseBrowser();
    try {
      // 1) Store the file
      const path = `${business.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: upErr } = await sb.storage.from("documents").upload(path, file, { contentType: "application/pdf" });
      let fileUrl: string | null = null;
      if (!upErr) fileUrl = sb.storage.from("documents").getPublicUrl(path).data.publicUrl;

      // 2) Analyze with Claude
      const base64 = await toBase64(file);
      const res = await fetch("/api/analyze-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, fileName: file.name })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Analysis failed." }));
        throw new Error(error ?? "Analysis failed.");
      }
      const { result } = await res.json();

      // 3) Save the row
      const { data: { user } } = await sb.auth.getUser();
      const { error: insErr } = await sb.from("documents").insert({
        business_id: business.id, file_name: file.name, file_url: fileUrl, uploaded_by: user?.id ?? null,
        risk_score: result.riskScore ?? null, summary: result.summary ?? null,
        money: result.money ?? null, traps: result.traps ?? null, dates: result.dates ?? null
      });
      if (insErr) throw new Error(insErr.message);
      toast.success("Document analyzed.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openDoc(d: DocumentRow) {
    setActive(d);
    setMoney(d.money ?? {});
  }

  async function saveMoney() {
    if (!active) return;
    setSavingMoney(true);
    const { error } = await supabaseBrowser().from("documents").update({ money }).eq("id", active.id);
    setSavingMoney(false);
    if (error) return toast.error(error.message);
    toast.success("Saved.");
    setRows((r) => r.map((x) => (x.id === active.id ? { ...x, money } : x)));
  }

  async function remove(d: DocumentRow) {
    if (!confirm(`Delete ${d.file_name}?`)) return;
    const { error } = await supabaseBrowser().from("documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted.");
    setRows((r) => r.filter((x) => x.id !== d.id));
  }

  const MONEY_LABELS: Record<string, string> = { base: "Base rent", fees: "Fees", deposit: "Deposit", firstYear: "First-year total" };

  return (
    <>
      <PageTitle
        title="Documents — Fine Print Killer"
        desc="Drop a lease or contract. Claude reads every page and flags the traps."
        right={
          <>
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFile} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <><Spinner /> Analyzing…</> : <><Upload size={15} /> Upload Lease</>}
            </Button>
          </>
        }
      />
      <Disclaimer>Information only — not legal advice. Have a lawyer review anything you sign.</Disclaimer>

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          desc="Upload your first lease or vendor contract — you'll get a plain-English summary, a risk score, and the fine-print traps in about 30 seconds."
          action={<Button onClick={() => fileRef.current?.click()} disabled={uploading}><Upload size={15} /> Upload Lease</Button>}
        />
      ) : (
        <>
          <div className="mb-4 relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <Input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Table>
            <THead cols={["File", "Uploaded", "Risk", "Summary", "Actions"]} />
            <tbody>
              {filtered.map((d) => (
                <TR key={d.id}>
                  <TD className="font-medium">{d.file_name}</TD>
                  <TD className="text-mute">{fmtDate(d.created_at)}</TD>
                  <TD><RiskBadge score={d.risk_score} /></TD>
                  <TD className="max-w-sm truncate text-mute">{d.summary ?? "—"}</TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDoc(d)} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="View"><Eye size={15} /></button>
                      <button onClick={() => remove(d)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Drawer open={!!active} onClose={() => setActive(null)} title={active?.file_name ?? "Document"}>
        {active && (
          <div className="space-y-6 text-sm">
            <div className="flex items-center gap-3">
              <RiskBadge score={active.risk_score} />
              {active.file_url && <a href={active.file_url} target="_blank" rel="noreferrer" className="text-accent underline">Open original PDF</a>}
            </div>

            <div>
              <h4 className="mb-1 font-semibold text-ink">Summary</h4>
              <p className="text-mute">{active.summary ?? "Not stated"}</p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-ink">Money</h4>
              <div className="grid grid-cols-2 gap-3">
                {["base", "fees", "deposit", "firstYear"].map((k) => (
                  <label key={k} className="block">
                    <span className="mb-1 block text-xs text-mute">{MONEY_LABELS[k]}</span>
                    <Input value={money[k] ?? ""} onChange={(e) => setMoney({ ...money, [k]: e.target.value })} />
                  </label>
                ))}
              </div>
              <Button variant="secondary" className="mt-3" onClick={saveMoney} disabled={savingMoney}><Save size={14} /> {savingMoney ? "Saving…" : "Save money details"}</Button>
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-ink">Traps</h4>
              {(active.traps ?? []).length === 0 ? (
                <p className="text-mute">None flagged.</p>
              ) : (
                <ul className="space-y-3">
                  {active.traps!.map((t, i) => (
                    <li key={i} className="rounded-xl border border-line p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">{t.clause}</span>
                        <Badge tone={SEV_TONE[t.severity] ?? "gray"}>{t.severity}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-mute">{t.where}</p>
                      <p className="mt-1 text-mute">{t.why}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="mb-2 font-semibold text-ink">Key dates</h4>
              <div className="grid grid-cols-2 gap-3">
                {["start", "end", "renewal", "deadline"].map((k) => (
                  <div key={k} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-mute">{k}</p>
                    <p className="mt-0.5 font-medium text-ink">{active.dates?.[k] ?? "Not stated"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function DocumentsPage() {
  return (
    <OwnerShell>
      <DocumentsInner />
    </OwnerShell>
  );
}
