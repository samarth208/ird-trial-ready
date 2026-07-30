import type { CuratedTrial } from "@/lib/types";

// ⚠️ DEMONSTRATION DATASET
// This set exists to demonstrate how matching works ACROSS MANY TRIALS — the real value of the
// product. One entry uses a real NCT id with *illustrative* eligibility; the others are clearly
// flagged EXAMPLE trials (no live record) chosen to represent different eligibility patterns:
//   1. gene + variant specific   2. a different gene   3. gene-agnostic   4. stage/phenotype-driven
// Before launch, replace these with real, verified official records (verified: true, clinician-reviewed).
// Trial *facts* (status/locations/contacts) come live from the API for real NCT ids; this layer
// holds only the readiness logic + exact source text.

const curatedNow = {
  checkedAt: "2026-07-28",
  checkedBy: "project maintainer",
  clinicianReviewed: false,
  nextReviewBy: "2026-08-27",
  reviewNotes: "Illustrative — verify against the official record before launch.",
};

export const CURATED_TRIALS: CuratedTrial[] = [
  {
    nctId: "NCT06952842",
    title: "Gene therapy for RHO-associated retinitis pigmentosa",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    example: true,
    travelSupport: "contact_site",
    sourceUrl: "https://clinicaltrials.gov/search?cond=Retinitis+Pigmentosa&term=RHO",
    curation: curatedNow,
    requirements: [
      { id: "gene", type: "gene", label: "Confirmed mutation in the RHO gene", acceptedGenes: ["RHO"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must have a genetically confirmed mutation in the RHO (rhodopsin) gene." },
      { id: "variant", type: "variant", label: "Specific variant: RHO c.403C>T (p.R135W)", acceptedVariants: ["c.403C>T", "p.R135W", "R135W"], canSelfReport: true, sourceSection: "inclusion", sourceText: "The mutation must be the RHO c.403C>T (p.R135W) variant as documented on the genetic laboratory report." },
      { id: "age", type: "age", label: "Adult, 18–75 years", minimum: 18, maximum: 75, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be between 18 and 75 years of age at enrollment." },
      { id: "viable_cells", type: "clinical_confirmation", label: "Evidence of viable retinal cells on imaging", canSelfReport: false, sourceSection: "inclusion", sourceText: "Retinal imaging must show evidence of viable photoreceptor/retinal cells, as assessed by the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy in the study eye is an exclusion criterion." },
    ],
  },

  // REAL trial — criteria transcribed from the public ClinicalTrials.gov listing.
  // Still verified: false until checked against the official protocol + clinician-reviewed.
  {
    nctId: "NCT03116113",
    title: "Retinal gene therapy for X-linked RP (RPGR) — cotoretigene toliparvovec (BIIB112)",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    example: false,
    travelSupport: "unknown",
    sourceUrl: "https://clinicaltrials.gov/study/NCT03116113",
    curation: {
      checkedAt: "2026-07-28",
      checkedBy: "project maintainer",
      clinicianReviewed: false,
      nextReviewBy: "2026-08-27",
      reviewNotes:
        "Criteria transcribed from the public ClinicalTrials.gov listing; verify against the official protocol before launch.",
    },
    requirements: [
      { id: "gene", type: "gene", label: "Confirmed RPGR mutation (X-linked RP)", acceptedGenes: ["RPGR"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Genetically confirmed diagnosis of X-linked retinitis pigmentosa with a mutation in the RPGR gene." },
      { id: "sex", type: "sex", label: "Male", requiredSex: "male", canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be male." },
      { id: "age", type: "age", label: "Age 10 years or older", minimum: 10, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be at least 10 years of age." },
      { id: "retinal_sensitivity", type: "clinical_confirmation", label: "Retinal sensitivity within a specified range", canSelfReport: false, sourceSection: "inclusion", sourceText: "Mean total retinal sensitivity in the study eye between 0.1 dB and 8 dB, as assessed by microperimetry at the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior participation in a gene therapy trial is an exclusion criterion." },
    ],
  },

  {
    nctId: "EXAMPLE-AGNOSTIC",
    title: "Example: gene-agnostic therapy for retinitis pigmentosa",
    conditionGroup: "IRD",
    geneSpecific: false,
    verified: false,
    example: true,
    travelSupport: "described",
    sourceUrl: "https://clinicaltrials.gov/search?cond=Retinitis%20Pigmentosa",
    curation: curatedNow,
    requirements: [
      { id: "age", type: "age", label: "Age 18–65 years", minimum: 18, maximum: 65, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be 18–65 years of age." },
      { id: "diagnosis", type: "clinical_confirmation", label: "Confirmed clinical diagnosis of retinitis pigmentosa", canSelfReport: false, sourceSection: "inclusion", sourceText: "A clinical diagnosis of retinitis pigmentosa must be confirmed by a specialist. (This trial does not require a specific gene.)" },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy is an exclusion criterion." },
    ],
  },

  {
    nctId: "EXAMPLE-STAGE",
    title: "Example: stage-dependent retinal therapy",
    conditionGroup: "IRD",
    geneSpecific: false,
    verified: false,
    example: true,
    travelSupport: "contact_site",
    sourceUrl: "https://clinicaltrials.gov/search?cond=Inherited%20Retinal%20Disease",
    curation: curatedNow,
    requirements: [
      { id: "age", type: "age", label: "Age 12–65 years", minimum: 12, maximum: 65, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be 12–65 years of age." },
      { id: "acuity", type: "clinical_confirmation", label: "Visual acuity within a specified range", canSelfReport: false, sourceSection: "inclusion", sourceText: "Best-corrected visual acuity must fall within the protocol-specified range, measured at the study site." },
      { id: "field", type: "clinical_confirmation", label: "Sufficient remaining visual field", canSelfReport: false, sourceSection: "inclusion", sourceText: "A minimum remaining visual field is required, measured at the study site." },
    ],
  },
];
