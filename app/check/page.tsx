"use client";

import { useEffect, useMemo, useState } from "react";
import { CURATED_TRIALS } from "@/data/trials";
import { evaluateTrial } from "@/lib/matching";
import { buildInquiryMessage } from "@/lib/inquiry";
import { shortLabel, trialTakeaway } from "@/lib/verdict";
import { IRD_GENES } from "@/lib/genes";
import type {
  CuratedTrial,
  LiveTrialFacts,
  PatientAnswers,
  RequirementResult,
  TrialEvaluation,
  TrialLabel,
} from "@/lib/types";

const STORAGE_KEY = "ird_trial_ready_answers_v1";
const STEPS = ["About you", "Genetic testing", "Trial history", "Results"];

const CONDITIONS = [
  "Retinitis pigmentosa",
  "Leber congenital amaurosis",
  "Usher syndrome",
  "Stargardt disease",
  "Choroideremia",
  "Other / not sure",
];

const GROUP_ORDER: TrialLabel[] = [
  "requirements_appear_confirmed",
  "more_information_needed",
  "requirement_does_not_match",
];
const GROUP_TITLE: Record<TrialLabel, string> = {
  requirements_appear_confirmed: "Worth pursuing",
  more_information_needed: "Might fit — needs more info",
  requirement_does_not_match: "Likely not a fit",
};

export default function CheckPage() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<PatientAnswers>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setA(JSON.parse(saved));
    } catch {}
  }, []);

  function update<K extends keyof PatientAnswers>(key: K, value: PatientAnswers[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
  }

  function goResults() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
    } catch {}
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Stepper step={step} />

      {step === 0 && (
        <Card title="About you" sub="No clinical measurements — just a few basics.">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Age</label>
            <input
              type="number"
              min={1}
              max={120}
              value={a.age ?? ""}
              onChange={(e) =>
                update("age", e.target.value === "" ? undefined : Math.max(1, Math.min(120, Math.floor(Number(e.target.value)))))
              }
              placeholder="e.g. 34"
              className="w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-slate-400">Exact age checks age limits precisely. Stored only in your browser.</p>
          </div>
          <SelectRow label="Diagnosed condition" value={a.condition ?? ""} onChange={(v) => update("condition", v)} options={CONDITIONS} />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextRow label="Country" value={a.country ?? ""} onChange={(v) => update("country", v)} placeholder="United States" />
            <TextRow label="ZIP or city" value={a.location ?? ""} onChange={(v) => update("location", v)} placeholder="e.g. 94043 or San Jose" />
          </div>
          <p className="text-xs text-slate-400">Location is used to find and rank nearby trial sites once live locations are enabled (next milestone).</p>
          <Nav onNext={() => setStep(1)} />
        </Card>
      )}

      {step === 1 && (
        <Card title="Genetic testing" sub="This is the single biggest factor. Your gene decides which trials even apply.">
          <RadioRow
            label="Have you completed genetic testing?"
            value={a.geneticTestingDone}
            onChange={(v) => update("geneticTestingDone", v as PatientAnswers["geneticTestingDone"])}
            options={[["yes", "Yes"], ["no", "No"], ["in_progress", "In progress"]]}
          />
          {a.geneticTestingDone === "yes" && (
            <>
              <RadioRow
                label="What did the result say?"
                value={a.resultType}
                onChange={(v) => update("resultType", v as PatientAnswers["resultType"])}
                options={[
                  ["gene_identified", "A causative gene was identified"],
                  ["vus", "Variant of uncertain significance"],
                  ["negative", "Negative or inconclusive"],
                  ["unknown", "I don't know"],
                ]}
              />
              {a.resultType === "gene_identified" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Gene</label>
                    <input
                      list="ird-genes"
                      value={a.gene ?? ""}
                      onChange={(e) => update("gene", e.target.value)}
                      placeholder="Start typing, e.g. RPGR"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                    <datalist id="ird-genes">
                      {IRD_GENES.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-slate-400">From your lab report. Common IRD genes will autocomplete.</p>
                  </div>
                  <TextRow label="Specific variant (optional)" value={a.variant ?? ""} onChange={(v) => update("variant", v)} placeholder="e.g. c.403C>T" />
                </div>
              )}
              <RadioRow
                label="Do you have a copy of the laboratory report?"
                value={a.hasLabReport === undefined ? undefined : a.hasLabReport ? "yes" : "no"}
                onChange={(v) => update("hasLabReport", v === "yes")}
                options={[["yes", "Yes"], ["no", "No"]]}
              />
            </>
          )}
          <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card title="Trial history" sub="Some trials exclude prior treatments.">
          <RadioRow
            label="Previous ocular gene therapy?"
            value={a.priorGeneTherapy}
            onChange={(v) => update("priorGeneTherapy", v as PatientAnswers["priorGeneTherapy"])}
            options={[["no", "No"], ["yes", "Yes"], ["unknown", "Not sure"]]}
          />
          <RadioRow
            label="Previous retinal surgery?"
            value={a.priorRetinalSurgery}
            onChange={(v) => update("priorRetinalSurgery", v as PatientAnswers["priorRetinalSurgery"])}
            options={[["no", "No"], ["yes", "Yes"], ["unknown", "Not sure"]]}
          />
          <Nav onBack={() => setStep(1)} onNext={goResults} nextLabel="See my shortlist" />
        </Card>
      )}

      {step === 3 && <Results answers={a} onBack={() => setStep(2)} />}
    </div>
  );
}

