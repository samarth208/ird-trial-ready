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
    travelSupport: "contact_site",
    sourceUrl: "https://clinicaltrials.gov/study/NCT06952842",
    curation: curatedNow,
    requirements: [
      { id: "gene", type: "gene", label: "Confirmed mutation in the RHO gene", acceptedGenes: ["RHO"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must have a genetically confirmed mutation in the RHO (rhodopsin) gene." },
      { id: "variant", type: "variant", label: "Specific variant: RHO c.403C>T (p.R135W)", acceptedVariants: ["c.403C>T", "p.R135W", "R135W"], canSelfReport: true, sourceSection: "inclusion", sourceText: "The mutation must be the RHO c.403C>T (p.R135W) variant as documented on the genetic laboratory report." },
      { id: "age", type: "age", label: "Adult, 18–75 years", minimum: 18, maximum: 75, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be between 18 and 75 years of age at enrollment." },
      { id: "viable_cells", type: "clinical_confirmation", label: "Evidence of viable retinal cells on imaging", canSelfReport: false, sourceSection: "inclusion", sourceText: "Retinal imaging must show evidence of viable photoreceptor/retinal cells, as assessed by the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy in the study eye is an exclusion criterion." },
    ],
  },

  {
    nctId: "EXAMPLE-RPGR",
    title: "Example: gene therapy for X-linked RPGR retinitis pigmentosa",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    example: true,
    travelSupport: "described",
    sourceUrl: "https://clinicaltrials.gov/search?cond=Retinitis%20Pigmentosa&term=RPGR",
    curation: curatedNow,
    requirements: [
      { id: "gene", type: "gene", label: "Confirmed mutation in the RPGR gene", acceptedGenes: ["RPGR"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must have a genetically confirmed disease-causing variant in the RPGR gene." },
      { id: "age", type: "age", label: "Age 18–50 years", minimum: 18, maximum: 50, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be 18–50 years of age." },
      { id: "residual_function", type: "clinical_confirmation", label: "Measurable residual retinal function", canSelfReport: false, sourceSection: "inclusion", sourceText: "Sufficient residual retinal function must be present, as measured at the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy is an exclusion criterion." },
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
