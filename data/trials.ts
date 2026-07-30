import type { CuratedTrial } from "@/lib/types";

// REAL inherited-retinal-disease trials. Eligibility below is transcribed from the public
// ClinicalTrials.gov listings and is marked `verified: false` until it has been checked against
// the official protocol and clinician-reviewed. Trial *facts* (status/locations/contacts) come
// live from the API; this layer holds only the readiness logic + exact source text.
//
// Coverage: a gene-specific X-linked trial (RPGR), a gene-agnostic trial (OCU400), and a
// gene-specific RNA therapy (USH2A). Add more real trials over time — the tool's usefulness
// scales directly with this set.

const transcribed = {
  checkedAt: "2026-07-28",
  checkedBy: "project maintainer",
  clinicianReviewed: false,
  nextReviewBy: "2026-08-27",
  reviewNotes:
    "Criteria transcribed from the public ClinicalTrials.gov listing; verify against the official protocol before launch.",
};

export const CURATED_TRIALS: CuratedTrial[] = [
  {
    nctId: "NCT03116113",
    title: "Retinal gene therapy for X-linked RP (RPGR) — cotoretigene toliparvovec",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    example: false,
    travelSupport: "unknown",
    sourceUrl: "https://clinicaltrials.gov/study/NCT03116113",
    curation: transcribed,
    requirements: [
      { id: "gene", type: "gene", label: "Confirmed RPGR mutation (X-linked RP)", acceptedGenes: ["RPGR"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Genetically confirmed diagnosis of X-linked retinitis pigmentosa with a mutation in the RPGR gene." },
      { id: "sex", type: "sex", label: "Male", requiredSex: "male", canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be male." },
      { id: "age", type: "age", label: "Age 10 years or older", minimum: 10, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be at least 10 years of age." },
      { id: "retinal_sensitivity", type: "clinical_confirmation", label: "Retinal sensitivity within a specified range", canSelfReport: false, sourceSection: "inclusion", sourceText: "Mean total retinal sensitivity in the study eye between 0.1 dB and 8 dB, assessed by microperimetry at the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior participation in a gene therapy trial is an exclusion criterion." },
    ],
  },

  {
    nctId: "NCT06388200",
    title: "OCU400 modifier gene therapy for retinitis pigmentosa (liMeliGhT, Phase 3)",
    conditionGroup: "RP",
    geneSpecific: false,
    verified: false,
    example: false,
    travelSupport: "unknown",
    sourceUrl: "https://clinicaltrials.gov/study/NCT06388200",
    curation: transcribed,
    requirements: [
      { id: "age", type: "age", label: "Age 3 years or older", minimum: 3, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be 3 years of age or older." },
      { id: "diagnosis", type: "clinical_confirmation", label: "Clinical diagnosis of retinitis pigmentosa", canSelfReport: false, sourceSection: "inclusion", sourceText: "Clinical diagnosis of retinitis pigmentosa confirmed by a specialist. This is a gene-agnostic trial that accepts most genes; a few (e.g. autosomal-dominant NR2E3) are excluded — confirm with the site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy is an exclusion criterion." },
    ],
  },

  {
    nctId: "NCT05158296",
    title: "Ultevursen (RNA therapy) for USH2A exon-13 retinitis pigmentosa (Sirius, Phase 2/3)",
    conditionGroup: "RP",
    geneSpecific: true,
    verified: false,
    example: false,
    travelSupport: "unknown",
    sourceUrl: "https://clinicaltrials.gov/study/NCT05158296",
    curation: transcribed,
    requirements: [
      { id: "gene", type: "gene", label: "USH2A mutation in exon 13", acceptedGenes: ["USH2A"], canSelfReport: true, sourceSection: "inclusion", sourceText: "Retinitis pigmentosa due to a mutation in exon 13 of the USH2A gene (confirmed on the genetic report)." },
      { id: "age", type: "age", label: "Age 12 years or older", minimum: 12, canSelfReport: true, sourceSection: "inclusion", sourceText: "Participants must be at least 12 years of age. (Age windows vary across the ultevursen studies — verify for this specific protocol.)" },
      { id: "vision_range", type: "clinical_confirmation", label: "Vision measures within the protocol range", canSelfReport: false, sourceSection: "inclusion", sourceText: "Best-corrected visual acuity and other vision measures must fall within the protocol-specified range, assessed at the study site." },
      { id: "no_prior_gt", type: "prior_treatment", label: "No previous ocular gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "Prior ocular gene therapy is an exclusion criterion." },
    ],
  },
];
