# AI Client Acquisition System

Private tooling at `/admin/acquisition` for researching Australian property managers, recording a
documented basis for contacting them, drafting evidence-based emails and approving campaigns.
It is built into the existing site; there is no separate app. Everything is prefixed `acq_`
(tables) or `acquisition` (routes) because `jobs` and `contacts` already mean other things here.

## Status of the build

| Blueprint phase | State |
| --- | --- |
| 1. Foundation: schema, RLS, auth, CRUD, audit | Done |
| 2. Research: import, dedupe, scoring, AI research, consent review | Done |
| 3. Campaigns: AI drafts, approval locking, eligibility, suppression | Done |
| 4. Automation: durable jobs, webhooks, reply classification | Done, **except the sender** |
| 4. Automation: initial-email sending via Brevo | Done (`lib/acquisition/queue/send.ts`); sending starts **paused** |
| 4. Automation: follow-up scheduling | **Deliberately not built** |
| 6. Global lead pool: markets, countries, duplicates, assignment, rep portal | Done (see below) |
| 5. Pilot: end-to-end tests, deliverability, launch | Not started |

Sending: each worker tick (`enqueueDueSends`) turns approved initial messages of **active** campaigns into `send_email` jobs
(staggered 2-10 minutes, capped by the campaign's remaining daily allowance). The handler (`sendMessage`) refuses non-allowlisted
recipients, then **always** calls `reserveSend()` before the provider. It never auto-retries an ambiguous provider outcome (the message
stays `sending` and you get an alert). `schedule_follow_up` is intentionally unregistered, so an attempt fails loudly.

### Brevo setup
1. Create a sending subdomain (e.g. `mail.digitaldude.co.uk`), add it in Brevo (Senders & IP > Domains) and publish the SPF/DKIM/DMARC
   records Brevo gives you. Add a sender like `hello@mail.digitaldude.co.uk`.
2. Env: `ACQ_BREVO_SENDER_EMAIL`, `ACQ_WEBHOOK_SECRET` (>= 16 chars), existing `BREVO_API_KEY`. For the first tests set
   `ACQ_SEND_ALLOWLIST=you@yourdomain.com` so nothing can reach a real prospect.
3. Brevo > Transactional > Settings > Outbound webhook: URL `https://www.digitaldude.co.uk/api/acquisition/webhooks/email?token=<ACQ_WEBHOOK_SECRET>`,
   events: delivered, hard bounce, soft bounce, blocked, invalid, spam, unsubscribed.
4. Replies go to the campaign's reply-to mailbox (not parsed automatically); log them in the Inbox. Keep the daily cap low while the
   subdomain warms up. Brevo's terms require permission-based sending: only email contacts with a recorded consent basis.

## Where the rules are enforced

The compliance rules are enforced in Postgres (`supabase/migrations/0022_acquisition_system.sql`),
not just in the app, so no code path can skip them:

| Rule | Mechanism |
| --- | --- |
| Unverified contacts cannot be eligible | trigger `acq_contacts_guard` + `acq_contact_consent_ok()` (latest record must be a reviewed, evidenced, unexpired, human-reviewed basis) |
| Only eligible contacts can join a campaign | trigger `acq_campaign_leads_guard` |
| AI/system can't approve or review | CHECK constraints on `approved_by` / `reviewed_by`; no AI code path to those routes |
| Approval freezes content | trigger `acq_campaigns_guard` (content columns immutable once past `draft`/`rejected`) + `acq_messages_guard` |
| Approve exactly what was previewed | `acq_approve_campaign(id, seen_hash, actor)` refuses if `acq_campaign_content_hash()` changed |
| Legal status transitions only | state machine in `acq_campaigns_guard` |
| Suppression is permanent | update/delete blocked by trigger; no removal code exists |
| Opt-out stops everything immediately | trigger `acq_suppression_apply` cancels drafts, jobs and sequences |
| Re-imported lead stays suppressed | `acq_contacts_guard` on insert; suppression has no FK to contacts |
| Suppression checked at send time | `acq_reserve_send()`: one transaction checks global pause, campaign active, approval hash, message hash, contact eligibility, suppression, consent, follow-up rules, daily cap, then marks the message `sending` |
| Audit trail | triggers on campaign status, consent and suppressions; append-only |
| RLS | enabled on every table with **no policies**; only the server's service-role key can read or write |

Sending starts **paused** (`acq_settings.sending_paused = true`) and fails closed.

## Setup

1. Apply `supabase/migrations/0022_acquisition_system.sql` in the Supabase SQL editor.
2. Copy the new block of `.env.example` into your environment. Required: `ACQ_UNSUBSCRIBE_SECRET`
   (>= 32 chars; **never change it after sending**, it signs every unsubscribe link).
   Optional: `AI_*` (any OpenAI-compatible endpoint; blank = manual research), `TELEGRAM_*`, `ACQ_BOOKING_URL`.
3. Sign in at `/admin/login`, open **Client Acquisition**, and check **Safety & settings** for config status.
4. For background jobs, either press **Run worker now**, or call `GET/POST /api/acquisition/cron/worker`
   with `Authorization: Bearer $CRON_SECRET` on a schedule (Vercel Cron or the existing pg_cron pattern).

## AI provider key (Safety & settings)

Instead of the `AI_*` environment variables you can enter the base URL, model and API key under **Safety & settings > AI provider**.
Use **Test connection** to check the key before relying on it (one tiny request; it explains a bad key, model or quota). A saved key is
encrypted (AES-256-GCM, derived from `ACQ_UNSUBSCRIBE_SECRET`), never shown again, and overrides the environment variables. Base URLs must be
public https endpoints. Changing `ACQ_UNSUBSCRIBE_SECRET` makes a saved key unreadable (re-enter it).

## Automatic daily discovery and research (opt-in)

Switch on at **Safety & settings > Automatic discovery & research** (default OFF). Needs the AI key; discovery also needs
`BRAVE_SEARCH_API_KEY`. The worker (run every 10 minutes by pg_cron, migration `0024_acquisition_cron.sql`) each Sydney day:
1. runs up to `ACQ_DAILY_SEARCH_QUERIES` web searches spread over the enabled markets (rotating daily), keeps unique business sites allowed by
   the market (portals, social networks and directories excluded), skips known and suppressed domains, and adds up to
   `ACQ_DAILY_NEW_COMPANIES` as "AI discovered" companies;
2. researches new companies and any not researched in 30 days (up to `ACQ_DAILY_RESEARCH_LIMIT`), verifying every claim against the page;
   discovered companies with no verified proof they are the right kind of business are set to *deprioritized*, not deleted;
3. saves **suggested addresses**: emails literally published on the company's own website (own domain only; free-mail, placeholder and
   suppressed addresses excluded), with the source and a quote.

