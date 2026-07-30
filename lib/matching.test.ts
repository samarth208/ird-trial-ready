import { describe, it, expect } from "vitest";
import { evaluateTrial } from "@/lib/matching";
import type { CuratedTrial, PatientAnswers, RequirementStatus, TrialLabel } from "@/lib/types";

// A synthetic trial that exercises every requirement type — unit tests should not depend on
// the (changing) real curated dataset.
const fixture: CuratedTrial = {
  nctId: "TEST-0001",
  conditionGroup: "RP",
  geneSpecific: true,
  verified: false,
  example: true,
  sourceUrl: "",
  curation: { checkedAt: "2026-07-28", checkedBy: "test", clinicianReviewed: false },
  requirements: [
    { id: "gene", type: "gene", label: "RHO", acceptedGenes: ["RHO"], canSelfReport: true, sourceSection: "inclusion", sourceText: "" },
    { id: "variant", type: "variant", label: "c.403C>T", acceptedVariants: ["c.403C>T", "p.R135W", "R135W"], canSelfReport: true, sourceSection: "inclusion", sourceText: "" },
    { id: "sex", type: "sex", label: "Male", requiredSex: "male", canSelfReport: true, sourceSection: "inclusion", sourceText: "" },
    { id: "age", type: "age", label: "18–75", minimum: 18, maximum: 75, canSelfReport: true, sourceSection: "inclusion", sourceText: "" },
    { id: "viable_cells", type: "clinical_confirmation", label: "Viable cells", canSelfReport: false, sourceSection: "inclusion", sourceText: "" },
    { id: "no_prior_gt", type: "prior_treatment", label: "No prior gene therapy", excludedTreatments: ["gene_therapy"], canSelfReport: true, sourceSection: "exclusion", sourceText: "" },
  ],
};

function status(id: string, a: PatientAnswers): RequirementStatus | undefined {
  return evaluateTrial(fixture, a).results.find((r) => r.requirementId === id)?.status;
}
function label(a: PatientAnswers): TrialLabel {
  return evaluateTrial(fixture, a).label;
}

const ok: PatientAnswers = {
  age: 30,
  sex: "male",
  geneticTestingDone: "yes",
  resultType: "gene_identified",
  gene: "RHO",
  variant: "c.403C>T",
  priorGeneTherapy: "no",
};

describe("gene requirement", () => {
  it("matching gene + variant → confirmed", () => {
    expect(status("gene", ok)).toBe("confirmed");
    expect(status("variant", ok)).toBe("confirmed");
  });
  it("normalizes case/whitespace and known aliases", () => {
    expect(status("gene", { ...ok, gene: "  rho " })).toBe("confirmed");
  });
  it("matching gene but missing variant → variant needs_information", () => {
    expect(status("variant", { ...ok, variant: undefined })).toBe("needs_information");
  });
  it("different gene → conflict", () => {
    expect(status("gene", { ...ok, gene: "USH2A" })).toBe("conflict");
  });
  it("VUS → gene needs_information", () => {
    expect(status("gene", { ...ok, resultType: "vus" })).toBe("needs_information");
  });
  it("no testing / in progress / negative → gene needs_information", () => {
    expect(status("gene", { ...ok, geneticTestingDone: "no", resultType: undefined, gene: undefined })).toBe("needs_information");
    expect(status("gene", { ...ok, geneticTestingDone: "in_progress", resultType: undefined })).toBe("needs_information");
    expect(status("gene", { ...ok, resultType: "negative", gene: undefined })).toBe("needs_information");
  });
});

describe("sex requirement", () => {
  it("male → confirmed, female → conflict, missing → needs_information", () => {
    expect(status("sex", ok)).toBe("confirmed");
    expect(status("sex", { ...ok, sex: "female" })).toBe("conflict");
    expect(status("sex", { ...ok, sex: undefined })).toBe("needs_information");
  });
});

describe("age requirement", () => {
  it("inside / below / above / missing", () => {
    expect(status("age", { ...ok, age: 40 })).toBe("confirmed");
    expect(status("age", { ...ok, age: 12 })).toBe("conflict");
    expect(status("age", { ...ok, age: 90 })).toBe("conflict");
    expect(status("age", { ...ok, age: undefined })).toBe("needs_information");
  });
});

describe("prior-treatment exclusion", () => {
  it("yes → conflict, unknown → needs_information, no → confirmed", () => {
    expect(status("no_prior_gt", { ...ok, priorGeneTherapy: "yes" })).toBe("conflict");
    expect(status("no_prior_gt", { ...ok, priorGeneTherapy: "unknown" })).toBe("needs_information");
    expect(status("no_prior_gt", ok)).toBe("confirmed");
  });
});

describe("clinical confirmation", () => {
  it("always needs_information + site-only", () => {
    expect(status("viable_cells", ok)).toBe("needs_information");
    const row = evaluateTrial(fixture, ok).results.find((r) => r.requirementId === "viable_cells")!;
    expect(row.siteConfirmationOnly).toBe(true);
  });
});

describe("overall label", () => {
  it("a conflict anywhere → requirement_does_not_match", () => {
    expect(label({ ...ok, sex: "female" })).toBe("requirement_does_not_match");
    expect(label({ ...ok, gene: "USH2A" })).toBe("requirement_does_not_match");
  });
  it("no conflict but a site item → more_information_needed", () => {
    expect(label(ok)).toBe("more_information_needed");
  });
});
