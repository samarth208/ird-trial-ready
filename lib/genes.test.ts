import { describe, it, expect } from "vitest";
import { normalizeGeneSymbol, isKnownGene } from "@/lib/genes";
import { evaluateTrial } from "@/lib/matching";
import { CURATED_TRIALS } from "@/data/trials";
import type { PatientAnswers } from "@/lib/types";

describe("gene normalization", () => {
  it("uppercases and trims", () => {
    expect(normalizeGeneSymbol("  rho ")).toBe("RHO");
  });
  it("maps well-known aliases to the canonical symbol", () => {
    expect(normalizeGeneSymbol("abcr")).toBe("ABCA4");
    expect(normalizeGeneSymbol("RP3")).toBe("RPGR");
    expect(normalizeGeneSymbol("RDS")).toBe("PRPH2");
  });
  it("recognizes known IRD genes (including via alias)", () => {
    expect(isKnownGene("RPGR")).toBe(true);
    expect(isKnownGene("RP3")).toBe(true); // alias of RPGR
    expect(isKnownGene("NOTAGENE")).toBe(false);
  });
});

describe("alias flows through matching", () => {
  const rpgr = CURATED_TRIALS.find((t) => t.nctId === "NCT03116113")!;
  it("a user entering the RP3 alias matches the RPGR trial's gene requirement", () => {
    const a: PatientAnswers = { age: 30, geneticTestingDone: "yes", resultType: "gene_identified", gene: "RP3", priorGeneTherapy: "no" };
    const gene = evaluateTrial(rpgr, a).results.find((r) => r.requirementId === "gene");
    expect(gene?.status).toBe("confirmed");
  });
});
