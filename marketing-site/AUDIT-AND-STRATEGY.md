# allerion.io — Audit, Redesign & First-Client Strategy

**Prepared for:** Allerion (Joey Allee) · **Date:** 2026-06-24
**Goal:** Land the **first paying client** (a non-technical roofing / construction / field-service owner).
**Scope:** Audit the live site, define better UI/UX, recommend what software to build, and re-sequence the funnel to convert.

> Important: the live **allerion.io** is the **AI-infrastructure consultancy**. It is a *different* project from this repo's `Allerion-Digital-Twin` ("Project Genesis," the mineral/REE federal-procurement twin). This strategy and the rebuilt landing page in `marketing-site/index.html` are for the **consultancy**. The live site's source isn't in any connected repo, so `index.html` here is a **ready-to-deploy reference rebuild** — wire its CTAs to your real calendar and host it.

---

## 1. The one-sentence diagnosis

> The site is built to impress AI builders, but it's selling to roofers — and it asks a stranger to **pay $1,500 on a Stripe page before ever talking to a human**, with no guarantee and only your own company as proof. Re-sequence the funnel to **call → trust → pay**, translate the language to plain English, add proof + a guarantee, and the first client becomes reachable.

---

## 2. Audit findings (live allerion.io)

Severity is rated by impact on landing client #1.

| # | Area | Severity | Finding | Fix |
|---|------|----------|---------|-----|
| 1 | **Conversion path** | 🔴 HIGH | Primary CTA "Book the audit" links **straight to Stripe Checkout** — pay $1,500 with no call, no calendar, no human. "Book a call" can dump users on a CLI login gate ("Awaiting operator credentials…"). | Make **one** primary CTA everywhere: *"Book a free 20-min fit call"* → a real calendar (Cal.com/Calendly). Payment comes **after** the call. |
| 2 | **Value proposition** | 🔴 HIGH | H1 "A new kind of code for running a company"; subhead "AI infrastructure for businesses that want to run themselves." A roofer can't tell what they get or what changes Monday. | Lead with the buyer's outcome: *"Stop losing jobs you never knew you missed."* Pull the $257K / 9-hrs proof into the hero. |
| 3 | **Trust / proof** | 🔴 HIGH | Exactly one proof source — R&B Roofing, **your own company**. No third-party clients, no guarantee, no founder face, no risk reversal. | Add a money-back/value guarantee, founder photo + honest origin story ("built it for my own roofing company first"), and line up 1–2 free/discounted audits to manufacture **external** case studies. |
| 4 | **Copywriting** | 🔴 HIGH | Insider jargon for a non-technical audience: "AI infrastructure," "Second-Brain Installs," "MCP server," "operators." | Translate every feature to a plain-English result. Kill MCP/infrastructure/operator language from public copy. |
| 5 | **Information architecture** | 🔴 HIGH | 9 nav items and **three competing pricing systems** (homepage ladder, `/enterprise` $500–$40K+, `/marketplace` 7 SKUs). Dead-ends into a login gate. | Collapse to one page + a booking page. Nav: How it works · Pricing · Proof · **Book a call**. Hide Enterprise/Marketplace from the first-client path. |
| 6 | **First-client blocker** | 🔴 HIGH | The single biggest blocker = pay-$1,500-upfront-to-a-stranger, compounded by jargon + thin proof. | Invert the funnel (free call first), add guarantee + founder credibility, speak the buyer's language. |
| 7 | **Visual / UI** | 🟡 MED | Dev/CLI aesthetic (monospace, terminal prompts, `$ allerion install --live`) signals "for engineers," contradicting the trades audience. | Shift the marketing site to **light, warm, outcome-first, trust-heavy**. Keep one tasteful terminal motif as an accent; save the full CLI theme for the client portal. |
| 8 | **Mobile** | 🟡 MED | Terminal/monospace UI and copy-chips render cramped on phones; trades buyers browse in the field. | Verify single-column hero/pricing at 375px; add a **sticky tap-to-call + book bar**; `tel:` link in a sticky header. |
| 9 | **SEO / metadata** | 🟡 MED | Title is brand+jargon led, zero terms a roofer searches; no meta description; H1 is a slogan; no FAQ/LocalBusiness schema despite having 5 FAQs. | Keyword/geo title ("AI Automation for Construction & Roofing \| Allerion, Louisville KY"), meta description, FAQ + LocalBusiness schema, keyword-bearing H1. |

### Top 8 fixes, ranked by impact on the first client
1. CTA: replace "pay $1,500 on Stripe" with **"Book a free 20-min fit call"** on a real calendar.
2. Add **risk reversal** — a bold money-back/value guarantee on the audit.
3. Rewrite the **hero in the buyer's words** (outcome + audience); move proof up.
4. Kill **navigation dead-ends** — never route a prospect to the credential gate.
5. **Collapse to one focused offer** (Audit → Build → Retainer); hide Enterprise/Marketplace.
6. **Strengthen proof** — founder face/bio, honest origin story, manufacture external case studies.
7. **De-jargon** all public copy → plain-English outcomes.
8. **SEO + mobile quick wins** — title/meta/schema + sticky tap-to-call.

