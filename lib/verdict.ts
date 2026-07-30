import type { CuratedTrial, TrialEvaluation, TrialLabel } from "./types";

// Short, plain-language label for a badge.
export function shortLabel(label: TrialLabel): string {
  return {
    requirements_appear_confirmed: "Worth pursuing",
    more_information_needed: "Might fit — needs info",
    requirement_does_not_match: "Likely not a fit",
  }[label];
}

// One plain-English sentence: what this means for the person, and their next step.
// Never claims eligibility.
export function trialTakeaway(trial: CuratedTrial, ev: TrialEvaluation): string {
  const conflict = ev.results.find((r) => r.status === "conflict");
  if (conflict) {
    return `This trial lists a requirement your entry doesn't match — ${conflict.label.toLowerCase()} — so it's likely not a fit right now. Contact the site if you think that's wrong.`;
  }

  const geneMissing = ev.results.find((r) => r.requirementId === "gene" && r.status === "needs_information");
  const siteItems = ev.results.filter((r) => r.siteConfirmationOnly);
  const otherMissing = ev.results.filter(
    (r) => r.status === "needs_information" && !r.siteConfirmationOnly && r.requirementId !== "gene"
  );

  if (ev.label === "requirements_appear_confirmed") {
    return `Everything you entered is consistent with this trial's listed requirements. Next step: contact the site to confirm and ask about enrolling.`;
  }

  if (geneMissing) {
    return `This is a gene-specific trial, so you'd need a confirmed genetic result to be assessed. Next step: confirm your gene with your care team, then contact the site.`;
  }

  if (otherMissing.length) {
    const extra = siteItems.length ? " Some other checks can only be done at the trial site." : "";
    return `Your details look consistent so far — just confirm ${otherMissing[0].label.toLowerCase()} with your care team.${extra} Next step: contact the site.`;
  }

  // Only site-confirmation items remain.
  const names = siteItems.map((s) => s.label.toLowerCase()).slice(0, 2).join(", ");
  return `Everything you can self-report looks consistent. The remaining checks${names ? ` (${names})` : ""} can only be done at the trial site — so the next step is to contact them.`;
}
