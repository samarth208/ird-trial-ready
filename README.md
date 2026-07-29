# IRD Trial Ready

**Understand what an inherited-retinal-disease (IRD) clinical trial requires — and what information to confirm with your care team.**

Trial listings show patients *what studies exist*. They rarely make clear *what information you need before contacting a site* — especially the genetic details. IRD Trial Ready turns official trial criteria into a plain-language **readiness checklist**.

It is **not** a diagnosis, does **not** interpret genetic results, and does **not** tell anyone they qualify.

---

## What v1 does (Milestone 1 — vertical slice)

- A short 3-step intake (about you → genetic testing → trial history) — no clinical measurements requested.
- For each curated trial, a **requirement-by-requirement result**, each labeled:
  - **Confirmed** — your answer matches a clearly stated, self-reportable requirement
  - **More information needed** — a missing answer, or something only a trial site can assess
  - **Does not match** — your answer conflicts with a clearly stated requirement (cautious wording — *not* a medical eligibility decision)
- A per-trial **care-team checklist** of exactly what to confirm, plus the source text behind every rule and a link to the official record.
- Everything runs in the browser; answers are stored only in `localStorage`. No account, no database, no health data leaves the device.

The five scenarios the slice supports (all verified):
1. a gene-specific trial, 2. a user whose gene matches, 3. a user without genetic testing, 4. a user whose gene does **not** match, and 5. a clinical criterion that only a trial site can confirm.

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind**, deployable free on Vercel.
- `lib/types.ts` — curated trial + requirement schema.
- `lib/matching.ts` — **deterministic** rules (no AI, no "match %").
- `data/trials.ts` — curated trial rules (source text + logic).
- `app/check/page.tsx` — the intake form + results.
- **Separation of concerns:** ClinicalTrials.gov will own *changing facts* (status, locations, contacts) via a serverless API route (Milestone 2); this curated layer owns the *readiness logic*.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build: `npm run build`. (Deps and `.next` may already be present from the build check — you can delete `node_modules` and `.next` and reinstall for a clean copy.)

## Deploy (free)

Push to GitHub → import into Vercel → deploy. No environment variables needed for v1.

## ⚠️ Safety & curation

- The curated trial rules in `data/trials.ts` are an **illustrative first curation** for the slice. **Before any public launch, every rule must be checked against the official ClinicalTrials.gov record and reviewed by a clinician or genetic counselor** (set `reviewedBy` and `verified: true`).
- Framing is deliberately conservative everywhere: "here is what this trial lists; confirm with your care team" — never "you qualify."

## Roadmap

- **M2 — live data:** Next.js serverless route to fetch/cache/normalize ClinicalTrials.gov v2 API (recruiting status, locations, contacts, last-updated), with a fallback when unavailable.
- **M3 — expand safely:** 3 curated trials (gene-specific / gene-agnostic / phenotype-specific), the negative/inconclusive-result branch, geographic filtering, print/PDF, accessibility pass.
- **M4 — distribution:** launch page, 1-minute demo, feedback form, posts to IRD communities, outreach to nonprofits/genetic counselors, usage dashboard.

## What to measure

Completed readiness checks · trial pages reviewed · checklist prints · clicks to official trial contacts · users who report discovering a requirement they didn't know about. Core question: *did this help you understand what you need before contacting a trial site?*