---

## 3. Better UI/UX direction

**POV: drop the developer/terminal/CLI aesthetic for the marketing site.** Your buyer is a roofing/construction owner, often 45+, skeptical of "AI," browsing on a phone between jobs. Evidence: light/conventional design reads as more trustworthy for this demographic, and the company that *successfully* sells software to exactly this audience — **ServiceTitan** — uses outcome headlines, ROI math, and trades testimonials, **not** a dev aesthetic. So does Gusto for SMBs.

### Models worth studying
- **ServiceTitan** — closest analog: outcome headlines + an **ROI calculator lead magnet** + trades testimonials with hard numbers ("4-minute estimate, down from 30").
- **Gusto** — four-word value prop ("Payroll, HR, Benefits. Simplified.") + "400,000+ businesses trust us."
- **HubSpot** — risk-reversal microcopy under the CTA ("No credit card required").
- **Productized services** (Video Husky, TheChurchCo's "built for you in one week," KoalaRank's consult CTA) — single offer, concrete deliverable + timeframe, qualifying CTA.

### Transferable checklist (applied in the rebuild)
1. Outcome headline, not "AI/Claude/agents."
2. Subhead names the audience + the friction removed.
3. **One** dominant, consultative CTA repeated top/middle/bottom.
4. Hero visual = outcome (before/after, short explainer), not a terminal.
5. Quantified trust line under the hero.
6. ≥1 trades testimonial with a hard number.
7. Integration logos (QuickBooks, Jobber, ServiceTitan, Roofr) for borrowed credibility.
8. Productize the offer: named package + deliverable + timeframe ("live in 2–4 weeks").
9. Transparent 3-step "How it works."
10. Good-better-best tiers, not "contact for pricing."
11. Forms ≤3 fields and/or booking-first calendar.
12. Objection-killing microcopy beside every CTA ("No long contracts," "You own what we build").
13. Explicit guarantee / risk reversal.
14. Light/warm/high-trust palette; dark only as accent.
15. Mobile-first with sticky book-a-call + click-to-call.

> All 15 are implemented in `marketing-site/index.html`.

---

## 4. What software to build

**Thesis:** the market is moving from vertical SaaS → **vertical AI agents**, and the winner is a **wedge** — a narrow tool that's "magical in <5 minutes" and earns the right to expand. For trades, the money sits in two quantified leaks: **missed inbound** (GCs miss 40–60% of calls; ~85% of voicemail callers never call back — a $2M firm loses ~$400K–$600K/yr) and **slow follow-up** (78% buy from whoever responds first; <5-min response = up to 21× more likely to qualify).

**Critical constraint:** Anthropic shipped **Claude for Small Business (May 2026)** — prebuilt back-office workflows + QuickBooks/Workspace/M365 connectors. **Do NOT build generic "AI for your back office" — Anthropic gives it away.** Build the **trade-specific connective tissue** (Jobber/CompanyCam/Angi/voice/measurement glue) and sell the install/tuning service around it.

### Ranked recommendations (client-attraction ÷ build effort)

| Rank | Product | What it is | Type | Build |
|------|---------|-----------|------|-------|
| **#1** | **LeadCatch** | All-channel speed-to-lead + unified inbox: missed-call text-back, web/Angi/Thumbtack/Facebook → Claude replies in <60s, qualifies, books. Closes the **47%-of-leads-are-non-phone gap** that Jobber/HCP/ServiceTitan receptionists ignore. | **Revenue** (pays for itself week 1) | **Weekend MVP** (missed-call slice), few weeks full |
| #2 | **CrewVoice** *(you have it)* | Multilingual voice dispatch + field intake — Spanish crew calls in, lands as English notes in the CRM/CompanyCam. | Retention + revenue ($149/mo) | Few weeks |
| #3 | **BidBrain** | AI estimate/proposal from address + photos using the contractor's own price book. Buy the measurement API; build the Claude-written proposal. | Revenue/efficiency (crowded space) | Few weeks (wrap an API) |
| #4 | **JobMemory** | "Ask-your-business" RAG over QuickBooks/CompanyCam/past jobs. **Configure Cowork, don't build** — overlaps Claude-for-SMB. | Retention | Few weeks (config) |
| #5 | **ReviewLoop** | Post-job review requests + dead-lead reactivation. Commoditized — sell as a bolt-on. | Upsell add-on | Weekend |

