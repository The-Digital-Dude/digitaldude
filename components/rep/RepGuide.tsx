"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { caseStudies } from "@/lib/content/caseStudies";

interface Props {
  repName: string;
  currency: string;
  meetingBonus: [number | null, number | null];
  commissionPct: [number | null, number | null];
  referralLink: string;
  senderEmail: string;
  dailyLimit?: number;
  active: boolean;
  onOpenTab: (tab: string) => void;
}

type SectionId = "start" | "pitch" | "who" | "emails" | "objections" | "call" | "rules" | "earn" | "tools";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "start", label: "Start here" },
  { id: "pitch", label: "What we sell" },
  { id: "who", label: "Who to contact" },
  { id: "emails", label: "Writing emails" },
  { id: "objections", label: "Objections" },
  { id: "call", label: "The discovery call" },
  { id: "rules", label: "Rules" },
  { id: "earn", label: "Earnings" },
  { id: "tools", label: "Your tools" },
];

const box = "rounded-2xl border border-white/[0.08] bg-[#131B2E]/60 p-5";
const h2 = "text-base font-extrabold text-white";
const h3 = "text-sm font-bold text-white";
const p = "text-xs leading-relaxed text-slate-300";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${box} space-y-3`}>
      <h3 className={h3}>{title}</h3>
      {children}
    </div>
  );
}

function List({ items, tone = "default" }: { items: string[]; tone?: "default" | "do" | "dont" }) {
  const mark = tone === "do" ? "✓" : tone === "dont" ? "✕" : "•";
  const color = tone === "do" ? "text-emerald-400" : tone === "dont" ? "text-rose-400" : "text-purple-300";
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className={`flex gap-2 ${p}`}>
          <span className={`font-bold ${color}`}>{mark}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Template({ label, subject, body }: { label: string; subject?: string; body: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D1322] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">{label}</span>
        <button
          type="button"
          className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
          onClick={() => {
            void navigator.clipboard?.writeText(`${subject ? `Subject: ${subject}\n\n` : ""}${body}`).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {subject && <p className="mb-2 text-xs font-bold text-white">Subject: {subject}</p>}
      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">{body}</pre>
    </div>
  );
}

const SERVICES = [
  { name: "Custom CRM", range: "roughly $5,500 – $12,000", time: "4–6 weeks", what: "A pipeline, portals and reports built around how the client really sells or runs jobs, instead of a generic tool. No per-user licence fees." },
  { name: "SaaS platform", range: "roughly $8,000 – $16,000", time: "6–8 weeks", what: "A subscription product with separate customer workspaces, billing, roles and admin. For founders turning a service or idea into software." },
  { name: "Marketplace", range: "roughly $9,500 – $18,000", time: "6–10 weeks", what: "A platform connecting customers and providers, with payments, job tracking and an admin console." },
  { name: "Operations / ERP / HR system", range: "roughly $9,000 – $19,000", time: "varies", what: "Scheduling, staff, inventory and reporting in one system, replacing spreadsheets and email threads." },
  { name: "AI features, e-commerce and web apps", range: "scoped per project", time: "varies", what: "AI inside a product (quizzes, ordering, drafting), custom online stores, client portals, and technical SEO." },
];

const WHO = [
  { industry: "Property and real estate", pain: "Compliance deadlines tracked on spreadsheets; agencies chasing for certificates.", title: "Operations manager, director, head of compliance", proof: "property-compliance-crm" },
  { industry: "Travel and ticketing", pain: "Leads arriving by WhatsApp, Facebook, phone and walk-in with no shared view.", title: "Owner, managing director, sales manager", proof: "airline-ticketing-crm" },
  { industry: "Recruitment and staffing", pain: "Candidates and clients in spreadsheets and inboxes; slow follow-up.", title: "Founder, recruitment director", proof: "recruitment-crm" },
  { industry: "Logistics and transport", pain: "Bookings, drivers and customers tracked in different places.", title: "Operations director, owner", proof: "logistics-platform" },
  { industry: "Home and field services", pain: "Jobs, quotes and technicians coordinated by phone and messages.", title: "Owner, operations manager", proof: "cleaning-marketplace" },
  { industry: "E-commerce", pain: "Paying for many apps to patch checkout, couriers or pricing rules.", title: "Founder, e-commerce manager", proof: "biztrackbd-ecommerce-platform" },
  { industry: "Education and training", pain: "Tutors spending hours on marking, reports and invoicing.", title: "Centre director, academic lead", proof: "ai-tutoring-platform" },
  { industry: "Restaurants and hospitality", pain: "Missed phone orders during service.", title: "Owner, operations lead", proof: "ai-restaurant-ordering-platform" },
];

const OBJECTIONS = [
  { o: "“We already use HubSpot / Salesforce / a spreadsheet.”", a: "That's fine, and for many teams it's the right answer. We only suggest custom software when the tool is being bent to fit a process it wasn't made for. Ask: “What do you do outside the tool today to make it work?” If the answer is a lot, there is a conversation to have." },
  { o: "“It's too expensive.”", a: "Give the honest range, not a quote: a focused CRM is typically in the thousands, not tens of thousands, and there are no per-user fees afterwards. Then compare with what they pay per seat each month. Never promise a final price: that comes after the call." },
  { o: "“Send me some information.”", a: "Send one short reply with one relevant case study link, and a single question that makes them respond. Offer the 30-minute call as the next step, not a brochure." },
  { o: "“Not now / bad timing.”", a: "Agree, ask when it would make sense, and set yourself a task in the CRM for that date. Move the lead status to “Bad timing”. Do not keep chasing." },
  { o: "“I need to ask my partner / team.”", a: "Offer to join a short call with them. Ask who else should be in the room and what they would want to know." },
  { o: "“Where is your team based?”", a: "Be direct. The Digital Dude Ltd is registered in England and Wales and our engineering studio is in Dhaka, Bangladesh. We work with UK and Australian clients remotely, with calls and demos in their working hours, weekly progress demos, and a UK contract." },
  { o: "“Can I see something you've built?”", a: "Yes. Send the relevant case study from the Proof section, and offer to show it live on the call. Only describe what is written there: never invent results or client names." },
  { o: "“What if you disappear?”", a: "The client gets the full source code and the database, so they are never locked in. Any developer can take it on." },
];

const CALL_QUESTIONS = [
  "What problem are you trying to solve, and what is it costing you (time, errors, lost leads)?",
  "Who uses the system today, and who else would need access (staff, partners, customers)?",
  "What do you use now, and what do you do outside it to make it work?",
  "What must it connect to (accounting, payments, email, WhatsApp)?",
  "How do you picture this working in a year, and what would make it a success?",
  "Who makes the decision, and is there a date you need it by?",
  "Do you have a budget range in mind? (A range is enough; it is fine to say you are unsure.)",
];

export function RepGuide({ repName, currency, meetingBonus, commissionPct, referralLink, senderEmail, dailyLimit, active, onOpenTab }: Props) {
  const [section, setSection] = useState<SectionId>("start");
  const first = repName.trim().split(/\s+/)[0] || "there";
  const money = (n: number | null) => (n === null ? "—" : `${currency} ${n.toLocaleString()}`);
  const bonus = meetingBonus[0] === null && meetingBonus[1] === null ? "set by your admin" : `${money(meetingBonus[0])} – ${money(meetingBonus[1])}`;
  const pct = commissionPct[0] === null && commissionPct[1] === null ? "set by your admin" : `${commissionPct[0] ?? 0}% – ${commissionPct[1] ?? 0}%`;
  const firstName = "{first_name}";
  const company = "{company}";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-purple/30 bg-gradient-to-r from-purple/20 via-[#131B2E] to-[#131B2E] p-6 shadow-xl">
        <span className="rounded-full bg-purple/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-300">Sales playbook</span>
        <h2 className="mt-1 text-lg font-extrabold text-white">Pitch deck and guide</h2>
        <p className="text-xs text-slate-400">Everything you need to find the right people, write emails that get answers, run a good first call, and get paid.</p>
        {!active && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Your account is not activated yet. Read this guide and prepare leads; an admin switches sending on once your contract is in place.</p>}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Guide sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${section === s.id ? "bg-purple text-white shadow-md shadow-purple/20" : "border border-white/[0.05] bg-[#131B2E] text-slate-400 hover:text-white"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "start" && (
        <div className="space-y-4">
          <Block title={`Welcome, ${first}: your job in one paragraph`}>
            <p className={p}>You open conversations with businesses that have outgrown spreadsheets and off-the-shelf tools, and you book a 30-minute discovery call with our team. You are not selling code by email and you are not quoting prices. A good rep is curious, specific and honest. You are paid when calls happen and when deals close.</p>
          </Block>
          <Block title="Your first day, step by step">
            <List items={[
              "Read “What we sell”, “Who to contact” and “Rules” in this guide (15 minutes).",
              "Open Payouts and add your payout details so earnings can be sent.",
              `Check your sender: emails go out as ${senderEmail || "your assigned address"}. Add your photo in the composer if you want a more personal look.`,
              "Add or import 20 leads in Leads CRM. Check each email is real; the system verifies addresses and warns you about risky ones.",
              "Write your first email with the composer (use the AI draft, then edit it so it sounds like you). Send a handful, not a flood.",
              "Tomorrow, open Tasks: follow-ups appear automatically three working days after you email someone.",
            ]} />
          </Block>
          <Block title="A simple daily routine">
            <List items={[
              "Start with the Follow-ups tab: do anything overdue first, then leads with no next step or gone quiet. When a lead replies, the team answers it and you are told in the bell.",
              "Spend time on new leads: research, verify, write, send. Quality beats volume.",
              "Log calls and notes in the lead so the next step is never a guess.",
              `Respect your daily sending limit${dailyLimit ? ` (${dailyLimit} emails a day)` : ""} and the hourly cap. Spread sends through the day.`,
              "End by checking leads that have gone quiet and give each a next step or close it out.",
            ]} />
          </Block>
          <Block title="How you get credit for bookings">
            <p className={p}>A booking is credited to you when it comes through your personal booking link in your emails, your referral link, or a company in the lead pool that you own. Your referral link is:</p>
            <p className="break-all rounded-lg bg-[#0D1322] px-3 py-2 font-mono text-[11px] text-purple-200">{referralLink}</p>
          </Block>
        </div>
      )}

      {section === "pitch" && (
        <div className="space-y-4">
          <Block title="The 20-second pitch">
            <p className={p}>“We build custom software for businesses that have outgrown spreadsheets and generic tools: CRMs, portals, marketplaces and operations systems. You own the code, there are no per-user fees, and we work in fixed milestones with a working demo every week.”</p>
          </Block>
          <Block title="Who we are, in plain facts">
            <List items={[
              "The Digital Dude Ltd is registered in England and Wales. Our engineering studio is in Dhaka, Bangladesh.",
              "We work with clients in the UK and Australia, remotely, with calls and demos in their working hours.",
              "Clients receive the full source code and the database. No lock-in.",
              "Delivery is in fixed milestones with a weekly working demo on a test environment.",
            ]} />
          </Block>
          <Block title="What we build (and typical ranges)">
            <p className={p}>These are typical ranges from our published cost guide. Always say “typically” and “after a discovery call we give a fixed-scope quote”. Never promise a price or date yourself.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {SERVICES.map((s) => (
                <div key={s.name} className="rounded-xl border border-white/[0.06] bg-[#0D1322] p-4">
                  <h4 className="text-xs font-bold text-white">{s.name}</h4>
                  <p className="mt-0.5 text-[11px] font-semibold text-purple-300">{s.range} · {s.time}</p>
                  <p className={`mt-1.5 ${p}`}>{s.what}</p>
                </div>
              ))}
            </div>
          </Block>
          <Block title="Proof you can point to">
            <p className={p}>Only talk about what is written in these case studies. Share the link instead of paraphrasing numbers.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {caseStudies.map((c) => (
                <div key={c.slug} className="rounded-xl border border-white/[0.06] bg-[#0D1322] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{c.tag}</p>
                  <h4 className="text-xs font-bold text-white">{c.title}</h4>
                  <p className={`mt-1 ${p}`}>{c.summary}</p>
                  <Link href={`/work/${c.slug}`} target="_blank" className="mt-2 inline-block text-[11px] font-semibold text-purple-300 hover:underline">Open case study</Link>
                </div>
              ))}
            </div>
          </Block>
          <Block title="Say and don't say">
            <List tone="do" items={["“Typically in the range of…”, “after a short call we can give a fixed-scope quote”.", "“Here is a similar project we built.”", "“I'm not sure, let me check with the team and come back to you.”"]} />
            <List tone="dont" items={["Quote a final price, a date, or promise a feature.", "Claim results, clients or numbers that are not in the case studies.", "Say a competitor's product is bad. Say when it is the right choice and when it is not."]} />
          </Block>
        </div>
      )}

      {section === "who" && (
        <div className="space-y-4">
          <Block title="The good-fit prospect">
            <List items={[
              "A real business with several staff, where the process is the business (jobs, compliance, bookings, candidates, orders).",
              "Uses spreadsheets, email threads or a tool they keep working around.",
              "Someone with authority: owner, founder, managing director, operations or department head.",
              "In the UK or Australia (the markets we serve and can contract in).",
            ]} />
          </Block>
          <Block title="Who not to contact">
            <List tone="dont" items={[
              "Consumers, students, job seekers, or one-person hobby projects.",
              "Companies that already have a lead from a colleague (the system will tell you).",
              "Anyone who has opted out, or any address the system marks invalid.",
              "Government or regulated bodies you do not understand. Ask an admin first.",
            ]} />
          </Block>
          <Block title="Industries where we have real proof">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Industry</th><th className="py-2 pr-3">The pain to listen for</th><th className="py-2 pr-3">Who to write to</th><th className="py-2">Your proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-300">
                  {WHO.map((w) => (
                    <tr key={w.industry}>
                      <td className="py-2 pr-3 font-semibold text-white">{w.industry}</td>
                      <td className="py-2 pr-3">{w.pain}</td>
                      <td className="py-2 pr-3">{w.title}</td>
                      <td className="py-2"><Link href={`/work/${w.proof}`} target="_blank" className="text-purple-300 hover:underline">Case study</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>
          <Block title="How to research a lead in five minutes">
            <List items={[
              "Open their website: what do they do, how big do they look, do they have a booking or contact process that looks manual?",
              "Look for one specific, true detail you can mention (a service, a location, a recent post).",
              "Find the right person: owner or the head of operations. Use the lead pool's search helpers; do not scrape or buy lists.",
              "Add the lead to the CRM, check the email status, and note your angle in the notes.",
            ]} />
          </Block>
        </div>
      )}

      {section === "emails" && (
        <div className="space-y-4">
          <Block title="The five rules of a good cold email">
            <List items={[
              "Short: under 120 words. One idea, one ask.",
              "Specific: mention one true thing about them. If you cannot, do not send.",
              "About them, not us: lead with their likely problem, not our services.",
              "One ask: a short call. Never ask for three things.",
              "Sound like a person: no hype, no jargon, no “revolutionary”. Read it aloud.",
            ]} />
          </Block>
          <Block title="Examples to adapt (copy, then make them yours)">
            <Template
              label="Cold email, first contact"
              subject={`Question about how ${company} tracks jobs`}
              body={`Hi ${firstName},\n\nI came across ${company} while looking at ${"{what they do}"}. A lot of businesses like yours end up running their jobs and customers across spreadsheets and inboxes, and it gets painful as they grow.\n\nWe build custom systems for exactly that (we recently built a compliance CRM that now runs 4,000+ rentals across 30+ agencies), and clients own the code, with no per-user fees.\n\nWould a 30-minute call be useful to see if it could fit ${company}? You can pick a time here: [Book a call button]\n\nThanks,\n${repName}`}
            />
            <Template
              label="Follow-up, about three working days later (plain text)"
              subject={`Re: Question about how ${company} tracks jobs`}
              body={`Hi ${firstName},\n\nJust following up in case my note got buried. If tracking ${"{the thing}"} is not a priority right now, no problem. If it is, I'd be happy to share how a similar business approached it.\n\nWorth a quick chat?\n\n${repName}`}
            />
            <Template
              label="Replying to an interested person"
              body={`Hi ${firstName},\n\nThanks for getting back to me. To make the call useful, it would help to know: what are you using today, how many people use it, and what is the main thing that frustrates you?\n\nHere are a few times that work: [Book a call button]. If you'd rather suggest a time, just say.\n\n${repName}`}
            />
          </Block>
          <Block title="Subject lines that work">
            <List items={[
              "A real question about their business: “How does ${company} handle quotes?”",
              "A specific, plain observation: “Spreadsheets at ${company}?”",
              "Never: all caps, “Re:” on a first email, fake urgency, or claims you cannot back up.",
            ]} />
          </Block>
          <Block title="Using the composer">
            <List items={[
              "Choose Cold outreach (with the Book a call button) or Follow-up (plain, no button).",
              "Use the AI draft as a starting point, then edit. Only send what you have read and are happy to stand behind.",
              "Preview the email before sending. The email design picker changes the look; “Minimal personal” works best for a first email.",
              "If the system warns an address is risky, double-check it before choosing Send anyway.",
            ]} />
          </Block>
        </div>
      )}

      {section === "objections" && (
        <div className="space-y-4">
          <Block title="Handling common replies">
            <p className={p}>The goal is never to “win” an argument. It is to understand, answer honestly, and move to the next small step or let go politely.</p>
            <div className="space-y-3">
              {OBJECTIONS.map((x) => (
                <div key={x.o} className="rounded-xl border border-white/[0.06] bg-[#0D1322] p-4">
                  <p className="text-xs font-bold text-white">{x.o}</p>
                  <p className={`mt-1.5 ${p}`}>{x.a}</p>
                </div>
              ))}
            </div>
          </Block>
          <Block title="When they say no">
            <List items={[
              "Thank them, once. Mark the lead as lost with the real reason (it helps the team learn).",
              "If they ask not to be contacted, tell an admin if there is any doubt: the system stops all emails to them automatically.",
              "Never argue, guilt, or follow up after a clear no.",
            ]} />
          </Block>
        </div>
      )}

      {section === "call" && (
        <div className="space-y-4">
          <Block title="What the discovery call is for">
            <p className={p}>A 30-minute conversation with our team to understand the problem and decide whether we can help. You are the one who opened the door; the team handles the technical detail. Your job is to make sure the right person turns up, prepared.</p>
          </Block>
          <Block title="Before the call">
            <List items={[
              "Confirm the time by email and send the meeting link.",
              "Put what you know in the lead notes: their business, the problem they mentioned, who is attending.",
              "Tell the team who they are speaking to and what they care about.",
            ]} />
          </Block>
          <Block title="Questions the call should answer">
            <List items={CALL_QUESTIONS} />
            <p className={p}>You do not need to ask all of these yourself. They are what the team will want to know, so gathering a few in advance makes the call far better.</p>
          </Block>
          <Block title="After the call">
            <List items={[
              "Move the lead to “Meeting booked” (this happens automatically when they book through your link) and add a next step.",
              "If it goes ahead: stage Negotiation, then Won or Lost with a reason.",
              "Keep nudging politely. Slow follow-up loses more deals than anything else.",
            ]} />
          </Block>
        </div>
      )}

      {section === "rules" && (
        <div className="space-y-4">
          <Block title="Non-negotiable rules">
            <List tone="do" items={[
              "Be honest. Never invent clients, results, prices, timelines or features.",
              "Contact business email addresses with a clear business reason. The system blocks addresses that cannot receive mail.",
              "Stop immediately when someone says no or asks to be removed. Unsubscribe links are added to emails automatically: never remove them.",
              "One person per company at a time: if a colleague already has the company, leave it.",
              "Read and edit every AI draft. You are responsible for what you send.",
              "Keep prospect data inside the portal. Do not copy leads to personal files or other tools.",
            ]} />
            <List tone="dont" items={[
              "Buy or scrape email lists, or use automation to message people on LinkedIn.",
              "Send the same message to hundreds of people at once. The system rate-limits you for a reason.",
              "Promise anything on behalf of the company. Say you will check and come back.",
              "Share another rep's leads or company information.",
            ]} />
          </Block>
          <Block title="Why this matters">
            <p className={p}>Emailing businesses is lawful when it is done properly: a real business reason, a clear sender identity, an easy way to opt out, and respect when someone says no. Breaking these rules can get our sending domain blocked, which hurts every rep. If you are unsure about anything, ask an admin before you send.</p>
          </Block>
          <Block title="If something goes wrong">
            <List items={[
              "A prospect is upset or threatens action: stop, do not reply, tell an admin straight away.",
              "You sent to the wrong person: tell an admin so they can help.",
              "A reply asks for legal, contract or pricing detail: pass it to the team.",
            ]} />
          </Block>
        </div>
      )}

      {section === "earn" && (
        <div className="space-y-4">
          <Block title="How you earn">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#0D1322] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Meeting bonus</p>
                <p className="mt-1 text-lg font-extrabold text-white">{bonus}</p>
                <p className={`mt-1 ${p}`}>Paid for each qualified discovery call that is held.</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#0D1322] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deal commission</p>
                <p className="mt-1 text-lg font-extrabold text-white">{pct}</p>
                <p className={`mt-1 ${p}`}>Of the deal value, on contracts that are signed and won.</p>
              </div>
            </div>
            <p className={p}>These are your personal rates, set by your admin. Your contract is the final word on terms.</p>
          </Block>
          <Block title="What counts as “yours”">
            <List items={[
              "Bookings that come through your personal booking link or your referral link.",
              "Companies in the lead pool that you own.",
            ]} />
          </Block>
          <Block title="Getting paid">
            <List items={[
              "Add your payout details in the Payouts tab. Without them, payments cannot be sent.",
              "Payout status for each booking and deal is shown in Overview: pending, then paid.",
              "If a payment looks wrong, send the booking details to an admin.",
            ]} />
            <button type="button" onClick={() => onOpenTab("payouts")} className="rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110">Open payout settings</button>
          </Block>
        </div>
      )}

      {section === "tools" && (
        <div className="space-y-4">
          <Block title="Leads CRM">
            <List items={[
              "List and Board views: drag leads between stages (New, Contacted, Meeting booked, Negotiation, Won, Lost).",
              "Each lead has a status, deal value and expected close date, tags, and two scores: Fit (how well they match who we sell to) and Engagement (what they have actually done).",
              "Next steps: follow-ups, reply reminders and call-prep tasks are created for you. Add your own too.",
              "“Gone quiet” flags leads with no activity. Give each a next step or close it.",
              "Import leads from a CSV, export your own, and save filtered views.",
              "Log calls, meetings, LinkedIn and WhatsApp messages and notes on the lead's timeline.",
            ]} />
            <button type="button" onClick={() => onOpenTab("leads")} className="rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white hover:brightness-110">Open Leads CRM</button>
          </Block>
          <Block title="Lead pool (when your account is active)">
            <p className={p}>Companies assigned to you or available to claim. Find the right contact, record the lawful basis for contacting them, then write to them from the composer. Companies you own credit you with bookings.</p>
          </Block>
          <Block title="Composer and campaigns">
            <List items={[
              "Direct outreach: single, personal emails with the Book a call button for a cold email and plain text for follow-ups.",
              "Campaigns and drips: enrol leads in a sequence. Replies stop the sequence automatically.",
              "Custom templates: save your best emails and reuse them.",
            ]} />
            <button type="button" onClick={() => onOpenTab("outreach")} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15">Open the composer</button>
          </Block>
          <Block title="Notifications">
            <p className={p}>The bell tells you when someone replies, when a company is assigned to you, and when a task is due. Check it first each morning.</p>
          </Block>
          <Block title="Stuck? Ask.">
            <p className={p}>If something in the portal does not work, or you are not sure what to do next, message an admin with a short description and a screenshot. Questions early save everyone time.</p>
          </Block>
        </div>
      )}
    </div>
  );
}
