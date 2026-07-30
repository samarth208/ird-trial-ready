// Deterministic, rules-first matching. No AI, no probabilities, no "match %".
// Every result is one of: confirmed | needs_information | conflict.
// A "conflict" means the patient's answer contradicts a clearly *stated* requirement —
// NOT that they are medically ineligible.

import type {
  CuratedTrial,
  PatientAnswers,
  RequirementResult,
  TrialEvaluation,
  TrialLabel,
  TrialRequirement,
} from "./types";
import { normalizeGeneSymbol } from "./genes";

function normalizeGene(g: string): string {
  return normalizeGeneSymbol(g);
}
function normalizeVariant(v: string): string {
  return v.replace(/\s+/g, "").toLowerCase();
}

function base(req: TrialRequirement) {
  return {
    requirementId: req.id,
    label: req.label,
    siteConfirmationOnly: req.type === "clinical_confirmation",
    sourceText: req.sourceText,
    sourceSection: req.sourceSection,
  };
}

function evaluateAge(
  req: Extract<TrialRequirement, { type: "age" }>,
  a: PatientAnswers
): RequirementResult {
  const b = base(req);
  if (a.age === undefined || Number.isNaN(a.age)) {
    return { ...b, status: "needs_information", explanation: "Enter your age to check this requirement." };
  }
  const min = req.minimum ?? 0;
  const max = req.maximum ?? 120;
  if (a.age >= min && a.age <= max) {
    return { ...b, status: "confirmed", explanation: `Your age (${a.age}) is within the range this trial lists (${min}–${max}).` };
  }
  return {
    ...b,
    status: "conflict",
    explanation: `Your age (${a.age}) is outside the range this trial lists (${min}–${max}). Confirm exact limits with the trial site.`,
  };
}

function evaluateSex(
  req: Extract<TrialRequirement, { type: "sex" }>,
  a: PatientAnswers
): RequirementResult {
  const b = base(req);
  if (!a.sex || a.sex === "prefer_not") {
    return { ...b, status: "needs_information", explanation: "Add your sex to check this requirement." };
  }
  return a.sex === req.requiredSex
    ? { ...b, status: "confirmed", explanation: `This trial enrolls ${req.requiredSex} participants, which matches what you entered.` }
    : { ...b, status: "conflict", explanation: `This trial enrolls only ${req.requiredSex} participants.` };
}

function evaluateGene(
  req: Extract<TrialRequirement, { type: "gene" }>,
  a: PatientAnswers
): RequirementResult {
  const b = base(req);
  const noConfirmed =
    a.geneticTestingDone !== "yes" ||
    a.resultType === "negative" ||
    a.resultType === "unknown" ||
    a.resultType === "vus" ||
    !a.gene;
  if (noConfirmed) {
    return {
      ...b,
      status: "needs_information",
      explanation:
        "This trial requires a confirmed genetic result in a specific gene. Confirm the gene named on your laboratory report with your care team.",
    };
  }
  return req.acceptedGenes.map(normalizeGene).includes(normalizeGene(a.gene!))
    ? { ...b, status: "confirmed", explanation: "The gene you entered matches the gene named in this trial's eligibility criteria." }
    : { ...b, status: "conflict", explanation: "The gene you entered is different from the gene named in this trial's current eligibility criteria." };
}

function evaluateVariant(
  req: Extract<TrialRequirement, { type: "variant" }>,
  a: PatientAnswers
): RequirementResult {
  const b = base(req);
  if (a.geneticTestingDone !== "yes" || a.resultType !== "gene_identified" || !a.variant) {
    return {
      ...b,
      status: "needs_information",
      explanation: "This trial names a specific variant. Check the exact variant on your laboratory report with your care team.",
    };
  }
  return req.acceptedVariants.map(normalizeVariant).includes(normalizeVariant(a.variant))
    ? { ...b, status: "confirmed", explanation: "The variant you entered matches the variant named in this trial's criteria." }
    : { ...b, status: "conflict", explanation: "The variant you entered differs from the one named in this trial's criteria. Confirm the exact variant with your care team." };
}

function evaluatePriorTreatment(
  req: Extract<TrialRequirement, { type: "prior_treatment" }>,
  a: PatientAnswers
): RequirementResult {
  const b = base(req);
  const answers: Record<string, "yes" | "no" | "unknown" | undefined> = {
    gene_therapy: a.priorGeneTherapy,
    retinal_surgery: a.priorRetinalSurgery,
  };
  let anyUnknown = false;
  for (const t of req.excludedTreatments) {
    const ans = answers[t];
    if (ans === "yes") {
      return { ...b, status: "conflict", explanation: "You reported a treatment this trial appears to exclude. Confirm the exact restriction with the trial site." };
    }
    if (ans === undefined || ans === "unknown") anyUnknown = true;
  }
  return anyUnknown
    ? { ...b, status: "needs_information", explanation: "Confirm your treatment history against this trial's restrictions." }
    : { ...b, status: "confirmed", explanation: "Based on your answers, you do not report a treatment this trial excludes." };
}

function evaluateClinical(
  req: Extract<TrialRequirement, { type: "clinical_confirmation" }>
): RequirementResult {
  return { ...base(req), status: "needs_information", explanation: "Only a trial site can assess this. Bring it up when you contact them." };
}

export function evaluateRequirement(req: TrialRequirement, a: PatientAnswers): RequirementResult {
  switch (req.type) {
    case "age":
      return evaluateAge(req, a);
    case "sex":
      return evaluateSex(req, a);
    case "gene":
      return evaluateGene(req, a);
    case "variant":
      return evaluateVariant(req, a);
    case "prior_treatment":
      return evaluatePriorTreatment(req, a);
    case "clinical_confirmation":
      return evaluateClinical(req);
  }
}

function labelFor(results: RequirementResult[]): TrialLabel {
  if (results.some((r) => r.status === "conflict")) return "requirement_does_not_match";
  if (results.some((r) => r.status === "needs_information")) return "more_information_needed";
  return "requirements_appear_confirmed";
}

export function evaluateTrial(trial: CuratedTrial, answers: PatientAnswers): TrialEvaluation {
  const results = trial.requirements.map((req) => evaluateRequirement(req, answers));
  return { nctId: trial.nctId, label: labelFor(results), results };
}

export const LABEL_TEXT: Record<TrialLabel, string> = {
  requirements_appear_confirmed: "The information you entered appears consistent with the listed requirements",
  more_information_needed: "More information needed",
  requirement_does_not_match: "The information entered conflicts with a currently listed requirement",
};
