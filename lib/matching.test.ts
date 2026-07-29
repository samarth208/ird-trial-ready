import { describe, it, expect } from "vitest";
import { evaluateTrial } from "@/lib/matching";
import { CURATED_TRIALS } from "@/data/trials";
import type { PatientAnswers, RequirementStatus, TrialLabel } from "@/lib/types";

const trial = CURATED_TRIALS.find((t) => t.nctId === "NCT06952842")!;

function status(id: string, a: PatientAnswers): RequirementStatus | undefined {
  return evaluateTrial(trial, a).results.find((r) => r.requirementId === id)?.status;
}
function label(a: PatientAnswers): TrialLabel {
  return evaluateTrial(trial, a).label;
}

// A fully-matching baseline we can vary one field at a time.
const ok: PatientAnswers = {
  age: 30,
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
  it("gene aliases/case are normalized", () => {
    expect(status("gene", { ...ok, gene: "  rho " })).toBe("confirmed");
    expect(status("variant", { ...ok, variant: "p.R135W" })).toBe("confirmed");
  });
  it("matching gene but missing variant → variant needs_information", () => {
    expect(status("variant", { ...ok, variant: undefined })).toBe("needs_information");
  });
  it("different gene → conflict", () => {
    expect(status("gene", { ...ok, gene: "USH2A" })).toBe("conflict");
  });
  it("variant of uncertain significance → gene needs_information", () => {
    expect(status("gene", { ...ok, resultType: "vus" })).toBe("needs_information");
  });
  it("no genetic testing → gene needs_information", () => {
    expect(status("gene", { ...ok, geneticTestingDone: "no", resultType: undefined, gene: undefined })).toBe("needs_information");
  });
  it("testing in progress → gene needs_information", () => {
    expect(status("gene", { ...ok, geneticTestingDone: "in_progress", resultType: undefined })).toBe("needs_information");
  });
  it("negative / inconclusive → gene needs_information", () => {
    expect(status("gene", { ...ok, resultType: "negative", gene: undefined })).toBe("needs_information");
  });
});

describe("age requirement", () => {
  it("inside range → confirmed", () => expect(status("age", { ...ok, age: 40 })).toBe("confirmed"));
  it("below range → conflict", () => expect(status("age", { ...ok, age: 12 })).toBe("conflict"));
  it("above range → conflict", () => expect(status("age", { ...ok, age: 90 })).toBe("conflict"));
  it("missing age → needs_information", () => expect(status("age", { ...ok, age: undefined })).toBe("needs_information"));
});

describe("prior-treatment exclusion", () => {
  it("previous gene therapy → conflict", () => expect(status("no_prior_gt", { ...ok, priorGeneTherapy: "yes" })).toBe("conflict"));
  it("unknown history → needs_information", () => expect(status("no_prior_gt", { ...ok, priorGeneTherapy: "unknown" })).toBe("needs_information"));
  it("no prior therapy → confirmed", () => expect(status("no_prior_gt", ok)).toBe("confirmed"));
});

describe("clinical confirmation (cannot self-report)", () => {
  it("always needs_information regardless of answers", () => {
    expect(status("viable_cells", ok)).toBe("needs_information");
    const row = evaluateTrial(trial, ok).results.find((r) => r.requirementId === "viable_cells")!;
    expect(row.siteConfirmationOnly).toBe(true);
  });
});

describe("overall trial label", () => {
  it("a conflict anywhere → requirement_does_not_match", () => {
    expect(label({ ...ok, gene: "USH2A" })).toBe("requirement_does_not_match");
    expect(label({ ...ok, priorGeneTherapy: "yes" })).toBe("requirement_does_not_match");
  });
  it("no conflict but missing info → more_information_needed", () => {
    // viable_cells always needs site confirmation, so a fully-matching user still gets this
    expect(label(ok)).toBe("more_information_needed");
  });
});
