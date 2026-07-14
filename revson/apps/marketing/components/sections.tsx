"use client";
import { useState } from "react";
import Link from "next/link";
import {
  supabaseBrowser, Button, Card, Badge, Input, toast, cn, StatusBadge, RiskBadge
} from "@revson/shared";
import {
  FileText, Clock, Users, Star, Search, Check, Minus, ArrowRight,
  Scissors, Car, Coffee, Store, Sparkles, ShieldCheck, Archive, Zap
} from "lucide-react";

/* ----------------------------------- Nav ----------------------------------- */

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">R</span>
          <span className="font-semibold text-ink">Revson Services</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-mute md:flex">
          <a href="#problem" className="hover:text-ink">Product</a>
          <a href="#tools" className="hover:text-ink">Tools</a>
          <a href="#how" className="hover:text-ink">How it Works</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-mute hover:text-ink">Log in</Link>
          <Link href="/register"><Button>Start Free Trial</Button></Link>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------------- Hero ---------------------------------- */

export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles size={13} /> Fully Automated • No Staff Needed
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-ink md:text-[64px]">
          Your shop&apos;s paperwork runs itself
        </h1>
        <p className="mt-5 max-w-lg text-xl leading-relaxed text-mute">
          Leases, payroll logs, hiring, reviews — 30 sec AI workflows, saved forever.
          Built for barbers, salons, auto, cafes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register"><Button className="px-6 py-3 text-base">Start Free Trial</Button></Link>
          <a href="#demo"><Button variant="secondary" className="px-6 py-3 text-base">See Live Demo</Button></a>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-2 text-accent"><FileText size={18} /></span>
            <div>
              <p className="text-sm font-medium text-ink">lease_412_main_st.pdf</p>
              <p className="text-xs text-mute">Uploaded just now · 34 pages</p>
            </div>
          </div>
          <RiskBadge score={68} />
        </div>
        <div className="mt-5 space-y-3">
          {["Reading every clause", "Finding the money", "Flagging the traps", "Filing it forever"].map((step, i) => (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", i < 3 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-accent")}>
                {i < 3 ? <Check size={12} /> : <Clock size={12} />}
              </span>
              <span className={i < 3 ? "text-ink" : "text-mute"}>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-cream p-4 text-sm text-ink">
          <span className="font-medium">Heads up:</span> auto-renews for 24 months unless you give 90-day notice. Deadline Nov 30.
        </div>
      </Card>
    </section>
  );
}

/* -------------------------------- SocialProof ------------------------------ */