Nothing is emailed automatically. A suggestion is **not a contact**; accepting one creates a `needs_review` contact that still needs a
recorded lawful basis.

**Legal risk, your decision:** the Spam Act 2003 (Cth) prohibits supplying or using *address-harvesting software* and harvested-address lists to
send commercial email. Automatically collecting addresses from websites is the activity that rule targets. This feature collects only addresses
a business publishes on its own site and requires human review, but whether that is compliant for your use is a question for a lawyer. To avoid
it, leave auto research off or remove `saveContactSuggestions` from `research/pipeline.ts`.

## Global lead pool

- **One do-not-contact list.** Rep emails (one-off and drip) pass `lib/outreachGate.ts`: the shared `acq_suppressions` list (email and
  whole-domain) plus legacy `rep_unsubscribes`, failing closed on lookup errors. Rep emails carry a sender-identity footer (Safety & settings >
  Sender identity) and a signed one-click unsubscribe link. Migration `0025` enables RLS on the rep tables and copies old rep opt-outs into the
  shared list. Rep sessions have no built-in secret (set `REP_AUTH_SECRET` or `ADMIN_PASSWORD`); sending and campaign enrolment need completed onboarding.
- **Markets** (`/admin/acquisition/markets`): an industry in a country with its own search phrases, places, allowed site endings and a "what a
  good fit looks like" text that guides the AI. Migration `0026` seeds "Property management - Australia" and backfills existing companies to it.
