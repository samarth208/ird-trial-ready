import type { CuratedTrial } from "@/lib/types";

// ⚠️ CURATION NOTE
// These requirement rules are an ILLUSTRATIVE first curation for the v1 slice.
// Before public launch, every rule must be checked against the official ClinicalTrials.gov
// record and reviewed by a clinician/genetic counselor: set `verified: true`, fill
// `curation.clinicianReviewed`/`clinicianReviewer`. Trial *facts* (status/locations/contacts)
// come live from the API; this layer only holds the readiness logic + exact source text.

export const CURATED_TRIALS: CuratedTrial[] = [
  {
    nctId: "NCT06952842",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    sourceUrl: "https://clinicaltrials.gov/study/NCT06952842",
    curation: {
      checkedAt: "2026-07-28",
      checkedBy: "project maintainer",
      clinicianReviewed: false,
      nextReviewBy: "2026-08-27",
      reviewNotes: "Illustrative first pass — must be verified against the official record before launch.",
    },
    requirements: [
      {
        id: "gene",
        type: "gene",
        label: "Confirmed mutation in the RHO gene",
        acceptedGenes: ["RHO"],
        canSelfReport: true,
        sourceSection: "inclusion",
        sourceText: "Participants must have a genetically confirmed mutation in the RHO (rhodopsin) gene.",
      },
      {
        id: "variant",
        type: "variant",
        label: "Specific variant: RHO c.403C>T (p.R135W)",
        acceptedVariants: ["c.403C>T", "p.R135W", "R135W"],
        canSelfReport: true,
        sourceSection: "inclusion",
        sourceText: "The mutation must be the RHO c.403C>T (p.R135W) variant as documented on the genetic laboratory report.",
      },
      {
        id: "age",
        type: "age",
        label: "Adult, 18–75 years",
        minimum: 18,
        maximum: 75,
        canSelfReport: true,
        sourceSection: "inclusion",
        sourceText: "Participants must be between 18 and 75 years of age at the time of enrollment.",
      },
      {
        id: "viable_cells",
        type: "clinical_confirmation",
        label: "Evidence of viable retinal cells on imaging",
        canSelfReport: false,
        sourceSection: "inclusion",
        sourceText:
          "Retinal imaging must show evidence of viable photoreceptor/retinal cells in the target region, as assessed by the study site.",
      },
      {
        id: "no_prior_gene_therapy",
        type: "prior_treatment",
        label: "No previous ocular gene therapy",
        excludedTreatments: ["gene_therapy"],
        canSelfReport: true,
        sourceSection: "exclusion",
        sourceText: "Prior ocular gene therapy in the study eye is an exclusion criterion.",
      },
    ],
  },
];