/* ---------------- Results ---------------- */

function Results({ answers, onBack }: { answers: PatientAnswers; onBack: () => void }) {
  const evaluations = useMemo(
    () => CURATED_TRIALS.map((t) => ({ trial: t, evaluation: evaluateTrial(t, answers) })),
    [answers]
  );
  const counts = useMemo(
    () => GROUP_ORDER.map((g) => ({ g, n: evaluations.filter((e) => e.evaluation.label === g).length })),
    [evaluations]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Your shortlist</h2>
        <div className="flex gap-2 print:hidden">
          <button onClick={onBack} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Edit answers
          </button>
          <button onClick={() => window.print()} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
            Print / Save PDF
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Based on what you entered, here's how {evaluations.length} trials line up —{" "}
        {counts
          .filter((c) => c.n > 0)
          .map((c) => `${c.n} ${GROUP_TITLE[c.g].toLowerCase()}`)
          .join(", ")}
        .
      </p>

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Demonstration dataset: these are illustrative example trials used to show how the shortlist works.
        Real, verified trials replace them before launch.
      </div>

      {GROUP_ORDER.map((group) => {
        const items = evaluations.filter((e) => e.evaluation.label === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <h3 className="mt-6 mb-1 text-sm font-bold text-slate-800">
              {GROUP_TITLE[group]} · {items.length}
            </h3>
            {items.map(({ trial, evaluation }) => (
              <TrialCard key={trial.nctId} trial={trial} evaluation={evaluation} answers={answers} />
            ))}
          </div>
        );
      })}

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        This is not a determination of eligibility. Trial requirements change; always confirm the current
        criteria with the official trial site and your care team before acting.
      </div>
    </div>
  );
}

const LABEL_STYLE: Record<TrialLabel, string> = {
  requirements_appear_confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  more_information_needed: "bg-amber-50 text-amber-800 border-amber-200",
  requirement_does_not_match: "bg-rose-50 text-rose-700 border-rose-200",
};

