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
| 4. Automation: sending and follow-up scheduling | **Deliberately not built** (blueprint §11) |
| 5. Pilot: end-to-end tests, deliverability, launch | Not started |

`EmailProvider.send()` throws. Before building it, pick a provider whose terms permit this use, and
route every send through `reserveSend()` (`lib/acquisition/compliance/suppression.ts`).
`send_email` / `schedule_follow_up` job types are intentionally unregistered, so an attempt fails loudly.

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
When a provider is chosen, add a provider-specific `EmailProvider.verifyAndParseWebhook`.

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
