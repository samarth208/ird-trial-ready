// Core data model for IRD Trial Ready.
// ClinicalTrials.gov owns *changing trial facts* (status, locations, contacts) — fetched live.
// Our curated layer owns the *patient-friendly readiness logic*, source text, and curation trail.

export type GeneticResultType =
  | "gene_identified"
  | "vus"
  | "negative"
  | "unknown";

export type YesNoUnknown = "yes" | "no" | "unknown";

// What the patient tells us. Nothing here is a clinical measurement.
export interface PatientAnswers {
  age?: number; // exact age (validated 1–120), used deterministically
  sex?: "male" | "female" | "prefer_not"; // some trials (e.g. X-linked) are sex-specific
  country?: string; // used for finding nearby sites (with live locations)
  location?: string; // ZIP or city — used for finding nearby sites (with live locations)
  condition?: string;

  geneticTestingDone?: "yes" | "no" | "in_progress";
  resultType?: GeneticResultType;
  gene?: string;
  variant?: string;
  hasLabReport?: boolean;

  priorGeneTherapy?: YesNoUnknown;
  priorRetinalSurgery?: YesNoUnknown;
}

// ---- Curation trail (trust layer) ----

export interface CurationMetadata {
  checkedAt: string; // ISO date the eligibility was last checked against the official record
  checkedBy: string;
  clinicianReviewed: boolean;
  clinicianReviewer?: string;
  reviewDate?: string;
  reviewNotes?: string;
  nextReviewBy?: string; // ISO date
}

// ---- Curated trial requirement schema ----

interface RequirementBase {
  id: string;
  label: string;
  sourceText: string; // exact wording supporting this rule
  sourceSection: "inclusion" | "exclusion";
}

export type TrialRequirement =
  | (RequirementBase & { type: "age"; minimum?: number; maximum?: number; canSelfReport: true })
  | (RequirementBase & { type: "sex"; requiredSex: "male" | "female"; canSelfReport: true })
  | (RequirementBase & { type: "gene"; acceptedGenes: string[]; canSelfReport: true })
  | (RequirementBase & { type: "variant"; acceptedVariants: string[]; canSelfReport: true })
  | (RequirementBase & {
      type: "prior_treatment";
      excludedTreatments: Array<"gene_therapy" | "retinal_surgery">;
      canSelfReport: true;
    })
  | (RequirementBase & { type: "clinical_confirmation"; canSelfReport: false });

export interface CuratedTrial {
  nctId: string;
  title?: string;
  conditionGroup: "RP" | "IRD";
  geneSpecific: boolean;
  verified: boolean; // curated eligibility checked against the official record?
  example?: boolean; // illustrative entry (no live record) used to demonstrate matching
  // Travel/expense support — never a confident yes/no; only "described" when an official source states it.
  travelSupport?: "described" | "contact_site" | "unknown";
  curation: CurationMetadata;
  sourceUrl: string;
  requirements: TrialRequirement[];
}

// ---- Live facts from the ClinicalTrials.gov API (never curated) ----

export interface LiveTrialFacts {
  nctId: string;
  officialTitle: string;
  overallStatus: string; // e.g. RECRUITING
  sponsor: string;
  phase: string;
  lastUpdatedAt: string; // ISO date from the record
  locations: Array<{ facility?: string; city?: string; state?: string; country?: string; status?: string; lat?: number; lon?: number }>;
  sourceUrl: string;
  fetchedAt: string;
}

// ---- Results ----

export type RequirementStatus = "confirmed" | "needs_information" | "conflict";

export interface RequirementResult {
  requirementId: string;
  label: string;
  status: RequirementStatus;
  siteConfirmationOnly: boolean;
  explanation: string;
  sourceText: string;
  sourceSection: "inclusion" | "exclusion";
}

export type TrialLabel =
  | "requirements_appear_confirmed"
  | "more_information_needed"
  | "requirement_does_not_match";

export interface TrialEvaluation {
  nctId: string;
  label: TrialLabel;
  results: RequirementResult[];
}