function TrialCard({
  trial,
  evaluation,
  answers,
}: {
  trial: CuratedTrial;
  evaluation: TrialEvaluation;
  answers: PatientAnswers;
}) {
  const takeaway = trialTakeaway(trial, evaluation);
  const checklist = buildChecklist(evaluation.results);
  const inquiry = buildInquiryMessage(trial, answers, evaluation);
  const [copied, setCopied] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [live, setLive] = useState<LiveTrialFacts | null>(null);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    if (trial.example || !/^NCT\d{8}$/.test(trial.nctId)) return;
    let active = true;
    fetch(`/api/trials/${trial.nctId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setLive(d))
      .catch(() => active && setLiveError(true));
    return () => {
      active = false;
    };
  }, [trial.nctId, trial.example]);

  const stale = Boolean(live?.lastUpdatedAt && live.lastUpdatedAt > trial.curation.checkedAt);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {trial.title && <p className="font-semibold text-slate-900">{trial.title}</p>}
          <p className="text-xs text-slate-400">
            {trial.nctId}
            {trial.example ? " · example (illustrative)" : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${LABEL_STYLE[evaluation.label]}`}>
          {shortLabel(evaluation.label)}
        </span>
      </div>

      {/* The plain-English takeaway — the answer, up front. */}
      <p className="mt-2 text-sm text-slate-700">{takeaway}</p>

      <div className="mt-2 text-xs text-slate-500">
        {trial.example ? (
          <span className="text-slate-400">Example trial (illustrative) — not a live record.</span>
        ) : live ? (
          <span>
            <span className="font-semibold text-slate-700">{live.overallStatus.replace(/_/g, " ")}</span>
            {live.locations?.length ? ` · ${live.locations.length} site(s)` : ""}
            {live.lastUpdatedAt ? ` · updated ${live.lastUpdatedAt}` : ""}
          </span>
        ) : liveError ? (
          <span className="text-slate-400">Live status unavailable right now.</span>
        ) : (
          <span className="text-slate-400">Loading live status…</span>
        )}
        {trial.travelSupport && (
          <span className="ml-2 text-slate-400">
            ·{" "}
            {trial.travelSupport === "described"
              ? "Travel support described"
              : trial.travelSupport === "contact_site"
              ? "Contact site about travel/expenses"
              : "No public info on travel support"}
          </span>
        )}
      </div>

      {stale && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          This trial&rsquo;s official record changed on {live!.lastUpdatedAt}, after our eligibility was last checked
          ({trial.curation.checkedAt}). The details below may be out of date.
        </p>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <button
          onClick={() => setShowInquiry((s) => !s)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {showInquiry ? "Hide draft email" : "Draft an email to the site"}
        </button>
        <a
          href={trial.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Search on ClinicalTrials.gov →
        </a>
      </div>
      {showInquiry && (
        <div className="mt-2">
          <p className="mb-1 text-xs text-slate-500">Review it and add your name before sending:</p>
          <textarea
            readOnly
            value={inquiry}
            rows={10}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700"
          />
          <button
            onClick={() => {
              navigator.clipboard?.writeText(inquiry);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied ✓" : "Copy message"}
          </button>
        </div>
      )}

      {/* Detail on demand */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">See how each requirement matched</summary>
        <div className="mt-2 divide-y divide-slate-100">
          {evaluation.results.map((r) => (
            <ResultRow key={r.requirementId} r={r} />
          ))}
        </div>
        {checklist.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-700">What to confirm before contacting them</p>
            <ul className="mt-1 space-y-1">
              {checklist.map((c, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600">
                  <span className="mt-0.5 text-brand-500">☐</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {!trial.verified && (
        <p className="mt-2 text-[11px] text-slate-400">
          Eligibility here is illustrative and pending verification against the official record.
        </p>
      )}
    </div>
  );
}

function ResultRow({ r }: { r: RequirementResult }) {
  return (
    <div className="py-2.5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-slate-800">{r.label}</span>
        <StatusPill r={r} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{r.explanation}</p>
      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] text-slate-400">Source text ({r.sourceSection})</summary>
        <p className="mt-1 text-[11px] italic text-slate-500">&ldquo;{r.sourceText}&rdquo;</p>
      </details>
    </div>
  );
}

function StatusPill({ r }: { r: RequirementResult }) {
  let cls = "bg-amber-50 text-amber-800";
  let text = "More information needed";
  if (r.status === "confirmed") {
    cls = "bg-emerald-50 text-emerald-700";
    text = "Consistent";
  } else if (r.status === "conflict") {
    cls = "bg-rose-50 text-rose-700";
    text = "Doesn't match";
  } else if (r.siteConfirmationOnly) {
    cls = "bg-sky-50 text-sky-700";
    text = "Trial site checks this";
  }
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{text}</span>;
}

function buildChecklist(results: RequirementResult[]): string[] {
  const items: string[] = [];
  for (const r of results) {
    if (r.siteConfirmationOnly) items.push(`Ask the site whether you meet: “${r.label}.”`);
    else if (r.status === "needs_information") items.push(r.explanation);
    else if (r.status === "conflict") items.push(`Double-check the current criteria on “${r.label}” with the site.`);
  }
  items.push("Request a complete copy of your genetic laboratory report.");
  return items;
}

/* ---------------- Small UI helpers ---------------- */

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2 print:hidden">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i <= step ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500"}`}>
            {i + 1}
          </div>
          <span className={`text-xs ${i === step ? "font-semibold text-slate-800" : "text-slate-400"}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="text-slate-300">→</span>}
        </div>
      ))}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel = "Continue" }: { onBack?: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button onClick={onNext} className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
        {nextLabel}
      </button>
      {onBack && (
        <button onClick={onBack} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Back
        </button>
      )}
    </div>
  );
}

function RadioRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([val, text]) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`rounded-lg border px-3.5 py-2 text-sm transition ${
              value === val
                ? "border-brand-500 bg-brand-50 font-semibold text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
