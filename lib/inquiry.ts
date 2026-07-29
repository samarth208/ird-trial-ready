import type { CuratedTrial, PatientAnswers, TrialEvaluation } from "./types";

// Generates a plain-language draft the patient reviews and sends to a trial site.
// It NEVER claims eligibility — it states the patient's info and lists the requirements
// they still need the site to confirm. Directly addresses the top stuck-point:
// "I reached out and didn't know who to contact or what to say."

export function buildInquiryMessage(
  trial: CuratedTrial,
  a: PatientAnswers,
  evaluation: TrialEvaluation
): string {
  const info = [
    `- Condition: ${a.condition || "inherited retinal disease"}`,
    a.age != null ? `- Age: ${a.age}` : null,
    `- Genetic testing: ${
      a.geneticTestingDone === "yes"
        ? "completed"
        : a.geneticTestingDone === "in_progress"
        ? "in progress"
        : "not yet done"
    }`,
    a.gene ? `- Reported gene: ${a.gene}${a.variant ? `, variant ${a.variant}` : ""}` : null,
    a.priorGeneTherapy ? `- Prior ocular gene therapy: ${a.priorGeneTherapy}` : null,
    a.location || a.country ? `- Location: ${[a.location, a.country].filter(Boolean).join(", ")}` : null,
  ].filter(Boolean) as string[];

  const questions = evaluation.results
    .filter((r) => r.status !== "confirmed")
    .map((r) => `- ${r.label}${r.siteConfirmationOnly ? " (this would need to be assessed at your site)" : ""}`);

  const lines = [
    `Subject: Eligibility question about study ${trial.nctId}`,
    ``,
    `Hello,`,
    ``,
    `I am interested in learning whether I might be able to take part in your study ${trial.nctId}. My relevant information:`,
    ``,
    ...info,
    ``,
    questions.length
      ? `Based on the study's listed requirements, I'd like to confirm the following with your team:`
      : `I'd like to confirm the study's current requirements and next steps.`,
    ...questions,
    ``,
    `Could you let me know whether the study is currently recruiting and what the next steps would be? Thank you very much.`,
    ``,
    `[Your name]`,
  ];

  return lines.join("\n");
}
