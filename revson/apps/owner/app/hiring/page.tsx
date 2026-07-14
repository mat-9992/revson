"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, Button, Input, Select, Textarea, Field, Card, Drawer, Table, THead, TR, TD,
  StatusBadge, EmptyState, Skeleton, PageTitle, Disclaimer, toast, type JobPost
} from "@revson/shared";
import { Megaphone, Sparkles, Copy, Trash2, ArrowLeftRight } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

const EMPTY = { title: "", payRange: "", type: "Full-time", responsibilities: "", requirements: "", benefits: "", vibe: "" };

function HiringInner() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<JobPost | null>(null);
  const [offerBlurb, setOfferBlurb] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);

  async function load() {
    if (!business) return;
    const { data } = await supabaseBrowser()
      .from("job_posts").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setJobs((data as JobPost[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function generate() {
    if (!business) return;
    if (!form.title.trim()) return toast.error("Job title is required.");
    setGenerating(true);
    setOfferBlurb(null);
    try {
      const res = await fetch("/api/generate-job-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: business.name, address: business.address, title: form.title,
          payRange: form.payRange, type: form.type, responsibilities: form.responsibilities,
          requirements: form.requirements, benefits: form.benefits, vibe: form.vibe
        })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Generation failed." }));
        throw new Error(error ?? "Generation failed.");
      }
      const { result } = await res.json();
      const { data, error } = await supabaseBrowser().from("job_posts").insert({
        business_id: business.id, title: form.title, pay_range: form.payRange || null,
        content: result.content ?? "", interview_questions: result.interview_questions ?? [], status: "draft"
      }).select().single();
      if (error) throw new Error(error.message);
      toast.success("Job post drafted.");
      setJobs((j) => [data as JobPost, ...j]);
      setSelected(data as JobPost);
      setOfferBlurb(result.offer_blurb ?? null);
      setForm({ ...EMPTY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleStatus(job: JobPost) {
    const next = job.status === "live" ? "draft" : "live";
    const { error } = await supabaseBrowser().from("job_posts").update({ status: next }).eq("id", job.id);
    if (error) return toast.error(error.message);
    setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, status: next } : x)));
    if (selected?.id === job.id) setSelected({ ...selected, status: next });
    toast.success(next === "live" ? "Marked live." : "Moved to draft.");
  }

  async function saveContent() {
    if (!selected) return;
    setSavingContent(true);
    const { error } = await supabaseBrowser().from("job_posts").update({ content: selected.content }).eq("id", selected.id);
    setSavingContent(false);
    if (error) return toast.error(error.message);
    setJobs((j) => j.map((x) => (x.id === selected.id ? { ...x, content: selected.content } : x)));
    toast.success("Post saved.");
  }

  async function remove(job: JobPost) {
    if (!confirm(`Delete “${job.title}”?`)) return;
    const { error } = await supabaseBrowser().from("job_posts").delete().eq("id", job.id);
    if (error) return toast.error(error.message);
    setJobs((j) => j.filter((x) => x.id !== job.id));
    if (selected?.id === job.id) setSelected(null);
    toast.success("Job post deleted.");
  }

  async function copy(text: string | null) {
    await navigator.clipboard.writeText(text ?? "");
    toast.success("Copied to clipboard.");
  }

  return (
    <>
      <PageTitle title="Hiring Lab" desc="Describe the role. Claude writes the post, interview questions, and an offer blurb." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={16} className="text-accent" /> New job post
          </div>
          <div className="space-y-4">
            <Field label="Job title *"><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Barber / Stylist / Front Desk" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pay range"><Input value={form.payRange} onChange={(e) => set("payRange", e.target.value)} placeholder="$18–$24/hr + tips" /></Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                </Select>
              </Field>
            </div>
            <Field label="Responsibilities"><Textarea rows={3} value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder="Cutting, fading, client care…" /></Field>
            <Field label="Requirements"><Textarea rows={3} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder="Licensed, 1+ yr, weekends…" /></Field>
            <Field label="Benefits"><Textarea rows={2} value={form.benefits} onChange={(e) => set("benefits", e.target.value)} placeholder="Health, PTO, product discount…" /></Field>
            <Field label="Vibe (optional)"><Input value={form.vibe} onChange={(e) => set("vibe", e.target.value)} placeholder="busy neighborhood shop, tight crew" /></Field>
            <Button className="w-full" onClick={generate} disabled={generating}>
              <Sparkles size={15} /> {generating ? "Writing…" : "Generate job post"}
            </Button>
            {offerBlurb && (
              <div className="rounded-xl border border-line bg-cream p-4 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-ink">Offer blurb</span>
                  <button onClick={() => copy(offerBlurb)} className="text-mute hover:text-ink"><Copy size={14} /></button>
                </div>
                <p className="text-mute">{offerBlurb}</p>
              </div>
            )}
          </div>
        </Card>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Your job posts</div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : jobs.length === 0 ? (
            <EmptyState icon={Megaphone} title="No job posts yet" desc="Generate your first post on the left — it drafts in about 30 seconds." />
          ) : (
            <Table>
              <THead cols={["Title", "Pay", "Status", "Actions"]} />
              <tbody>
                {jobs.map((j) => (
                  <TR key={j.id} onClick={() => setSelected(j)}>
                    <TD className="font-medium">{j.title ?? "Untitled"}</TD>
                    <TD>{j.pay_range ?? "—"}</TD>
                    <TD><StatusBadge status={j.status} /></TD>
                    <TD>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleStatus(j)} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title={j.status === "live" ? "Move to draft" : "Mark live"}>
                          <ArrowLeftRight size={15} />
                        </button>
                        <button onClick={() => copy(j.content)} className="rounded-lg p-2 text-mute hover:bg-slate-50 hover:text-ink" title="Copy post">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => remove(j)} className="rounded-lg p-2 text-mute hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? "Job post"}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              <Button variant="secondary" onClick={() => toggleStatus(selected)}>
                <ArrowLeftRight size={14} /> {selected.status === "live" ? "Move to draft" : "Mark live"}
              </Button>
              <Button variant="secondary" onClick={() => copy(selected.content)}><Copy size={14} /> Copy</Button>
            </div>

            <Field label="Post content (editable)">
              <Textarea rows={16} value={selected.content ?? ""} onChange={(e) => setSelected({ ...selected, content: e.target.value })} />
            </Field>
            <Button onClick={saveContent} disabled={savingContent}>{savingContent ? "Saving…" : "Save post"}</Button>

            {selected.interview_questions && selected.interview_questions.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-ink">Interview questions</div>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-mute">
                  {selected.interview_questions.map((q, i) => <li key={i}>{q}</li>)}
                </ol>
              </div>
            )}

            <Disclaimer>Information only — not legal or HR advice. Confirm hiring rules with a professional.</Disclaimer>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function HiringPage() {
  return (
    <OwnerShell>
      <HiringInner />
    </OwnerShell>
  );
}