### Build this first: **LeadCatch (missed-call text-back slice)**
- **Fastest, most undeniable ROI** — recovers real money in week one; the contractor sees a *booked job*, not a "productivity uplift."
- **Best sales demo on earth** — trigger it live on the prospect's own number/page during the pitch.
- **Hits a gap incumbents left open** (non-phone leads) — you're not fighting ServiceTitan head-on.
- **Weekend MVP** — sell the slice, install the rest. Price ~$199–$399/mo (LeadTruffle anchors at $229).
- **Natural top of the Diagnose→Install→Optimize funnel** — the lead-leak audit sells into the install; monthly tuning is genuine, measurable Optimize work.

### Free lead-magnet: **"Lead Leak Calculator" + live text-back demo**
1. Owner enters call volume, avg job value, % missed.
2. Shows *"You're losing ~$X/month in missed jobs."*
3. **"Enter your cell and watch our AI text you back"** → fires a real Claude SMS in 30s.
4. Emails a 1-page report → captures the email **and** demos the #1 product in one motion.

> A working version of the calculator (steps 1–2) is already built and live in `marketing-site/index.html` under **"How much are missed leads costing you?"** Wiring step 3 (the live SMS via Twilio + Claude) is the weekend MVP.

### Risks
- **Don't rebuild what Anthropic gives away** (Cowork covers generic back-office).
- **Buy commodity layers** (roof measurement, voice infra via Vapi/Retell, SMS via Twilio); build the orchestration + trade-tuned scripts.
- **Channel integrations break** (Angi/Thumbtack/Meta ToS) — fund maintenance via the Optimize retainer; start on Zapier/Make.
- **SMS compliance** — A2P 10DLC / TCPA opt-in is non-negotiable.
- **Don't over-build before client #1** — sell the missed-call slice + CrewVoice you already have; let paid pilots fund expansion.

---

## 5. First-client acquisition plan (90 days)

**The new funnel: free call → trust → pay.**

**Weeks 1–2 — Fix the front door**
- Deploy the rebuilt landing page (`marketing-site/index.html`); wire the CTA to a real Cal.com/Calendly link.
- Add the guarantee, founder photo + origin story, plain-English copy, title/meta/schema.
- Remove all paths to the credential gate; hide Enterprise/Marketplace.

**Weeks 2–4 — Build the wedge**
- Ship the **LeadCatch missed-call text-back MVP** (Twilio + Claude Haiku for latency).
- Finish the live **Lead Leak Calculator** SMS demo (calculator UI is already done).

**Weeks 3–8 — Manufacture proof + go outbound**
- Offer the **first 1–2 audits free/discounted** in exchange for a documented, external case study.
- Outbound to local roofing/construction owners: lead with the calculator ("here's your lead leak") → free call → live missed-call demo on their own number.
- Outreach beats SEO here (no domain reputation yet); the calculator is the opener.

**KPIs:** fit calls booked/week · call → paid-audit conversion · audits → installs · LeadCatch jobs recovered/client/month (the number that renews the retainer).

---

## 6. What's in this folder

- **`index.html`** — the ready-to-deploy reference rebuild of allerion.io: light/trust-heavy, outcome-first, single repeated booking CTA, guarantee, founder origin story, integration logos, FAQ + LocalBusiness schema, sticky mobile call/book bar, and a **working Lead Leak Calculator**. Two `TODO`s marked inline: (1) the Cal.com booking link, (2) wiring the calculator's live-SMS step.
- **`AUDIT-AND-STRATEGY.md`** — this document.

---

## Sources

UI/UX & conversion: [ManyRequests productized-service teardown](https://www.manyrequests.com/blog/10-examples-of-productized-services-landing-pages) · [ServiceTitan ROI calculator](https://www.servicetitan.com/tools/roi-calculator) · [ServiceTitan roofing software](https://www.servicetitan.com/industries/roofing-software/estimating) · [Gusto hero (Draftss)](https://draftss.com/best-saas-hero-examples/best-saas-hero/gusto) · [SaaS Hero — CTA practices](https://www.saashero.net/design/b2b-saas-landing-cta-practices/) · [SaaS Hero — trust signals](https://www.saashero.net/design/landing-page-design-trust-signals/) · [Outcrowd — dark vs light conversion](https://www.outcrowd.io/blog/dark-mode-conversion-booster-or-marketing-disaster)

What to build: [Bessemer Vertical AI playbook](https://www.bvp.com/atlas/building-vertical-ai-an-early-stage-playbook-for-founders) · [Contrary Research — Vertical AI](https://research.contrary.com/report/the-vertical-ai-playbook) · [SuperDupr — construction AI / missed-call stats](https://superdupr.com/blog/ai-for-construction-companies) · [fieldservicesoftware.io — FSM AI comparison / 47% gap](https://fieldservicesoftware.io/housecall-pro-vs-jobber-vs-servicetitan/) · [Martal — speed-to-lead](https://martal.ca/speed-to-lead-lb/) · [LeadTruffle — missed-call text-back](https://www.leadtruffle.co/features/missed-call-text-back/) · [Claude for Small Business (Guardz)](https://guardz.com/blog/claude-for-smb-core-features-and-walkthroughs/)