- **Country rules:** a country must have an enabled rule before any contact at a company there can be emailed. AU, GB and US are seeded as allowed;
  everything else is blocked until you enable it (`acq_reserve_send` returns `country_blocked`; a company with no country is blocked too). The
  notes are starting points, not legal advice.
- **Near-duplicates:** companies with the same normalised name (case, punctuation, legal suffixes ignored) and country but a different website are
  flagged. Review on the Companies page: merge (contacts, research and suggestions move to the original; the duplicate is archived, never deleted) or
  "not a duplicate". Nothing merges automatically.
- **Lead pool** (Companies page): filterable, server-paginated list of every company. Select several and assign to a rep, unassign, set status,
  change market, run research, apply rules, archive, or export CSV (formula-injection safe, max 5,000 rows). One owner per company is enforced in the database.
- **Claiming and rules** (Markets page): reps may claim unowned companies only from markets you grant them, up to a cap on open companies.
  Auto-assignment rules (market, country, minimum fit score -> rep; lowest priority number first) run after research scores a new unowned company.
  Offboarding or deleting a rep returns their open companies to the pool (history kept in `acq_assignment_log`).
- **Rep portal "Lead Pool" tab:** "My companies" and "Available to claim" (granted markets only). Each company has ready-made LinkedIn/Google search
  links that open in the rep's own browser (nothing is scraped), a field for the company's LinkedIn address, the AI research evidence, suggested
  addresses, contact entry and **a lawful-basis form the rep completes themselves** (recorded under their name; visible in the audit log). A contact
  becomes eligible only when the database accepts the basis, and then appears in the rep's Leads CRM (source "Lead pool") so templates, drips and
  one-off email work as before.
- **Send gate for pool contacts:** rep emails and drip steps to an address in the pool require that the rep owns the company, the contact is
  eligible with a valid basis, the address is not suppressed and the company's country is enabled (`acq_rep_can_email`). A first email moves the
  company to "contacted". A rep's own non-pool prospects behave as before.

- **Contact finder (Hunter.io):** "Find contacts" on a company (admin company page and the rep Lead Pool) looks up published business addresses
  for the company's domain. Only addresses on the company's own domain are kept (free-mail and other domains dropped), results are cached for
  30 days per company, and lookups are capped daily (`ACQ_DAILY_HUNTER_LOOKUPS`, default 25). Hunter results are **suggestions**, exactly like
  website-found addresses: a person must accept one and record a lawful basis before it can be emailed. The Spam Act "address-harvesting" caveat
  above applies; UK/EU personal-data rules (GDPR) apply to named individuals, and the country rule table still gates sending.
- **API keys in the UI** (Safety & settings > Contact finder & web search keys): Hunter and Brave keys can be saved there (encrypted, never shown
  again, override env vars) with a **Test connection** button (Hunter also shows the plan and monthly searches used).

- **Booking credit:** a booking made with no referral link is credited to the rep who owns the company of the booker's email, but only on an exact
  match to a pool contact's email (never by company domain), and only while that rep is active. The booking is tagged `lead_pool`, the rep's activity
  log records it, and the company moves to "meeting".
- **Offboarding:** when a rep is offboarded or deleted, their pool companies return to the pool, their campaigns pause, active drips are cancelled and
  pending queued emails are cancelled (sent history is kept). The drip sender also refuses to send for an offboarded rep.
- **Reports** (`/admin/acquisition/reports`): funnel by market, per-rep table (owned, open, needs contact, contacted, meetings, won, cleared contacts,
  emails sent, bookings), discovery yield per market (30 days), and AI/contact-lookup usage.