export function SocialProof() {
  const shops = [
    { icon: Scissors, label: "Barbershops" },
    { icon: Sparkles, label: "Salons" },
    { icon: Car, label: "Auto Repair" },
    { icon: Coffee, label: "Cafes" },
    { icon: Store, label: "Retail" }
  ];
  return (
    <section className="border-y border-line bg-slate-50/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8">
        <p className="text-sm text-mute">Built for shops that hate paperwork</p>
        {shops.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-sm font-medium text-ink">
            <s.icon size={16} className="text-mute" /> {s.label}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------- Problem -------------------------------- */

export function Problem() {
  const problems = [
    { icon: FileText, title: "The lease you never read", desc: "34 pages of fine print, one auto-renewal clause that costs you $28,000. Nobody has time to read it — so nobody does." },
    { icon: Clock, title: "Payroll math on a napkin", desc: "Hours scribbled on paper, overtime guessed at, records lost. One audit and you're digging through a shoebox." },
    { icon: Star, title: "Reviews you answer at midnight", desc: "A 2-star review sits unanswered for a week while you're cutting hair. Every day it sits, it costs you customers." }
  ];
  return (
    <section id="problem" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-semibold text-ink">Paperwork doesn&apos;t make you money. It just makes you late.</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {problems.map((p) => (
          <Card key={p.title} className="p-6">
            <span className="inline-flex rounded-xl bg-indigo-50 p-2.5 text-accent"><p.icon size={20} /></span>
            <h3 className="mt-4 font-semibold text-ink">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">{p.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- ToolsGrid ------------------------------- */

const TOOLS = [
  { name: "Fine Print Killer", desc: "Drop a lease. Get the risks, the money, and the deadlines in plain English.", live: true },
  { name: "Payroll Log", desc: "Log hours, auto-calc overtime, export clean records your accountant will love.", live: true },
  { name: "Hiring Lab", desc: "Job posts and interview questions written for your shop, not corporate HR.", live: true },
  { name: "Review Responder", desc: "Professional replies to any review in the tone you pick, in seconds.", live: true },
  { name: "SOP Vault", desc: "Turn how-you-do-things into checklists your team actually follows.", live: false },
  { name: "Tax Pack", desc: "Everything your CPA asks for, packed into one folder in January.", live: false },
  { name: "Permit Tracker", desc: "Never let a license lapse. Renewal reminders before the county fines you.", live: false },
  { name: "Vendor Contracts", desc: "Every supplier agreement analyzed and filed like the lease.", live: false },
  { name: "Insurance Audit", desc: "Know what your policy actually covers before you need it to.", live: false },
  { name: "Grant Finder", desc: "Local small-business grants matched to your shop, applications drafted.", live: false }
];

export function ToolsGrid() {
  const [waitEmail, setWaitEmail] = useState<Record<string, string>>({});
  const [openTool, setOpenTool] = useState<string | null>(null);

  async function joinWaitlist(tool: string) {
    const email = waitEmail[tool]?.trim();
    if (!email) return toast.error("Enter your email first.");
    const sb = supabaseBrowser();
    const { error } = await sb.from("waitlist").insert({ email, tool });
    if (error) return toast.error(error.message);
    toast.success(`You're on the list for ${tool}.`);
    setOpenTool(null);
  }

  return (
    <section id="tools" className="border-t border-line bg-slate-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold text-ink">One OS. Ten tools. Zero filing cabinets.</h2>
        <p className="mt-2 text-mute">Four are live today. Six more are coming — join the list and we&apos;ll tell you first.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Card key={t.name} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">{t.name}</h3>
                {t.live ? <Badge tone="green">LIVE</Badge> : <Badge tone="gray">Coming Soon</Badge>}
              </div>
              <p className="mt-2 flex-1 text-sm text-mute">{t.desc}</p>
              <div className="mt-4">
                {t.live ? (
                  <Link href="/register"><Button variant="secondary" className="w-full">Try Now <ArrowRight size={15} /></Button></Link>
                ) : openTool === t.name ? (
                  <div className="flex gap-2">
                    <Input placeholder="you@shop.com" value={waitEmail[t.name] ?? ""} onChange={(e) => setWaitEmail((w) => ({ ...w, [t.name]: e.target.value }))} />
                    <Button onClick={() => joinWaitlist(t.name)}>Join</Button>
                  </div>
                ) : (
                  <Button variant="ghost" className="w-full border border-line" onClick={() => setOpenTool(t.name)}>Join Waitlist</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- DemoTabs -------------------------------- */

export function DemoTabs() {
  const tabs = ["Documents", "Payroll", "Hiring", "Reviews"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Documents");

  return (
    <section id="demo" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-semibold text-ink">This is the actual product</h2>
      <p className="mt-2 text-mute">Read-only demo — the same screens your shop gets on day one.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium",
              tab === t ? "bg-accent text-white" : "border border-line bg-white text-mute hover:text-ink"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-6">
        {tab === "Documents" && (
          <div className="space-y-3">
            {[
              { name: "lease_412_main_st.pdf", score: 68 },
              { name: "equipment_finance_agreement.pdf", score: 82 },
              { name: "cleaning_vendor_contract.pdf", score: 24 }
            ].map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
                <span className="flex items-center gap-3 text-sm font-medium text-ink"><FileText size={16} className="text-mute" /> {d.name}</span>
                <RiskBadge score={d.score} />
              </div>
            ))}
            <p className="text-xs text-mute">Risk scored, summarized, and archived automatically.</p>
          </div>
        )}
        {tab === "Payroll" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-line text-xs uppercase text-mute"><th className="py-2 pr-4">Employee</th><th className="py-2 pr-4">Week</th><th className="py-2 pr-4">Hours</th><th className="py-2 pr-4">OT</th><th className="py-2 pr-4">Pay</th><th className="py-2">Status</th></tr></thead>
              <tbody>
                <tr className="border-b border-line"><td className="py-3 pr-4 text-ink">Deja Williams</td><td className="pr-4 text-mute">Jul 6</td><td className="pr-4">42.0</td><td className="pr-4">2.0</td><td className="pr-4">$1,204.00</td><td><StatusBadge status="pending" /></td></tr>
                <tr><td className="py-3 pr-4 text-ink">Sam Ortiz</td><td className="pr-4 text-mute">Jul 6</td><td className="pr-4">38.5</td><td className="pr-4">0.0</td><td className="pr-4">$693.00</td><td><StatusBadge status="paid" /></td></tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-mute">Overtime calculated automatically: reg up to 40, then 1.5×.</p>
          </div>
        )}
        {tab === "Hiring" && (
          <div>
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">Barber — Full Time · $28–34/hr + tips</p>
              <StatusBadge status="live" />
            </div>
            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-mute">
              About Us: We&apos;re a 6-chair shop on Main St that&apos;s been fading necks since 2014… What You&apos;ll Do: 15–20 cuts a day, keep your station tight, build your book…
            </p>
            <p className="mt-3 text-xs text-mute">Full post + 5 interview questions generated in one click.</p>
          </div>
        )}
        {tab === "Reviews" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center gap-1 text-amber-500">{"★★".split("").map((s, i) => <Star key={i} size={14} fill="currentColor" />)}<Star size={14} className="text-line" /><Star size={14} className="text-line" /><Star size={14} className="text-line" /></div>
              <p className="mt-2 text-sm text-ink">&quot;Waited 40 minutes past my appointment. Cut was fine but come on.&quot;</p>
            </div>
            <div className="rounded-xl bg-cream p-4">
              <p className="text-xs font-medium uppercase text-mute">Generated reply · Apologetic</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">Thanks for the honest feedback — a 40-minute wait isn&apos;t the experience we want anyone to have. We&apos;d like to make it right; call us and your next cut is on the house. Hope to see you back in the chair soon.</p>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

/* -------------------------------- HowItWorks ------------------------------- */

export function HowItWorks() {
  const steps = [
    { icon: FileText, title: "Drop the messy file", desc: "PDF lease, scribbled hours, a bad review — whatever landed on your counter." },
    { icon: Zap, title: "Claude reads 100 pages", desc: "AI does the reading, the math, and the writing in about 30 seconds." },
    { icon: Archive, title: "Pretty doc + forever archive", desc: "Clean summary now, searchable record forever. Nothing gets lost again." }
  ];
  return (
    <section id="how" className="border-y border-line bg-slate-50/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold text-ink">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Card key={s.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">{i + 1}</span>
                <s.icon size={20} className="text-accent" />
              </div>
              <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-mute">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Comparison ------------------------------- */

export function Comparison() {
  const rows = [
    { feature: "AI reads your contracts", revson: true, jobber: false, homebase: false, gusto: false },
    { feature: "Payroll hour logs + OT math", revson: true, jobber: false, homebase: true, gusto: true },
    { feature: "AI job posts + interviews", revson: true, jobber: false, homebase: false, gusto: false },
    { feature: "AI review responses", revson: true, jobber: false, homebase: false, gusto: false },
    { feature: "Forever document archive", revson: true, jobber: false, homebase: false, gusto: false },
    { feature: "Built for 1–25 person shops", revson: true, jobber: true, homebase: true, gusto: false }
  ];
  const Cell = ({ v }: { v: boolean }) =>
    v ? <Check size={16} className="mx-auto text-emerald-600" /> : <Minus size={16} className="mx-auto text-line" />;
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-semibold text-ink">Point tools do one job. Revson runs the back office.</h2>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-line shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-slate-50/60 text-xs uppercase text-mute">
              <th className="px-4 py-3">Capability</th>
              <th className="px-4 py-3 text-center text-accent">Revson</th>
              <th className="px-4 py-3 text-center">Jobber</th>
              <th className="px-4 py-3 text-center">Homebase</th>
              <th className="px-4 py-3 text-center">Gusto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{r.feature}</td>
                <td className="px-4 py-3"><Cell v={r.revson} /></td>
                <td className="px-4 py-3"><Cell v={r.jobber} /></td>
                <td className="px-4 py-3"><Cell v={r.homebase} /></td>
                <td className="px-4 py-3"><Cell v={r.gusto} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------- ArchiveMoat ------------------------------ */

export function ArchiveMoat() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-xl bg-white p-2.5 text-accent shadow-sm"><Archive size={20} /></span>
          <h2 className="mt-4 text-3xl font-semibold text-ink">The filing cabinet that became software</h2>
          <p className="mt-3 text-mute">Every document, log, and decision goes into a searchable archive. In year three, this is the moat.</p>
        </div>
        <Card className="mx-auto mt-8 max-w-2xl p-2">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3">
            <Search size={17} className="text-mute" />
            <span className="text-sm text-ink">Show me all leases with auto-renew &gt; 60 days</span>
            <span className="ml-auto animate-pulse text-accent">|</span>
          </div>
          <div className="space-y-2 p-3">
            {["lease_412_main_st.pdf — auto-renew 90 days", "lease_maple_bay_2.pdf — auto-renew 120 days"].map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-xl border border-line px-4 py-2.5 text-sm text-mute">
                <FileText size={15} /> {r}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

/* ---------------------------------- Pricing -------------------------------- */

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const plans = [
    { name: "Starter", price: 49, blurb: "For one shop getting organized.", features: ["30 documents / mo", "1 location", "5 employees", "All 4 live tools", "Forever archive"], popular: false },
    { name: "Pro", price: 149, blurb: "For shops that run on systems.", features: ["Unlimited documents", "3 locations", "25 employees", "White label", "Priority support"], popular: true },
    { name: "Business", price: 299, blurb: "For operators with real volume.", features: ["Unlimited everything", "Unlimited locations", "API access", "Dedicated onboarding", "Custom exports"], popular: false }
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-semibold text-ink">Pricing that costs less than one missed clause</h2>
      <div className="mt-6 flex items-center justify-center gap-3 text-sm">
        <span className={cn(!yearly ? "font-medium text-ink" : "text-mute")}>Monthly</span>
        <button
          onClick={() => setYearly((y) => !y)}
          className={cn("relative h-6 w-11 rounded-full transition-colors", yearly ? "bg-accent" : "bg-line")}
          aria-label="Toggle yearly billing"
        >
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all", yearly ? "left-[22px]" : "left-0.5")} />
        </button>
        <span className={cn(yearly ? "font-medium text-ink" : "text-mute")}>Yearly <Badge tone="green" className="ml-1">2 months free</Badge></span>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={cn("relative p-6", p.popular && "border-accent ring-1 ring-accent")}>
            {p.popular && <Badge tone="indigo" className="absolute -top-3 left-6">Most Popular</Badge>}
            <h3 className="font-semibold text-ink">{p.name}</h3>
            <p className="mt-1 text-sm text-mute">{p.blurb}</p>
            <p className="mt-4 text-4xl font-bold text-ink">
              ${yearly ? p.price * 10 : p.price}
              <span className="text-base font-normal text-mute">/{yearly ? "yr" : "mo"}</span>
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-ink">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={15} className="text-emerald-600" /> {f}</li>
              ))}
            </ul>
            <Link href="/register" className="mt-6 block">
              <Button variant={p.popular ? "primary" : "secondary"} className="w-full">Start Free Trial</Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- Testimonials ----------------------------- */

export function Testimonials() {
  const quotes = [
    { quote: "Found an auto-renewal in my lease that would've locked me in for two more years. Paid for itself before the trial ended.", name: "Tony M.", role: "Barbershop, Ann Arbor" },
    { quote: "Payroll used to be Sunday night with a calculator. Now it's approve, approve, export. Fifteen minutes.", name: "Rosa K.", role: "Auto shop, Ypsilanti" },
    { quote: "I answered a 1-star review from my phone in the time it took my espresso to pull. It reads better than what I would've written.", name: "Ben T.", role: "Cafe, Detroit" }
  ];
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold text-ink">Shops that got their Sundays back</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <Card key={q.name} className="p-6">
              <div className="flex gap-0.5 text-amber-500">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink">&quot;{q.quote}&quot;</p>
              <p className="mt-4 text-sm font-medium text-ink">{q.name}</p>
              <p className="text-xs text-mute">{q.role}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------ FAQ ---------------------------------- */

export function Faq() {
  const faqs = [
    { q: "Is this legal, tax, or payroll advice?", a: "No. Revson gives you information and organization only — plain-English summaries, hour logs, and drafts. Always review contracts with a lawyer and payroll with your accountant." },
    { q: "Do I need to install anything?", a: "No. It runs in the browser. Drop a file, get the result, done." },
    { q: "What happens to my documents?", a: "They're stored in your private, isolated workspace and archived forever. Only you and the people you invite can see them." },
    { q: "Can my employees see the business finances?", a: "No. Employees only see their own schedule, their own pay logs, and documents you share. Isolation is enforced at the database level." },
    { q: "How long does setup take?", a: "About two minutes: register, upload your first document, done. No onboarding calls, no sales demos." },
    { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Your archive stays exportable." }
  ];
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-semibold text-ink">Questions shop owners actually ask</h2>
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-line bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink">{f.q}</summary>
            <p className="mt-3 text-sm leading-relaxed text-mute">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- FinalCta -------------------------------- */

export function FinalCta() {
  const [email, setEmail] = useState("");
  async function submit() {
    if (!email.trim()) return toast.error("Enter your email.");
    const sb = supabaseBrowser();
    const { error } = await sb.from("waitlist").insert({ email, tool: "final_cta" });
    if (error) return toast.error(error.message);
    toast.success("You're in. Check your inbox.");
    setEmail("");
  }
  return (
    <section className="bg-coal">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <ShieldCheck size={28} className="mx-auto text-sun" />
        <h2 className="mt-4 text-4xl font-bold text-white">Make paperwork disappear</h2>
        <p className="mx-auto mt-3 max-w-md text-slate-400">Join the shops running their back office on autopilot.</p>
        <div className="mx-auto mt-8 flex max-w-md gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@shop.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sun focus:outline-none"
          />
          <button onClick={submit} className="whitespace-nowrap rounded-xl bg-sun px-5 py-3 text-sm font-semibold text-coal hover:brightness-95">
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- Footer --------------------------------- */

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-mute">
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">R</span>
          Revson Services — Paperwork runs itself while you run your shop.
        </span>
        <nav className="flex gap-6">
          <a href="#" className="hover:text-ink">Privacy</a>
          <a href="#" className="hover:text-ink">Terms</a>
          <a href="#" className="hover:text-ink">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
