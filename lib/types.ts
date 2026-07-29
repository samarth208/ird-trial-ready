// Core data model for IRD Trial Ready.
// ClinicalTrials.gov owns *changing trial facts* (status, locations, contacts).
// Our curated layer owns the *patient-friendly readiness logic* and source text.

export type AgeBucket = "under18" | "a18_39" | "a40_64" | "a65plus";

export type GeneticResultType =
  | "gene_identified" // a causative gene/variant was found
  | "vus" // variant of uncertain significance
  | "negative" // negative / inconclusive
  | "unknown"; // patient does not know

export type YesNoUnknown = "yes" | "no" | "unknown";

// What the patient tells us. Nothing here is a clinical measurement.
export interface PatientAnswers {
  ageBucket?: AgeBucket;
  country?: string;
  location?: string; // ZIP or city (free text, v1)
  condition?: string;

  geneticTestingDone?: "yes" | "no" | "in_progress";
  resultType?: GeneticResultType;
  gene?: string;
  variant?: string;
  hasLabReport?: boolean;

  priorGeneTherapy?: YesNoUnknown;
  priorRetinalSurgery?: YesNoUnknown;
  willingToTravel?: "yes" | "no";
}

// ---- Curated trial requirement schema ----

interface RequirementBase {
  id: string;
  label: string; // patient-friendly label
  sourceText: string; // exact wording supporting this rule
}

export type TrialRequirement =
  | (RequirementBase & {
      type: "age";
      minimum?: number;
      maximum?: number;
      canSelfReport: true;
    })
  | (RequirementBase & {
      type: "gene";
      acceptedGenes: string[];
      canSelfReport: true;
    })
  | (RequirementBase & {
      type: "variant";
      acceptedVariants: string[];
      canSelfReport: true;
    })
  | (RequirementBase & {
      type: "prior_treatment";
      // if the patient has had any of these, it conflicts with eligibility
      excludedTreatments: Array<"gene_therapy" | "retinal_surgery">;
      canSelfReport: true;
    })
  | (RequirementBase & {
      // Something only a trial site / clinician can assess (imaging, cell viability, VA testing).
      type: "clinical_confirmation";
      canSelfReport: false;
    });

export interface CuratedTrial {
  nctId: string;
  conditionGroup: "RP" | "IRD";
  geneSpecific: boolean;
  curatedAt: string; // ISO date
  reviewedBy?: string; // clinician/counselor who reviewed the curation (empty until reviewed)
  verified: boolean; // has the curated eligibility been checked against the official record?
  sourceUrl: string;
  requirements: TrialRequirement[];
}

// ---- Results ----

export type RequirementStatus =
  | "confirmed" // patient answer matches a clearly stated, self-reportable requirement
  | "needs_information" // more info required (missing answer, or must be confirmed by trial site)
  | "conflict"; // patient answer conflicts with a clearly stated requirement

export interface RequirementResult {
  requirementId: string;
  label: string;
  status: RequirementStatus;
  siteConfirmationOnly: boolean; // true for clinical_confirmation rows
  explanation: string;
  sourceText: string;
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
