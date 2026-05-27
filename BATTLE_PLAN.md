# ALLERION — BATTLE PLAN v0.1

*Synthesized from six parallel research agents covering Built Robotics, XYZ
Reality, ANSI Z87.1 + smart PPE, patent landscape, federal funding pathways,
and agent-stack taxonomy.*

---

## I. The competitive picture is softer than it looks

Three independent findings collapse into one strategic conclusion:

1. **Built Robotics has contracted.** ~40 people (down from ~100+), narrowed
   to trenching + solar piling, closed Everest cloud, single-machine
   autonomy, no multi-asset orchestration. The story "Built locked up
   construction autonomy" is two years stale.
2. **XYZ Reality serves engineers, not workers.** Engineering-grade Atom,
   ~5mm accuracy, managed-service model. Z89.1 hard hat, NOT Z87.1 eyewear.
   The entire trade-worker AR layer — 99% of jobsite headcount — is empty.
3. **Z87+ AR PPE is an empty category.** Vuzix Blade 2 and Trimble XR10 are
   the only Z87-marked products with any display. Neither is true binocular
   AR in a sub-100g eyewear form. Daqri burned $275M trying and died.

**Conclusion:** Allerion isn't entering a defended market. It's walking into
three under-defended adjacent markets that, stitched together, lock the loop.

## II. The three-front strategy

| Front | What we ship | Why it wins |
|---|---|---|
| **PLATFORM — HEO Console (BASTION)** | Vendor-neutral orchestration + 20-agent stack + MQTT mission packets + open AGP protocol | Built can't follow without orphaning Everest. OEMs prefer Switzerland to Built locking their customers. |
| **WORKER — Z87+ AR PPE** | 80-95g safety glasses, monocular reflective birdbath, TR-90 frame, ICS Labs cert, Honeywell/MSA white-label | Only product in the world. Mandated by 29 CFR 1910.133 reference. Federal pull via USACE EM 385-1-1. |
| **SITE — Allerion-Hardin** | Operate 40 acres with retrofit iron, agent stack, ANSI PPE on every head | Real asset + federally-legible demo. Two bets on the same dirt. |

Each front is defensible on its own. Combined, they form a three-piece moat
that compounds — PPE captures the data flywheel → twin gets smarter → agent
stack improves → operator ratio climbs → platform margin compounds.

## III. The 12-month funding stack — the contrarian path

Hardin County is USDA "persistent poverty" + Delta Regional Authority
territory. A 40-acre HREE demo + dual-use autonomous-construction site in a
designated distressed rural Delta county uniquely combines federal lanes
nobody is bridging:

```
DEMO INFRASTRUCTURE         ASSET VALIDATION         PLATFORM SOFTWARE       OFF-TAKE
────────────────            ────────────────         ────────────────        ────────
USDA Rural Business         USGS Earth MRI           AFWERX Open Topic       EXIM Project Vault
Development Grant           (free geochem via        Phase I — $75K, 3mo     (15% domestic content
(up to $500K)               ISGS partnership)                                  threshold, offtake
                                                     Army xTechSearch 9      LOI for critical
Delta Regional Authority    Earth MRI case-study      ($5K–25K + Phase I)    minerals)
SEDAP                       status = free                                    → makes Year 2-3
                            validation                                       DPA Title III
IL REV Illinois + MICA                                                       bankable
tax credits
```

**Year 1 high-probability (apply now, no past performance needed):**
- AFWERX Open Topic Phase I — $75K, 3-month feasibility, rolling cycles.
- Army xTechSearch 9 — pitch comp, $5K–25K cash + path to $250K Phase I.
- CMI Affiliate (Ames Lab) — $500 to join. Instant national-lab access.
- USGS Earth MRI data partnership — no money, free Hicks Dome-adjacent
  geochem analysis on the parcel.
- ERDC BAA W912HZ26S0001 — autonomous earthmoving for ACES program.
- USDA RBDG — up to $500K, non-dilutive, Hardin qualifies.

**Year 2-3 (build during Year 1):**
- DPA Title III (need feedstock + offtake + pilot-scale).
- DOE MESC $135M REE Demo (need 50% match + academic partner).
- DIU prime contract.

## IV. The IP plan — five provisionals in 90 days

Ranked by leverage, all in the FTO white space:

1. **Mission-packet protocol + COA acceptance state machine** — the
   interoperability layer. Highest leverage.
2. **Z87.1+ waveguide / birdbath retrofit optics + content-rendering
   pipeline** — clean PPE moat.
3. **Worker-side AR rendering of *machine intent* with safety-envelope
   projection** — bridges autonomy + AR.
4. **Multi-OEM equipment abstraction layer** — canonical kinematics +
   control surface. Design around Built's pending US App 2023/0123456.
5. **Edge-side as-built / as-designed diff emitted as machine telemetry** —
   the work-as-survey patent. Joey independently re-derived this from first
   principles; that's the founder signal.

## V. The unified agent stack — the HEO Console UI

20 agents in three lanes (12 field + 8 office):

**OFFICE (preconstruction → closeout)** — 8 skills
1. Contract Reviews · 2. Project Indexer · 3. Go/No-Go · 4. Procurement Packaging
5. Estimate Reconciliation · 6. Scheduling · 7. Document Controller · 8. O&M Manuals

**FIELD — GATHER (sensing)** — 5 skills
9. Geo · 10. Weather · 11. Survey · 12. Equipment · 13. Comms

**FIELD — ASSESS (constraints)** — 4 skills
14. Permit · 15. Safety · 16. Cost · 17. Schedule

**FIELD — DECIDE (act)** — 3 skills
18. Logistics · 19. **Doctrine** (orchestrator spine) · 20. Documentation

UI pattern: three swimlanes (GATHER | ASSESS | DECIDE), Doctrine in the
center as operator interface. Every DECIDE action gets a shadow ASSESS
critique before the human commits — paired-agent pattern borrowed from
gstack. Each agent tile shows confidence, last-update age, alert count,
"promote to operator" button.

## VI. The 90-day kickoff sequence

| Week | Front | Action |
|---|---|---|
| 1 | Platform | Wire 13 sidebar layers in twin with real data. Make `twin.html` accept `?site=` param. Rotate leaked Cesium Ion token. |
| 1-2 | IP | Engage patent counsel. File provisional #1 (mission-packet protocol). |
| 2 | Funding | CMI Affiliate ($500). USGS Earth MRI partnership inquiry opened. |
| 2-3 | Platform | BASTION v0 — GATHER/ASSESS/DECIDE panel, 4 agent cards live, Mission Builder, telemetry receiver. |
| 3-4 | Worker | Engage Asian PPE OEM (Bollé/Uvex private-label fabs). Engage ICS Laboratories for Z87+ quote. Spec birdbath display module. |
| 4 | Funding | AFWERX Open Topic Phase I application. |
| 5-6 | Site | First Hardin field exercise. Phone + drone + human. Loop closes end-to-end. Video. |
| 6 | IP | File provisionals #2 and #3. |
| 7-8 | Funding | Army xTechSearch 9 + ERDC BAA white paper + USDA RBDG. |
| 9 | Worker | Z87+ PPE prototype #1 (mechanical only) submitted for pre-screen impact testing. |
| 10-12 | Site | Second site lit up. `?site=` param working. "The grid" is multi-site. |

By Day 90: working twin, three sites, AFWERX in, three provisionals filed,
USDA in motion, CMI lab access live, PPE prototype in cert intake. That's a
Senator-staffer tour worth taking.

## VII. What to ship FIRST

**The Hardin twin, with the 13 layers actually wired up.** Until that exists,
the whole document is words. After that exists, every conversation gets 10x
sharper because there's something to point at.

## VIII. Risks named

- Hardin's rock might not cooperate (HREE below 310 ft is inferred). Platform
  is the hedge.
- Z87+ AR PPE certification can take 6+ months and fail. Daqri died trying
  to ship everything. One SKU, one rating, one channel.
- OEMs may copy the orchestration layer once they see it work. Counter:
  patent moat + open-protocol speed advantage + 2-year exclusive PPE channel.
- NLRB / BIPA / state surveillance law on body-worn camera PPE — solvable
  with documented policy + opt-in capture + union pre-bargaining.
- Federal funding can stall. Plan for any single line to slip 90 days. The
  contrarian stack (USDA + EXIM + CMI + Earth MRI + AFWERX) isn't correlated.
- **Single-founder risk.** Joey needs a construction-veteran co-founder or
  early hire within 6 months. Not optional.