**Migrations, in order:** `0022`, `0023`, `0024` (cron; replace `<CRON_SECRET>`, never commit the real value), `0025`, `0026`, `0027`, `0029`, `0030`, `0031`.

## Daily flow

Import companies → run research (or add sourced notes) → add a contact → **record your consent review**
→ create a campaign → add eligible contacts (drafts are generated) → edit drafts → submit →
**Approvals**: approve the frozen version → launch.

## API

All under `/api/acquisition`. Admin routes require the admin session cookie, a same-origin
`Content-Type: application/json` request, and Zod validation. Public: `unsubscribe` and `webhooks/email`.

| Route | Purpose |
| --- | --- |
| `POST research` | enqueue a research job (one per company per day) |
| `GET/POST companies` | list / bulk import with dedupe |
| `POST companies/:id/research-notes` | manual sourced evidence; rescoring |
| `POST contacts`, `POST contacts/:id/consent` | add contact / record a human consent review |
| `GET/POST campaigns`, `PATCH campaigns/:id` | list, create, edit drafts |
| `POST campaigns/:id/leads`, `PATCH messages/:id` | add recipients + drafts; edit a draft |
| `POST campaigns/:id/status` | submit, revoke, launch, pause, resume, complete |
| `POST approvals` | approve (bound to a content hash) or reject |
| `PATCH replies/:id`, `POST meetings` | human classification; offer booking link |
| `GET/POST suppressions`, `POST settings` | suppress; emergency pause |
| `GET/POST unsubscribe` | confirmation page (GET never mutates); apply opt-out (also RFC 8058 one-click) |
| `POST webhooks/email` | HMAC-verified provider events; idempotent |

## Webhook format

`POST /api/acquisition/webhooks/email` with headers `x-acq-timestamp` (unix seconds, +/-5 min) and
`x-acq-signature: sha256=HMAC_SHA256(ACQ_WEBHOOK_SECRET, "<timestamp>.<raw body>")`, body
`{"events":[{"id","type":"delivered|bounced|complained|replied|unsubscribed","email","providerMessageId?","bounceType?","body?"}]}`.
Brevo uses its own payloads authenticated by `ACQ_WEBHOOK_SECRET` (bearer header or `?token=`), see `BrevoProvider`; the HMAC format above is the generic fallback used when Brevo isn't configured.

## Replies, follow-ups, alerts and bulk work (migrations 0032-0035)

**Migration order.** `0022, 0023, 0024 (with the real cron secret), 0025, 0026, 0027, 0029, 0030, 0031, 0032, 0033, 0034, 0035, 0036, 0037, 0038, 0039, 0040, 0041`.
Run each file whole. A half-applied file (for example only the last statements of `0029`) breaks the rep portal.

**One contact per company at a time.** A first email to a contact is refused while a colleague at the same company has a
live conversation: an admin campaign email that was sent, is waiting for its follow-up or got a reply; a rep email in the
last 30 days; or an active rep drip. Enforced in `acq_reserve_send` and `acq_rep_can_email` through `acq_company_other_active`.

**Follow-ups.** The database decides who is due (`acq_due_followups`): first email delivered, campaign active with
follow-ups on, N business days (Sydney calendar) elapsed, no real reply, at most one per lead. The worker renders the
already-approved follow-up template (`scheduleFollowUps`) and creates it atomically (`acq_create_followup`). The send still
passes `acq_reserve_send` (pause, suppression, consent, country, closed company, no reply, daily cap). A follow-up ends the sequence.

**Replies (Gmail).** Brevo's free outbound webhook does not report replies, so the worker reads the shared reply inbox with
the read-only Gmail API. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (scope `gmail.readonly`). Mail from a
known contact is stored (idempotent on the Gmail message id), classified, stops the sequence and notifies the owning rep and the
admin. Mail from a rep's own one-off prospect only notifies that rep. Auto-replies and system senders are ignored; nothing else in
the inbox is stored. Without the three variables this step is skipped.

