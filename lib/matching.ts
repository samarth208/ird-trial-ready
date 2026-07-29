// Deterministic, rules-first matching. No AI, no probabilities, no "match %".
// Every result is one of: confirmed | needs_information | conflict.
// A "conflict" means the patient's answer contradicts a clearly *stated* requirement —
// NOT that they are medically ineligible. Framing stays cautious throughout.

import type {
  AgeBucket,
  CuratedTrial,
  PatientAnswers,
  RequirementResult,
  TrialEvaluation,
  TrialLabel,
  TrialRequirement,
} from "./types";

const AGE_BUCKET_RANGE: Record<AgeBucket, [number, number]> = {
  under18: [0, 17],
  a18_39: [18, 39],
  a40_64: [40, 64],
  a65plus: [65, 120],
};

function normalizeGene(g: string): string {
  return g.trim().toUpperCase();
}
function normalizeVariant(v: string): string {
  // strip spaces and lowercase for a lenient comparison (c.403C>T vs c.403 C>T)
  return v.replace(/\s+/g, "").toLowerCase();
}

function evaluateAge(
  req: Extract<TrialRequirement, { type: "age" }>,
  a: PatientAnswers
): RequirementResult {
  const base = {
    requirementId: req.id,
    label: req.label,
    siteConfirmationOnly: false,
    sourceText: req.sourceText,
  };
  if (!a.ageBucket) {
    return { ...base, status: "needs_information", explanation: "Add your age range to check this requirement." };
  }
  const [lo, hi] = AGE_BUCKET_RANGE[a.ageBucket];
  const min = req.minimum ?? 0;
  const max = req.maximum ?? 120;
  if (lo >= min && hi <= max) {
    return { ...base, status: "confirmed", explanation: "Your age range falls within the range this trial lists." };
  }
  if (hi < min || lo > max) {
    return {
      ...base,
      status: "conflict",
      explanation: "Your age range is outside the range this trial lists. Confirm exact limits with the trial site.",
    };
  }
  return {
    ...base,
    status: "needs_information",
    explanation: "Your age range partly overlaps this trial's range — your exact age determines eligibility. Confirm with the trial site.",
  };
}

function evaluateGene(
  req: Extract<TrialRequirement, { type: "gene" }>,
  a: PatientAnswers
): RequirementResult {
  const base = {
    requirementId: req.id,
    label: req.label,
    siteConfirmationOnly: false,
    sourceText: req.sourceText,
  };
  const noConfirmedResult =
    a.geneticTestingDone !== "yes" ||
    a.resultType === "negative" ||
    a.resultType === "unknown" ||
    a.resultType === "vus" ||
    !a.gene;

  if (noConfirmedResult) {
    return {
      ...base,
      status: "needs_information",
      explanation:
        "This trial requires a confirmed genetic result in a specific gene. Confirm the gene named on your laboratory report with your care team.",
    };
  }
  const accepted = req.acceptedGenes.map(normalizeGene);
  if (accepted.includes(normalizeGene(a.gene!))) {
    return { ...base, status: "confirmed", explanation: "The gene you entered matches the gene named in this trial's eligibility criteria." };
  }
  return {
    ...base,
    status: "conflict",
    explanation:
      "The gene you entered is different from the gene named in this trial's current eligibility criteria.",
  };
}

function evaluateVariant(
  req: Extract<TrialRequirement, { type: "variant" }>,
  a: PatientAnswers
): RequirementResult {
  const base = {
    requirementId: req.id,
    label: req.label,
    siteConfirmationOnly: false,
    sourceText: req.sourceText,
  };
  if (a.geneticTestingDone !== "yes" || a.resultType !== "gene_identified" || !a.variant) {
    return {
      ...base,
      status: "needs_information",
      explanation:
        "This trial names a specific variant. Check the exact variant listed on your laboratory report with your care team.",
    };
  }
  const accepted = req.acceptedVariants.map(normalizeVariant);
  if (accepted.includes(normalizeVariant(a.variant))) {
    return { ...base, status: "confirmed", explanation: "The variant you entered matches the variant named in this trial's criteria." };
  }
  return {
    ...base,
    status: "conflict",
    explanation: "The variant you entered differs from the one named in this trial's criteria. Confirm the exact variant with your care team.",
  };
}

function evaluatePriorTreatment(
  req: Extract<TrialRequirement, { type: "prior_treatment" }>,
  a: PatientAnswers
): RequirementResult {
  const base = {
    requirementId: req.id,
    label: req.label,
    siteConfirmationOnly: false,
    sourceText: req.sourceText,
  };
  const answers: Record<string, "yes" | "no" | "unknown" | undefined> = {
    gene_therapy: a.priorGeneTherapy,
    retinal_surgery: a.priorRetinalSurgery,
  };
  let anyUnknown = false;
  for (const t of req.excludedTreatments) {
    const ans = answers[t];
    if (ans === "yes") {
      return {
        ...base,
        status: "conflict",
        explanation: "You reported a treatment this trial appears to exclude. Confirm the exact restriction with the trial site.",
      };
    }
    if (ans === undefined || ans === "unknown") anyUnknown = true;
  }
  if (anyUnknown) {
    return { ...base, status: "needs_information", explanation: "Confirm your treatment history against this trial's restrictions." };
  }
  return { ...base, status: "confirmed", explanation: "Based on your answers, you do not report a treatment this trial excludes." };
}

function evaluateClinical(
  req: Extract<TrialRequirement, { type: "clinical_confirmation" }>
): RequirementResult {
  return {
    requirementId: req.id,
    label: req.label,
    status: "needs_information",
    siteConfirmationOnly: true,
    explanation: "Only a trial site can assess this. Bring it up when you contact them.",
    sourceText: req.sourceText,
  };
}

function evaluateRequirement(req: TrialRequirement, a: PatientAnswers): RequirementResult {
  switch (req.type) {
    case "age":
      return evaluateAge(req, a);
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
  // A self-reportable conflict is the strongest (cautious) signal.
  const hasConflict = results.some((r) => r.status === "conflict");
  if (hasConflict) return "requirement_does_not_match";
  const hasNeedsInfo = results.some((r) => r.status === "needs_information");
  if (hasNeedsInfo) return "more_information_needed";
  return "requirements_appear_confirmed";
}

export function evaluateTrial(trial: CuratedTrial, answers: PatientAnswers): TrialEvaluation {
  const results = trial.requirements.map((req) => evaluateRequirement(req, answers));
  return { nctId: trial.nctId, label: labelFor(results), results };
}

export const LABEL_TEXT: Record<TrialLabel, string> = {
  requirements_appear_confirmed: "Listed requirements appear confirmed",
  more_information_needed: "More information needed",
  requirement_does_not_match: "One or more listed requirements do not match",
};
