"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, Button, Input, Textarea, Select, Field, Card, Drawer, Badge, EmptyState, Skeleton,
  PageTitle, Disclaimer, toast, type Review
} from "@revson/shared";
import { Star, Sparkles, Copy, Trash2, MessageSquare } from "lucide-react";
import { OwnerShell } from "@/components/owner-shell";
import { useBusiness } from "@/components/business-provider";

const TONES = ["Professional", "Friendly", "Apologetic", "Witty"];

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star size={onChange ? 22 : 15} className={n <= value ? "fill-sun text-sun" : "text-line"} />
        </button>
      ))}
    </div>
  );
}

function ReputationInner() {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Review[]>([]);
  const [review, setReview] = useState("");
  const [stars, setStars] = useState(3);
  const [customer, setCustomer] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);

  async function load() {
    if (!business) return;
    const { data } = await supabaseBrowser()
      .from("reviews").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setRows((data as Review[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [business]);

  async function generate() {
    if (!business) return;
    if (!review.trim()) return toast.error("Paste the review first.");
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-review-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: business.name, review, stars, customerName: customer || null, tone })
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Generation failed." }));
        throw new Error(error ?? "Generation failed.");
      }
      const { result } = await res.json();
      const { data, error } = await supabaseBrowser().from("reviews").insert({
        business_id: business.id, original_text: review, stars, customer_name: customer || null,
        response_text: result.response_text ?? "", short_response: result.short_response ?? "",
        internal_note: result.internal_note ?? ""
      }).select().single();
      if (error) throw new Error(error.message);
      toast.success("Response drafted.");
      setRows((r) => [data as Review, ...r]);
      setSelected(data as Review);
      setReview(""); setCustomer(""); setStars(3); setTone(TONES[0]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function remove(r: Review) {
    if (!confirm("Delete this review response?")) return;
    const { error } = await supabaseBrowser().from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    setRows((x) => x.filter((y) => y.id !== r.id));
    if (selected?.id === r.id) setSelected(null);
    toast.success("Deleted.");
  }

  async function copy(text: string | null) {
    await navigator.clipboard.writeText(text ?? "");
    toast.success("Copied to clipboard.");
  }

  return (
    <>
      <PageTitle title="Reputation" desc="Paste a review. Claude writes a calm public reply, a short version, and a private fix-it note." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles size={16} className="text-accent" /> Respond to a review
          </div>
          <div className="space-y-4">
            <Field label="Paste review *"><Textarea rows={5} value={review} onChange={(e) => setReview(e.target.value)} placeholder="Waited 40 minutes past my appointment…" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Stars"><Stars value={stars} onChange={setStars} /></Field>
              <Field label="Customer name (optional)"><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field>
            </div>
            <Field label="Tone">
              <Select value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Button className="w-full" onClick={generate} disabled={generating}>
              <Sparkles size={15} /> {generating ? "Writing…" : "Generate response"}
            </Button>
            <Disclaimer>Information only — not legal advice. Review replies before posting.</Disclaimer>
          </div>
        </Card>

        <div>
          <div className="mb-3 text-sm font-semibold text-ink">Review history</div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : rows.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No reviews yet" desc="Draft your first reply on the left. Everything you generate is saved here." />
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <button key={r.id} onClick={() => setSelected(r)} className="block w-full rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:border-slate-300">
                  <div className="mb-1.5 flex items-center justify-between">
                    <Stars value={r.stars ?? 0} />
                    <span className="text-xs text-mute">{r.customer_name ?? "Anonymous"}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-mute">{r.original_text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Review response">
        {selected && (
          <div className="space-y-5 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Stars value={selected.stars ?? 0} />
                <span className="text-xs text-mute">{selected.customer_name ?? "Anonymous"}</span>
              </div>
              <div className="rounded-xl border border-line bg-slate-50 p-3 text-mute">{selected.original_text}</div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-ink">Public response</span>
                <button onClick={() => copy(selected.response_text)} className="text-mute hover:text-ink"><Copy size={14} /></button>
              </div>
              <div className="rounded-xl border border-line bg-white p-3 text-ink">{selected.response_text}</div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink">Short version</span>
                  <Badge tone="gray">{(selected.short_response ?? "").length}/280</Badge>
                </div>
                <button onClick={() => copy(selected.short_response)} className="text-mute hover:text-ink"><Copy size={14} /></button>
              </div>
              <div className="rounded-xl border border-line bg-white p-3 text-ink">{selected.short_response}</div>
            </div>

            <div>
              <div className="mb-1 font-semibold text-ink">Internal note</div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">{selected.internal_note}</div>
            </div>

            <Button variant="danger" onClick={() => remove(selected)}><Trash2 size={14} /> Delete</Button>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function ReputationPage() {
  return (
    <OwnerShell>
      <ReputationInner />
    </OwnerShell>
  );
}
