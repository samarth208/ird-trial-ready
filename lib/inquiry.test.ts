import { describe, it, expect } from "vitest";
import { buildInquiryMessage } from "@/lib/inquiry";
import { evaluateTrial } from "@/lib/matching";
import { CURATED_TRIALS } from "@/data/trials";
import type { PatientAnswers } from "@/lib/types";

const trial = CURATED_TRIALS.find((t) => t.nctId === "NCT06952842")!;

const answers: PatientAnswers = {
  age: 34,
  condition: "Retinitis pigmentosa",
  country: "United States",
  location: "San Jose",
  geneticTestingDone: "yes",
  resultType: "gene_identified",
  gene: "RHO",
  variant: "c.403C>T",
  priorGeneTherapy: "no",
};

describe("inquiry message", () => {
  const msg = buildInquiryMessage(trial, answers, evaluateTrial(trial, answers));

  it("includes the NCT id and the patient's key facts", () => {
    expect(msg).toContain("NCT06952842");
    expect(msg).toContain("Age: 34");
    expect(msg).toContain("RHO");
    expect(msg).toContain("Retinitis pigmentosa");
  });

  it("lists the site-confirmation requirement as something to confirm", () => {
    expect(msg).toContain("Evidence of viable retinal cells on imaging");
  });

  it("never claims eligibility", () => {
    expect(msg.toLowerCase()).not.toContain("i qualify");
    expect(msg.toLowerCase()).not.toContain("i am eligible");
  });

  it("omits fields the patient did not provide", () => {
    const sparse = buildInquiryMessage(trial, { age: 20 }, evaluateTrial(trial, { age: 20 }));
    expect(sparse).not.toContain("Reported gene");
  });
});
