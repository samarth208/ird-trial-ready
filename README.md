# IRD Trial Ready

**Understand which inherited-retinal-disease (IRD) clinical trials are worth pursuing — and take the next step.**

Trial listings are written for researchers: dense free-text eligibility you must read one page at a time. IRD Trial Ready takes a short, non-clinical intake and runs it **across a set of trials at once**, returning a plain-language shortlist — worth pursuing / might fit / likely not a fit — with a clear next step for each.

It is **not** a diagnosis, does **not** interpret genetic results, and never says "you qualify."

---

## What's implemented

- **Intake** (browser-only, no account): exact age, condition, location, genetic-testing status, **gene (with autocomplete over common IRD genes)**, variant, prior treatments.
- **Deterministic matching** (`lib/matching.ts`) — every requirement resolves to *consistent / needs info / trial-site-checks-this / doesn't match*. No AI, no "match %".
- **Gene normalization** (`lib/genes.ts`) — case/whitespace + well-known aliases (e.g. RP3 → RPGR, ABCR → ABCA4).
- **Plain-language verdict per trial** (`lib/verdict.ts`) — one sentence: what it means for you + your next step. Requirement-by-requirement detail is available on demand.
- **Ranked shortlist** — trials grouped *Worth pursuing → Might fit → Likely not a fit*, with a count summary.
- **Live ClinicalTrials.gov integration** (`app/api/trials/[nctId]/route.ts`) — serverless route that fetches, normalizes, and caches (1h) official status, sponsor, phase, last-updated, and locations for real NCT ids. The results page shows live status + a **stale-curation warning** when the official record changed after our eligibility was last checked.
- **Action step** — a copyable draft inquiry email (built from the user's answers; never claims eligibility) + a ClinicalTrials.gov search link.
- **Curation trail** — every trial carries checked date, curator, clinician-review status, next-review date, source text per requirement, and a `verified` flag.
- **Automated tests** (`vitest`) — matching, dataset/aggregation, gene normalization, and inquiry generation. Run with `npm test`.

## What's still a demonstration (and the priorities)

- **The trial dataset is illustrative.** All four entries are examples (the gene-agnostic, RPGR, and stage-dependent ones are explicitly fictional; the RHO entry is unverified). **The #1 task is replacing these with real, verified trials** — the tool's usefulness scales entirely with that curated data.
- **No clinician review yet** (`verified: false`, `clinicianReviewed: false`). At least one qualified clinical/genetic-counseling review is needed before public promotion.
- **Location is collected but not yet used** to sort sites by distance (geographic ranking is the next milestone).
- **Site contacts** aren't normalized yet (locations are shown; names/emails/phones are not).

## Architecture

Next.js (App Router) + TypeScript + Tailwind, deployable free on Vercel. ClinicalTrials.gov owns changing facts (fetched live); the curated layer owns the readiness logic + source text.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # run the test suite
npm run build    # production build
```

## Deploy (free)

Push to GitHub → import into Vercel → deploy. No environment variables needed.

## ⚠️ Safety

Educational only. No diagnosis, no eligibility determination, no genetic-result interpretation. Every curated rule must be verified against the official record (and ideally clinician-reviewed) before the tool is promoted to patients.
