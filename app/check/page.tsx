"use client";

import { useEffect, useMemo, useState } from "react";
import { CURATED_TRIALS } from "@/data/trials";
import { evaluateTrial, LABEL_TEXT } from "@/lib/matching";
import { buildInquiryMessage } from "@/lib/inquiry";
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
  requirements_appear_confirmed: "Appear consistent so far",
  more_information_needed: "Need more information",
  requirement_does_not_match: "Conflict with a listed requirement",
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
            <p className="mt-1 text-xs text-slate-400">Exact age is used to check age limits precisely. Stored only in your browser.</p>
          </div>
          <SelectRow
            label="Diagnosed condition"
            value={a.condition ?? ""}
            onChange={(v) => update("condition", v)}
            options={CONDITIONS}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextRow label="Country" value={a.country ?? ""} onChange={(v) => update("country", v)} placeholder="United States" />
            <TextRow label="ZIP or city" value={a.location ?? ""} onChange={(v) => update("location", v)} placeholder="e.g. 94043 or San Jose" />
          </div>
          <p className="text-xs text-slate-400">Location is used to find and rank nearby trial sites once live locations are enabled (next milestone).</p>
          <Nav onNext={() => setStep(1)} />
        </Card>
      )}

      {step === 1 && (
        <Card title="Genetic testing" sub="Gene-specific trials depend on this. Answer only what you know.">
          <RadioRow
            label="Have you completed genetic testing?"
            value={a.geneticTestingDone}
            onChange={(v) => update("geneticTestingDone", v as PatientAnswers["geneticTestingDone"])}
            options={[
              ["yes", "Yes"],
              ["no", "No"],
              ["in_progress", "In progress"],
            ]}
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
                  <TextRow label="Gene (if known)" value={a.gene ?? ""} onChange={(v) => update("gene", v)} placeholder="e.g. RHO" />
                  <TextRow label="Specific variant (optional)" value={a.variant ?? ""} onChange={(v) => update("variant", v)} placeholder="e.g. c.403C>T" />
                </div>
              )}
              <RadioRow
                label="Do you have a copy of the laboratory report?"
                value={a.hasLabReport === undefined ? undefined : a.hasLabReport ? "yes" : "no"}
                onChange={(v) => update("hasLabReport", v === "yes")}
                options={[
                  ["yes", "Yes"],
                  ["no", "No"],
                ]}
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
          <Nav onBack={() => setStep(1)} onNext={goResults} nextLabel="See my readiness" />
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

  const noConfirmedGene =
    answers.geneticTestingDone !== "yes" ||
    answers.resultType !== "gene_identified" ||
    !answers.gene;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Your readiness</h2>
        <div className="flex gap-2 print:hidden">
          <button onClick={onBack} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Edit answers
          </button>
          <button onClick={() => window.print()} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600">
            Print / Save PDF
          </button>
        </div>
      </div>

      {noConfirmedGene && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <strong>You don&rsquo;t have a confirmed gene entered.</strong> Trials that require a
          specific gene will show <em>&ldquo;more information needed&rdquo;</em> until you have a
          confirmed molecular diagnosis. Ask your care team whether genetic testing, reanalysis, or
          broader testing is appropriate — and look for gene-agnostic studies.
        </div>
      )}

      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Demonstration dataset: one real trial ID (with illustrative eligibility) plus clearly-labeled
        example trials, shown to demonstrate how matching works across many trials at once. Verified,
        real trials replace these before launch.
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        Across <b>{evaluations.length}</b> trials, based on what you entered:
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {GROUP_ORDER.map((g) => {
            const n = evaluations.filter((e) => e.evaluation.label === g).length;
            return n ? (
              <span key={g} className="text-slate-500">
                <b className="text-slate-800">{n}</b> {GROUP_TITLE[g].toLowerCase()}
              </span>
            ) : null;
          })}
        </div>
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
        This is not a determination of eligibility. Trial requirements change; always confirm the
        current criteria with the official trial site and your care team before acting.
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
  const checklist = buildChecklist(evaluation.results);
  const inquiry = buildInquiryMessage(trial, answers, evaluation);
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState<LiveTrialFacts | null>(null);
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    if (!/^NCT\d{8}$/.test(trial.nctId)) return; // example trials have no live record
    let active = true;
    fetch(`/api/trials/${trial.nctId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => active && setLive(d))
      .catch(() => active && setLiveError(true));
    return () => {
      active = false;
    };
  }, [trial.nctId]);

  const stale = Boolean(live?.lastUpdatedAt && live.lastUpdatedAt > trial.curation.checkedAt);

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a href={trial.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
          {trial.nctId}
        </a>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${LABEL_STYLE[evaluation.label]}`}>
          {LABEL_TEXT[evaluation.label]}
        </span>
      </div>
      {trial.title && <p className="mt-1 text-sm font-medium text-slate-700">{trial.title}</p>}

      <div className="mt-2 text-xs text-slate-500">
        {trial.example ? (
          <span className="text-slate-400">Example trial (illustrative) — not a live record.</span>
        ) : live ? (
          <span>
            <span className="font-semibold text-slate-700">{live.overallStatus.replace(/_/g, " ")}</span>
            {live.locations?.length ? ` · ${live.locations.length} site(s)` : ""}
            {live.lastUpdatedAt ? ` · updated ${live.lastUpdatedAt}` : ""}
            {" · "}
            <span className="text-slate-400">live from ClinicalTrials.gov</span>
          </span>
        ) : liveError ? (
          <span className="text-slate-400">Live status unavailable right now — see the official listing.</span>
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
          ({trial.curation.checkedAt}). The requirements below may be out of date — verify against the official listing.
        </p>
      )}
      {!trial.verified && (
        <p className="mt-2 text-[11px] text-slate-400">
          Curated eligibility is illustrative and pending clinician review — verify against the official record.
        </p>
      )}

      <div className="mt-4 divide-y divide-slate-100">
        {evaluation.results.map((r) => (
          <ResultRow key={r.requirementId} r={r} />
        ))}
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-bold text-slate-900">Before you contact this trial site</h4>
        <ul className="mt-2 space-y-1.5">
          {checklist.map((c, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-brand-500">☐</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="text-sm font-bold text-slate-900">Contact the trial site</h4>
        {live?.locations && live.locations.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {live.locations.slice(0, 3).map((loc, i) => (
              <li key={i}>
                {[loc.facility, loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
                {loc.status ? <span className="text-slate-400"> · {loc.status.replace(/_/g, " ")}</span> : null}
              </li>
            ))}
            {live.locations.length > 3 && (
              <li className="text-slate-400">+ {live.locations.length - 3} more site(s) on the official listing</li>
            )}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-slate-500">See the official listing for current recruiting sites and contacts.</p>
        )}

        <p className="mt-3 text-xs font-semibold text-slate-600">
          Draft inquiry message — review it and add your name before sending:
        </p>
        <textarea
          readOnly
          value={inquiry}
          rows={10}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 font-mono"
        />
        <div className="mt-2 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(inquiry);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copied ? "Copied ✓" : "Copy message"}
          </button>
          <a
            href={trial.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Open official listing &amp; contacts →
          </a>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ r }: { r: RequirementResult }) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-slate-800">{r.label}</span>
        <StatusPill r={r} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{r.explanation}</p>
      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] text-slate-400">Source text</summary>
        <p className="mt-1 text-[11px] italic text-slate-500">&ldquo;{r.sourceText}&rdquo;</p>
      </details>
    </div>
  );
}