**Alerts.** Notifications are stored in `acq_notifications` and shown in the app: the bell in the admin header (every admin page,
refreshed each minute) and the Overview list; reps see theirs on the rep dashboard. They are **not emailed**, with one exception:
reps get one email digest per batch of newly assigned companies. This covers replies, failed jobs, the worker watchdog (worker
stopped, 3+ jobs failed in 24 hours, once per day per problem), cold leads, due tasks, proposal views and every campaign
follow-up that is sent. The admin inbox only receives new bookings, job applications and client portal tickets.

**AI-drafted lawful basis.** "Draft with AI" fetches the page the address was found on and the company's contact/about/team pages
and fills the form **only when the address is really on a page**; otherwise the form stays empty and says so. It is a draft: the
rep reads it and clicks Record, and the database re-checks it. The same applies to the bulk table (Needs lawful basis): only
verified rows are pre-ticked, and nothing is recorded without a tick.

**Leads CRM.** Adding or accepting a pool contact saves it to the rep's Leads CRM immediately (source "Lead pool"). Until a basis is
recorded it shows "needs lawful basis" and every send path still blocks it.

**Bulk actions.** Rep: select companies in My companies (find contacts, max 10 per click; set status; release), and the Needs lawful
basis table. Admin: Companies list (find contacts, max 10 per click, plus the existing actions) and the Suggestions page (bulk accept or dismiss).

**Reply trust.** A reply is only processed automatically when Gmail's `Authentication-Results` shows DMARC pass, or a DKIM pass for
the sender's own domain. Otherwise nobody's sequence is stopped and nobody is suppressed: the admin gets an "Unverified reply" alert
and decides. Mail with no automation headers is a person talking, so "I'm away until March" in it is held for a human, never treated as an
auto-reply. One failing message never blocks the others, and the Gmail cursor only advances when everything was handled.

**Rep notifications.** The dashboard bell lists the rep's replies and new assignments (also emailed).

**Industry templates.** `lib/industryTemplates.ts` holds drafted starting wording for the seven industries: pick one when creating an admin
campaign, and reps find "Industry: ..." templates in the outreach composer. They are drafts to edit and make no claims about the recipient.

**AI reply suggestions.** In the admin Inbox and the rep "Replies" tab. The text is a draft for a person to edit: nothing is sent from the
suggestion, opt-outs / bounces / auto-replies get none, only the booking link may appear as a link, and a rep only sees their own earlier email.
Reps use "Use in composer" so the normal send checks (suppression, basis, country, one-contact rule, caps, footer) still run.

**Applicant emails.** Status changes report whether the Brevo email actually went out, instead of silently ignoring a failure.

**AI-written emails (migration 0037).** The AI can write a first email (and a follow-up) for one contact from that company's *verified*
research only (`lib/acquisition/drafting/compose.ts`). Everything it returns is validated: every claim must trace to a numbered verified
fact, numbers must appear in those facts, only the booking link may appear (no other links, bare domains or email addresses), no hype
or guarantees, short length limits, and the booking link must be the ask. If the AI is off, fails or breaks a rule, the normal template is
used instead. Where it is available:
- **Rep composer:** "Write with AI" (and "Write email with AI" on a cleared contact in the Lead Pool). A draft for the rep to edit; shows
  the facts it used or says it had none. The normal send checks still run when the rep sends.
- **Admin campaigns:** tick "Write each email with AI from the research". Each contact gets their own draft, shown in Approvals. The
  follow-up text is stored on the lead at draft time and is part of the campaign approval hash, so it is reviewed with the first email and
  editing it later pauses sending like any other approved content. Existing campaigns keep exactly the hash they had.

**Override of the one-contact rule.** Admin only, per company (company page, "Several contacts at this company"). Audited. Reps cannot set it.

