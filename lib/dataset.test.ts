import { describe, it, expect } from "vitest";
import { CURATED_TRIALS } from "@/data/trials";
import { evaluateTrial } from "@/lib/matching";
import type { PatientAnswers } from "@/lib/types";

const rpgr = CURATED_TRIALS.find((t) => t.nctId === "NCT03116113")!;
const agnostic = CURATED_TRIALS.find((t) => t.nctId === "NCT06388200")!;

describe("real dataset", () => {
  it("every trial is real (no examples) and none is pre-verified", () => {
    expect(CURATED_TRIALS.length).toBeGreaterThanOrEqual(3);
    expect(CURATED_TRIALS.every((t) => !t.example)).toBe(true);
    expect(CURATED_TRIALS.every((t) => /^NCT\d{8}$/.test(t.nctId))).toBe(true);
  });

  it("covers both gene-specific and gene-agnostic patterns", () => {
    expect(CURATED_TRIALS.some((t) => t.geneSpecific)).toBe(true);
    expect(CURATED_TRIALS.some((t) => !t.geneSpecific)).toBe(true);
  });

  it("gene-agnostic trial has no gene requirement", () => {
    expect(agnostic.requirements.some((r) => r.type === "gene")).toBe(false);
  });

  it("a user with no confirmed gene is NOT blocked on the gene-agnostic trial", () => {
    const a: PatientAnswers = { age: 40, geneticTestingDone: "no", priorGeneTherapy: "no" };
    const ev = evaluateTrial(agnostic, a);
    expect(ev.results.some((r) => r.requirementId === "gene")).toBe(false);
    expect(ev.label).not.toBe("requirement_does_not_match");
  });

  it("a non-RPGR gene conflicts with the RPGR trial but not the gene-agnostic trial", () => {
    const a: PatientAnswers = {
      age: 30,
      sex: "male",
      geneticTestingDone: "yes",
      resultType: "gene_identified",
      gene: "USH2A",
      priorGeneTherapy: "no",
    };
    expect(evaluateTrial(rpgr, a).label).toBe("requirement_does_not_match");
    expect(evaluateTrial(agnostic, a).label).not.toBe("requirement_does_not_match");
  });

  it("X-linked trial: a female user conflicts, a male user is consistent", () => {
    const male: PatientAnswers = { sex: "male", age: 20, geneticTestingDone: "yes", resultType: "gene_identified", gene: "RPGR", priorGeneTherapy: "no" };
    const female: PatientAnswers = { ...male, sex: "female" };
    const sexStatus = (a: PatientAnswers) => evaluateTrial(rpgr, a).results.find((r) => r.requirementId === "sex")?.status;
    expect(sexStatus(male)).toBe("confirmed");
    expect(sexStatus(female)).toBe("conflict");
    expect(evaluateTrial(rpgr, female).label).toBe("requirement_does_not_match");
  });
});