function StatusPill({ r }: { r: RequirementResult }) {
  let cls = "bg-slate-100 text-slate-600";
  let text = "More information needed";
  if (r.status === "confirmed") {
    cls = "bg-emerald-50 text-emerald-700";
    text = "Confirmed";
  } else if (r.status === "conflict") {
    cls = "bg-rose-50 text-rose-700";
    text = "Does not match";
  } else if (r.siteConfirmationOnly) {
    cls = "bg-sky-50 text-sky-700";
    text = "Confirm with trial site";
  } else {
    cls = "bg-amber-50 text-amber-800";
    text = "More information needed";
  }
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{text}</span>;
}

function buildChecklist(results: RequirementResult[]): string[] {
  const items: string[] = [];
  for (const r of results) {
    if (r.siteConfirmationOnly) {
      items.push(`Ask the trial site whether you meet: “${r.label}.”`);
    } else if (r.status === "needs_information") {
      items.push(`Confirm with your care team: ${r.explanation}`);
    } else if (r.status === "conflict") {
      items.push(`Discuss the mismatch on “${r.label}” — confirm the trial's current criteria with the site.`);
    }
  }
  items.push("Request a complete copy of your genetic laboratory report.");
  items.push("Contact the official trial site (linked above) to confirm current recruiting status and criteria.");
  return items;
}

/* ---------------- Small UI helpers ---------------- */

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-6 flex items-center gap-2 print:hidden">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
              i <= step ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
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