**Email verification (migration 0038).** Free and built in (`lib/acquisition/verify/email.ts`). For every address it checks: syntax, no-reply
mailboxes, disposable-email domains, likely domain typos ("gmial.com"), role accounts (info@, sales@; flagged, not blocked) and whether the
domain has mail servers (MX records). It cannot confirm the individual mailbox: that needs a mail-server probe, which needs outbound port 25
and so cannot run on Vercel. Results (`safe | risky | invalid | unknown`) are cached 30 days in `acq_email_checks`, per address.
- **Invalid** (no such domain, no mail server, disposable, no-reply, bad syntax) is blocked everywhere: the rep composer, rep drips, admin
  sends, and both database gates (`acq_reserve_send`, `acq_rep_can_email`). It is also refused when a contact is added, and dropped from website
  and Hunter suggestions. Saying "send anyway" never overrides invalid.
- **Risky** (a likely typo, or a probe result like catch-all) is a warning: the rep composer asks "Send anyway?"; automated sends are not stopped.
- **Unknown** (a DNS hiccup) never blocks and is re-checked after about an hour.
- Checked: when a contact is added or accepted, just before sending (re-checked when older than 30 days), and with the "Verify emails" buttons.
- **Optional mailbox-level probe (Reacher).** Run the open-source Reacher backend on a small server where outbound port 25 is open, set
  `REACHER_URL` (and `REACHER_SECRET`, sent as the `x-reacher-secret` header), and results gain real mailbox answers. If the service is down
  or slow the free checks stand: it can never block or delay sending. Check Reacher's current licence and docs before deploying it.

**Email design (migration 0039).** Rep outreach emails come in four designs: Minimal personal (default for a first email), Plain text (default for a
follow-up), Branded card, and Industry-themed card. The admin "Email design" tab edits colours, button text and shape, font, logo, header/footer text and
per-industry themes with a live preview; the rep composer has a design picker, a Preview that uses the same builder as sending, and a signature
photo upload (JPEG/PNG/WebP up to 2 MB, checked by file content, stored in the public `rep-photos` bucket under an unguessable name). The sender
identity and the unsubscribe link are in every design and cannot be removed. Cold emails carry the "Book a 30-minute call" button by default; follow-ups do not.

**Personal booking link and page (migration 0040).** Each email with a button gets a short private link `/b/<code>` (10 random characters). The page
looks up the rep, the recipient's first name, company and industry from the database (nothing personal is in the URL), shows the rep's photo and name,
industry pain points and what we build, approved proof (case studies you pick, or results you type), and the real booking form pre-filled. A booking
made from the page is credited to the rep who sent it and recorded on the link. Views (bots and link scanners excluded), button clicks and bookings are
counted per link, and the Reports tab breaks them down by rep, industry, stage, template and design. Links expire after 180 days (the page then shows
without personal details). The admin "Booking page" tab edits the default and per-industry text, colour and image with a live preview; everything is plain
text, images must be https, and an empty industry field falls back to the built-in text. `/contact?ref=...` keeps working.

## Tests

`npm test` runs 130+ tests. The integration tests boot an in-process Postgres (PGlite), apply the real
migration, and exercise the triggers and `acq_reserve_send()` directly (approval locking, suppression,
follow-up rules, daily cap, job queue).

## Known limitations

- **Single shared admin login.** The audit trail records `ACQ_OPERATOR_NAME`, not an individual. The blueprint
  names Supabase Auth; the site's existing admin cookie was reused to avoid a second auth system.
- **Not legal advice.** The consent checklist encodes the blueprint's reading of the Spam Act; have it reviewed,
  along with privacy and cross-border obligations for Bangladesh -> Australia.
- **Race window:** a suppression arriving between `acq_reserve_send()` and the provider call cannot be recalled.
- **Free-tier note:** Supabase Free has no automatic backups and pauses on inactivity; the suppression list is the
  one table you must never lose, so export it regularly.
- Scoring weights are hypotheses. The AI never sets `fit_score`; it is computed from verified evidence.
- Removing an erroneous suppression requires a manual SQL change with the trigger disabled, by design.

