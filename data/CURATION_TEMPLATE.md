# Trial curation template

The product's value scales with this dataset. Each trial should be curated to this depth and
**verified** against the official record (and ideally clinician-reviewed) before launch.

Fill one `CuratedTrial` object per trial in `data/trials.ts`. Use this checklist per trial.

## 1. Identity & provenance
- [ ] `nctId` (real NCT id)
- [ ] `title`
- [ ] `therapyType` (e.g. "AAV gene therapy (subretinal injection)")
- [ ] `conditionGroup` ("RP" | "IRD"), `geneSpecific`
- [ ] `sourceUrl` → the official `clinicaltrials.gov/study/NCT…` page
- [ ] `curation.checkedAt`, `checkedBy`, `nextReviewBy`
- [ ] `curation.clinicianReviewed` + `clinicianReviewer` once reviewed
- [ ] set `verified: true` **only** after criteria are checked against the official protocol

## 2. Eligibility → `requirements[]`
For **every** inclusion and exclusion criterion, add one requirement:
- [ ] `type`: `age` | `sex` | `gene` | `variant` | `prior_treatment` | `clinical_confirmation`
- [ ] `label` (patient-friendly)
- [ ] `sourceSection`: `"inclusion"` | `"exclusion"`
- [ ] `sourceText`: the **exact** wording from the listing/protocol
- [ ] `canSelfReport`: true for facts the patient knows; use `clinical_confirmation` for anything
      the site/clinician must measure (OCT, visual field, retinal viability, acuity range…)
- Notes:
  - Gene: list `acceptedGenes` (canonical HGNC symbols). Aliases are normalized in `lib/genes.ts`.
  - Variant: list `acceptedVariants` if a specific variant is required.
  - Do **not** invent thresholds — if a value is site-measured, model it as `clinical_confirmation`.

## 3. Practical readiness (the hard-to-copy part)
- [ ] `recordsNeeded[]` — documents a site will likely ask for
- [ ] `screeningSteps[]` — the likely sequence after the patient makes contact
- [ ] `visitBurden` — visits, treatment, follow-ups, travel expectation
- [ ] `travelSupport`: `"described"` (only if an official source states it) | `"contact_site"` | `"unknown"`

## 4. To research beyond ClinicalTrials.gov (the real moat — non-code work)
These are not in the API. Researching them per trial/site is what a copycat won't do:
- [ ] Is each **site actually screening** right now? (vs. "recruiting" at the study level)
- [ ] Current **coordinator** + preferred contact method + typical response time
- [ ] Whether **referral** is required; whether **remote/records pre-screen** is accepted
- [ ] **Records** the coordinator asks for first
- [ ] **Travel/expense** details (visits, overnight, caregiver, reimbursement)
- [ ] **Protocol amendment history** (what changed, when)
- [ ] Date-stamp everything: "Verified by site on YYYY-MM-DD"

## Suggested initial scope
Recruiting **interventional** IRD trials, **US** first, covering RP / Usher / Stargardt / LCA /
choroideremia. Target **15–25 fully curated** real trials rather than 100 shallow imports.
