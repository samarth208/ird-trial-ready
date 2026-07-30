import { describe, it, expect } from "vitest";
import { CURATED_TRIALS } from "@/data/trials";
import { evaluateTrial } from "@/lib/matching";
import type { PatientAnswers } from "@/lib/types";

const rho = CURATED_TRIALS.find((t) => t.nctId === "NCT06952842")!;
const rpgr = CURATED_TRIALS.find((t) => t.nctId === "NCT03116113")!;
const agnostic = CURATED_TRIALS.find((t) => t.nctId === "EXAMPLE-AGNOSTIC")!;

describe("sex-specific (X-linked) matching", () => {
  it("a female user conflicts with a male-only trial; a male user is consistent", () => {
    const male: PatientAnswers = { sex: "male", age: 20, geneticTestingDone: "yes", resultType: "gene_identified", gene: "RPGR", priorGeneTherapy: "no" };
    const female: PatientAnswers = { ...male, sex: "female" };
    const sexReq = (a: PatientAnswers) => evaluateTrial(rpgr, a).results.find((r) => r.requirementId === "sex")?.status;
    expect(sexReq(male)).toBe("confirmed");
    expect(sexReq(female)).toBe("conflict");
    expect(evaluateTrial(rpgr, female).label).toBe("requirement_does_not_match");
  });
});

describe("multi-trial dataset (aggregation)", () => {
  it("covers both gene-specific and gene-agnostic patterns", () => {
    expect(CURATED_TRIALS.length).toBeGreaterThanOrEqual(4);
    expect(CURATED_TRIALS.some((t) => t.geneSpecific)).toBe(true);
    expect(CURATED_TRIALS.some((t) => !t.geneSpecific)).toBe(true);
  });

  it("gene-agnostic trial has no gene requirement", () => {
    expect(agnostic.requirements.some((r) => r.type === "gene")).toBe(false);
  });

  it("a user with no confirmed gene is NOT blocked by a gene rule on the agnostic trial", () => {
    const a: PatientAnswers = { age: 40, geneticTestingDone: "no", priorGeneTherapy: "no" };
    const ev = evaluateTrial(agnostic, a);
    expect(ev.results.some((r) => r.requirementId === "gene")).toBe(false);
    expect(ev.label).not.toBe("requirement_does_not_match");
  });

  it("an RHO-confirmed user conflicts with the RPGR trial but not the RHO trial", () => {
    const a: PatientAnswers = {
      age: 30,
      geneticTestingDone: "yes",
      resultType: "gene_identified",
      gene: "RHO",
      variant: "c.403C>T",
      priorGeneTherapy: "no",
    };
    expect(evaluateTrial(rpgr, a).label).toBe("requirement_does_not_match");
    expect(evaluateTrial(rho, a).label).not.toBe("requirement_does_not_match");
  });
});