**Rep CRM (migration 0041).** Run after 0038-0040. Each rep lead now has a timeline (emails, replies, bookings, calls, notes, stage changes), tasks with due times, a status (new, attempted, connected, interested, bad timing, unqualified) next to the six stages, deal fields (value, currency from country, expected close date, win chance), a required reason when a deal is lost, tags, and two separate scores: fit (A-D) and engagement (hot/warm/cold; email opens are never used). Sending an email schedules a follow-up task 3 working days out; a reply creates a "reply to them" task and cancels follow-ups; a booking moves the lead to meeting booked and adds a preparation task; won, lost, opt-out and bounce close tasks. A contact a colleague already has cannot be added (reps see only a generic message). Manually added and imported leads have their email checked like any other. Reps can import and export CSV, keep saved views, use a board, and export or erase one person's data (erase adds the address to the do-not-contact list). Admin: Acquisition > Rep CRM has the report (weighted forecast, lost reasons, per-rep health, real win rates), all leads with search, reassign and merge, an all-leads CSV, and settings (quiet-lead days, stage probabilities, follow-up delay, retention of at least 6 months). The worker alerts due tasks, sends a daily quiet-leads digest (admin hears about leads quiet for twice as long), refreshes old scores, and anonymises inactive non-won leads past the retention period. Until 0041 is applied the lead list still loads, without the new features.

**Blog automation.** Admin > Acquisition > Blog automation writes and publishes one blog post each weekday from a topic queue (`lib/blog/topics.ts`, built from the October 2026 keyword research; see `docs/keyword-plan-2026-10.md`). It uses the AI model saved under Safety & settings, and gives it only a fact sheet (`lib/blog/facts.ts`: company facts, published price bands, real case studies) and a list of internal pages it may link to. Every post must pass an automatic check (`lib/blog/validate.ts`) before it is saved: 1,000-2,300 words, at least four sections, a FAQ with three or more questions, three or more allowed internal links and a link to /contact, no external links, no money/percentage/multiplier figures that are not in the fact sheet, and none of a list of banned claims (guarantees, superlatives, unnamed studies, invented client stories). A post that fails is not published: it is saved as a draft in the normal blog editor (hidden from the site) with the checker's problems recorded on the topic, and retried with that feedback (at most 3 attempts, 25 minutes apart, updating the same draft). After that the topic shows as "draft" with an Open draft link and the queue moves on; fix the draft and publish it in the blog editor and the topic is marked published automatically. A previewed post can also be kept with "Save as draft to fix later".

**Blog autopilot (weekly).** Every Monday 07:00 UTC (`/api/cron/blog-insights`, also "Run the weekly check now" in admin) `lib/blog/insights.ts` does five things. (1) Reads Search Console with the same service account as the admin SEO tools (GOOGLE_SERVICE_ACCOUNT_KEY, owner access on the property): 28-day totals against the previous 28 days, top queries and pages. (2) Checks how Google is indexing each automated post (URL Inspection, posts older than two days). (3) Asks Google to re-read the sitemap if posts were published since it last did. (4) Finds new topics (`lib/blog/discovery.ts`): real Search Console queries are filtered (no brand searches, operators or off-topic phrases), compared with every existing post and topic, and a few KeywordTool.io search suggestions are added when Search Console has little to offer; the AI may only choose from those real phrases and returns a brief that is validated before it is queued (topics backed by impressions go to the front of the queue; at most 7 a week and 40 waiting). (5) Safety brake: if at least 6 automated posts are over 21 days old and Google has indexed under 30% of them, publishing is paused with the reason shown in admin. All switches are on the Blog automation page. The report is stored in `acq_settings` key `blog_insights`. It is OFF until an admin switches it on (preview a post first). Triggered by a Vercel cron (`vercel.json`, 08:00 UTC Mon-Fri, needs CRON_SECRET) and, for retries, the worker tick. State lives in `acq_settings` key `blog_automation` (no migration). The cover image is the dynamic `/api/og` image.
