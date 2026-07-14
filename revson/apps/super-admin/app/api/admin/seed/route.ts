import { NextResponse } from "next/server";
import { requireRole, supabaseAdmin } from "@/lib/server";

function mondayOf(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x.toISOString().slice(0, 10);
}
function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function pay(hours: number[], rate: number) {
  const total = hours.reduce((s, h) => s + h, 0);
  const reg = Math.min(total, 40);
  const ot = Math.max(total - 40, 0);
  return { total, ot, totalPay: +(reg * rate + ot * rate * 1.5).toFixed(2) };
}

export async function POST() {
  const auth = await requireRole("super_admin");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = supabaseAdmin();
  const week = mondayOf(new Date());
  const lastWeek = addDays(week, -7);

  const seeds = [
    {
      biz: {
        name: "Tony's Barber Shop", type: "Barbershop", address: "412 Main St, Ann Arbor, MI",
        phone: "(734) 555-0114", email: "hello@tonysbarbershop.com", owner_name: "Tony Marchetti",
        brand_color: "#4F46E5", subscription: "pro"
      },
      employees: [
        { name: "Tony Marchetti", role: "Barber", rate: 28, phone: "(734) 555-0114" },
        { name: "Deja Williams", role: "Barber", rate: 24, phone: "(734) 555-0187" },
        { name: "Sam Ortiz", role: "Front Desk", rate: 17, phone: "(734) 555-0166" }
      ],
      hours: [[8, 8, 8, 8, 8, 4, 0], [8, 8, 8, 8, 8, 6, 0], [6, 6, 6, 6, 6, 0, 0]],
      doc: {
        file_name: "main-st-lease-2026.pdf",
        risk_score: 72,
        summary: "Five-year lease at 412 Main St with base rent of $3,800/month and 4% annual increases. The landlord can pass through CAM charges with no cap, which is the biggest cost risk. The lease auto-renews for 3 years unless you give notice 120 days before the end date.",
        money: { base: "$3,800/mo", fees: "CAM uncapped, est. $450/mo", deposit: "$7,600", firstYear: "$51,000" },
        traps: [
          { clause: "Auto-renewal", where: "Section 14.2", why: "Renews for 3 more years unless written notice 120 days out.", severity: "high" },
          { clause: "Uncapped CAM", where: "Section 6.4", why: "Landlord can pass through any common-area cost with no ceiling.", severity: "high" },
          { clause: "Personal guarantee", where: "Rider B", why: "You are personally liable if the business cannot pay.", severity: "medium" }
        ],
        dates: { start: "2026-03-01", end: "2031-02-28", renewal: "2030-11-01", deadline: "2030-10-31" }
      },
      job: {
        title: "Licensed Barber", pay_range: "$22–$28/hr + tips",
        content: "About Us\nTony's Barber Shop has kept Ann Arbor sharp since 2012.\n\nThe Role\nWe're hiring a licensed barber for 30–40 hrs/week.\n\nWhat You'll Do\n- Cuts, fades, beard work\n- Keep your station clean\n- Build repeat clients\n\nWhat We're Looking For\n- Valid MI barber license\n- 1+ year behind the chair\n\nPay & Benefits\n$22–$28/hr plus tips. Paid weekly.\n\nSchedule\nTue–Sat, flexible.\n\nHow to Apply\nReply with your license number and Instagram/portfolio.\n\nWe are an equal opportunity employer. All qualified applicants will receive consideration without regard to race, color, religion, sex, national origin, disability, or veteran status.",
        interview_questions: [
          "Walk me through your favorite fade, step by step.",
          "How do you handle a client who's unhappy mid-cut?",
          "What does your rebooking rate look like?",
          "How do you keep your station compliant with state board rules?",
          "What days and hours can you commit to?"
        ],
        status: "live"
      },
      review: {
        original_text: "Waited 45 minutes past my appointment time and the cut was rushed. Not what it used to be.",
        stars: 2, customer_name: "Marcus L.",
        response_text: "Marcus, thank you for telling us about the wait — 45 minutes past your slot isn't the standard we hold ourselves to. We're sorry your visit felt rushed, and we'd like to make it right with a priority rebooking. Please call us at (734) 555-0114 and ask for Tony directly. We'd love the chance to give you the cut you came in for.",
        short_response: "Marcus, a 45-min wait isn't our standard — we're sorry. Call (734) 555-0114, ask for Tony, and we'll get you a priority rebooking to make it right.",
        internal_note: "Double-booked chairs on Saturday afternoons are causing overruns. Consider blocking 15-min buffers after 2pm."
      },
      tasks: ["Wipe down stations at close", "Restock towels", "Confirm tomorrow's appointments"]
    },
    {
      biz: {
        name: "Maple Auto", type: "Auto Repair", address: "88 Maple Rd, Ypsilanti, MI",
        phone: "(734) 555-0242", email: "service@mapleauto.com", owner_name: "Rosa Kim",
        brand_color: "#059669", subscription: "starter"
      },
      employees: [
        { name: "Rosa Kim", role: "Mechanic", rate: 34, phone: "(734) 555-0242" },
        { name: "Ben Tran", role: "Mechanic", rate: 30, phone: "(734) 555-0219" },
        { name: "Ivy Chen", role: "Front Desk", rate: 18, phone: "(734) 555-0233" }
      ],
      hours: [[9, 9, 9, 9, 9, 0, 0], [8, 8, 10, 8, 8, 4, 0], [8, 8, 8, 8, 8, 0, 0]],
      doc: {
        file_name: "equipment-finance-agreement.pdf",
        risk_score: 38,
        summary: "36-month finance agreement for a two-post lift and diagnostics rig at $612/month. The rate is fair and there is no personal guarantee. Watch the early-payoff clause: paying off early still owes 80% of remaining interest.",
        money: { base: "$612/mo", fees: "$150 doc fee", deposit: "$1,200", firstYear: "$8,544" },
        traps: [
          { clause: "Early payoff penalty", where: "Section 9", why: "Prepaying still owes 80% of remaining interest.", severity: "medium" },
          { clause: "Insurance requirement", where: "Section 11", why: "Must carry equipment coverage or lender force-places it at 3x cost.", severity: "low" }
        ],
        dates: { start: "2026-01-15", end: "2029-01-14", renewal: "Not stated", deadline: "Not stated" }
      },
      job: {
        title: "ASE Certified Mechanic", pay_range: "$28–$36/hr",
        content: "About Us\nMaple Auto is Ypsilanti's honest neighborhood shop.\n\nThe Role\nFull-time mechanic, brakes to diagnostics.\n\nWhat You'll Do\n- Diagnose and repair\n- Write clear estimates\n- Keep bays safe and clean\n\nWhat We're Looking For\n- ASE certification\n- 2+ years experience\n\nPay & Benefits\n$28–$36/hr, health stipend, paid holidays.\n\nSchedule\nMon–Fri, occasional Saturday.\n\nHow to Apply\nEmail service@mapleauto.com with your certs.\n\nWe are an equal opportunity employer. All qualified applicants will receive consideration without regard to race, color, religion, sex, national origin, disability, or veteran status.",
        interview_questions: [
          "Tell me about a diagnosis that stumped you and how you solved it.",
          "How do you explain a $1,500 repair to a nervous customer?",
          "Which ASE certs do you hold and which are you working on?",
          "Describe your process for test-driving after a brake job.",
          "What tools do you bring, and what do you expect the shop to supply?"
        ],
        status: "draft"
      },
      review: {
        original_text: "Rosa's team fixed my brakes same-day and charged less than the dealer quoted. Honest shop!",
        stars: 5, customer_name: "Dana P.",
        response_text: "Dana, thank you — same-day brakes are exactly what we aim for. We're glad the price felt fair; honest quotes are the whole point at Maple Auto. We appreciate you trusting us with your car and we'll be here whenever it needs anything. See you at the next oil change!",
        short_response: "Thank you, Dana! Same-day service and fair pricing are what we're about. We appreciate the trust — see you at the next oil change!",
        internal_note: "Dealer-comparison pricing is landing well. Keep quoting the dealer delta on estimates."
      },
      tasks: ["Torque-check wheels before release", "Update parts inventory", "Sweep bays"]
    }
  ];

  try {
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const { data: biz, error: bizErr } = await admin.from("businesses").insert(s.biz).select().single();
      if (bizErr || !biz) throw new Error(bizErr?.message ?? "business insert failed");

      const { data: emps, error: empErr } = await admin
        .from("employees")
        .insert(s.employees.map((e) => ({ ...e, business_id: biz.id, status: "active" })))
        .select();
      if (empErr || !emps) throw new Error(empErr?.message ?? "employees insert failed");

      // Pay periods: last week (paid) + this week (pending)
      const payRows: Record<string, unknown>[] = [];
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      emps.forEach((emp, idx) => {
        const h = s.hours[idx];
        const hoursObj = Object.fromEntries(days.map((d, j) => [d, h[j]]));
        const p = pay(h, emp.rate);
        payRows.push({
          business_id: biz.id, employee_id: emp.id, week_start: lastWeek,
          hours: hoursObj, total_hours: p.total, ot_hours: p.ot, total_pay: p.totalPay, status: "paid"
        });
        payRows.push({
          business_id: biz.id, employee_id: emp.id, week_start: week,
          hours: hoursObj, total_hours: p.total, ot_hours: p.ot, total_pay: p.totalPay, status: "pending"
        });
      });
      await admin.from("pay_periods").insert(payRows);

      // Shifts: this week Mon–Fri for first two employees
      const shiftRows: Record<string, unknown>[] = [];
      for (let d = 0; d < 5; d++) {
        shiftRows.push({ business_id: biz.id, employee_id: emps[0].id, date: addDays(week, d), start_time: "09:00", end_time: "17:00", role: emps[0].role });
        shiftRows.push({ business_id: biz.id, employee_id: emps[1].id, date: addDays(week, d), start_time: "10:00", end_time: "18:00", role: emps[1].role });
      }
      await admin.from("shifts").insert(shiftRows);

      await admin.from("documents").insert({ ...s.doc, business_id: biz.id, file_url: null });
      await admin.from("job_posts").insert({ ...s.job, business_id: biz.id });
      await admin.from("reviews").insert({ ...s.review, business_id: biz.id });
      await admin.from("tasks").insert(s.tasks.map((t) => ({ business_id: biz.id, title: t, completed: false })));
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Seed failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
