import type { CuratedTrial } from "@/lib/types";

// ⚠️ CURATION NOTE
// The requirement rules below are an ILLUSTRATIVE first curation for the v1 vertical slice.
// Before any public launch, every rule must be checked against the official ClinicalTrials.gov
// record and reviewed by a clinician or genetic counselor (fill `reviewedBy`, set `verified: true`).
// The tool is designed so trial *facts* (status/locations/contacts) come live from the API,
// while this curated layer holds the readiness logic + exact source text.

export const CURATED_TRIALS: CuratedTrial[] = [
  {
    nctId: "NCT06952842",
    conditionGroup: "RP",
    geneSpecific: true,
    curatedAt: "2026-07-28",
    reviewedBy: undefined,
    verified: false,
    sourceUrl: "https://clinicaltrials.gov/study/NCT06952842",
    requirements: [
      {
        id: "gene",
        type: "gene",
        label: "Confirmed mutation in the RHO gene",
        acceptedGenes: ["RHO"],
        canSelfReport: true,
        sourceText:
          "Participants must have a genetically confirmed mutation in the RHO (rhodopsin) gene.",
      },
      {
        id: "variant",
        type: "variant",
        label: "Specific variant: RHO c.403C>T (p.R135W)",
        acceptedVariants: ["c.403C>T", "p.R135W", "R135W"],
        canSelfReport: true,
        sourceText:
          "The mutation must be the RHO c.403C>T (p.R135W) variant as documented on the genetic laboratory report.",
      },
      {
        id: "age",
        type: "age",
        label: "Adult, 18–75 years",
        minimum: 18,
        maximum: 75,
        canSelfReport: true,
        sourceText: "Participants must be between 18 and 75 years of age at the time of enrollment.",
      },
      {
        id: "viable_cells",
        type: "clinical_confirmation",
        label: "Evidence of viable retinal cells on imaging",
        canSelfReport: false,
        sourceText:
          "Retinal imaging must show evidence of viable photoreceptor/retinal cells in the target region, as assessed by the study site.",
      },
      {
        id: "no_prior_gene_therapy",
        type: "prior_treatment",
        label: "No previous ocular gene therapy",
        excludedTreatments: ["gene_therapy"],
        canSelfReport: true,
        sourceText: "Prior ocular gene therapy in the study eye is an exclusion criterion.",
      },
    ],
  },
];
