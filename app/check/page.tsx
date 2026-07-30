"use client";

import { useEffect, useMemo, useState } from "react";
import { CURATED_TRIALS } from "@/data/trials";
import { evaluateTrial } from "@/lib/matching";
import { buildInquiryMessage } from "@/lib/inquiry";
import { shortLabel, trialTakeaway } from "@/lib/verdict";
import { IRD_GENES } from "@/lib/genes";
import { geocodeUsZip, isUsZip, nearestSite, type Coord } from "@/lib/geo";
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

function isRecruitingStatus(s?: string): boolean {
  return (s ?? "").toUpperCase() === "RECRUITING";
}

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
          <RadioRow
            label="Sex"
            value={a.sex}
            onChange={(v) => update("sex", v as PatientAnswers["sex"])}
            options={[["male", "Male"], ["female", "Female"], ["prefer_not", "Prefer not to say"]]}
          />
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

  const [userCoord, setUserCoord] = useState<Coord | null>(null);
  useEffect(() => {
    const loc = (answers.location ?? "").trim();
    if (!isUsZip(loc)) {
      setUserCoord(null);
      return;
    }
    let active = true;
    geocodeUsZip(loc).then((c) => active && setUserCoord(c));
    return () => {
      active = false;
    };
  }, [answers.location]);

  // Fetch live status for every real trial once, so we can demote non-recruiting studies.
  const [liveMap, setLiveMap] = useState<Record<string, LiveTrialFacts | null>>({});
  useEffect(() => {
    CURATED_TRIALS.forEach((t) => {
      if (t.example || !/^NCT\d{8}$/.test(t.nctId)) return;
      fetch(`/api/trials/${t.nctId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setLiveMap((m) => ({ ...m, [t.nctId]: d })))
        .catch(() => setLiveMap((m) => ({ ...m, [t.nctId]: null })));
    });
  }, []);

  // A trial is demoted to "closed" only once we KNOW (live) it isn't recruiting.
  const groupOf = (nctId: string, label: TrialLabel): TrialLabel | "closed" => {
    const facts = liveMap[nctId];
    if (facts && facts.overallStatus && !isRecruitingStatus(facts.overallStatus)) return "closed";
    return label;
  };

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
        <b className="text-slate-700">Coverage so far:</b> RPGR, RHO, and USH2A trials — this is <b>not yet</b> the
        full IRD trial landscape, and more are being added. Eligibility is transcribed from ClinicalTrials.gov and
        pending verification; always confirm the current criteria with the official listing and your care team.
      </div>

      {GROUP_ORDER.map((group) => {
        const items = evaluations.filter((e) => groupOf(e.trial.nctId, e.evaluation.label) === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <h3 className="mt-6 mb-1 text-sm font-bold text-slate-800">
              {GROUP_TITLE[group]} · {items.length}
            </h3>
            {items.map(({ trial, evaluation }) => (
              <TrialCard key={trial.nctId} trial={trial} evaluation={evaluation} answers={answers} userCoord={userCoord} live={liveMap[trial.nctId]} />
            ))}
          </div>
        );
      })}

      {(() => {
        const closed = evaluations.filter((e) => groupOf(e.trial.nctId, e.evaluation.label) === "closed");
        if (!closed.length) return null;
        return (
          <div>
            <h3 className="mt-6 mb-1 text-sm font-bold text-slate-500">Not currently recruiting · {closed.length}</h3>
            {closed.map(({ trial, evaluation }) => (
              <TrialCard key={trial.nctId} trial={trial} evaluation={evaluation} answers={answers} userCoord={userCoord} live={liveMap[trial.nctId]} />
            ))}
          </div>
        );
      })()}

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
  userCoord,
  live,
}: {
  trial: CuratedTrial;
  evaluation: TrialEvaluation;
  answers: PatientAnswers;
  userCoord: Coord | null;
  live: LiveTrialFacts | null | undefined; // undefined = loading, null = unavailable
}) {
  const takeaway = trialTakeaway(trial, evaluation);
  const inquiry = buildInquiryMessage(trial, answers, evaluation);
  const [copied, setCopied] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [open, setOpen] = useState(false);

  const nearest = useMemo(
    () => (userCoord && live?.locations ? nearestSite(userCoord, live.locations) : null),
    [userCoord, live]
  );
  const notRecruiting = Boolean(live && !isRecruitingStatus(live.overallStatus));
  const stale = Boolean(live?.lastUpdatedAt && live.lastUpdatedAt > trial.curation.checkedAt);

  const done = evaluation.results.filter((r) => r.status === "confirmed");
  const todo = evaluation.results.filter((r) => r.status !== "confirmed");

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 text-left">
        <div>
          {trial.title && <p className="font-semibold text-slate-900">{trial.title}</p>}
          <p className="mt-0.5 text-xs text-slate-500">
            {done.length} you can confirm · {todo.length} to sort out
            {nearest ? ` · nearest ${nearest.miles} mi` : ""}
            {notRecruiting ? <span className="font-semibold text-rose-600"> · not recruiting</span> : null}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${LABEL_STYLE[evaluation.label]}`}>
            {shortLabel(evaluation.label)}
          </span>
          <span className="text-slate-400">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3">
      <p className="text-sm text-slate-700">{takeaway}</p>

      <div className="mt-2 text-xs text-slate-500">
        {live === undefined ? (
          <span className="text-slate-400">Loading live status…</span>
        ) : live === null ? (
          <span className="text-slate-400">Live status unavailable right now.</span>
        ) : (
          <span>
            <span className={`font-semibold ${notRecruiting ? "text-rose-600" : "text-slate-700"}`}>
              {live.overallStatus.replace(/_/g, " ")}
            </span>
            {nearest
              ? ` · nearest site ${[nearest.location.city, nearest.location.state].filter(Boolean).join(", ")} — ${nearest.miles} mi`
              : live.locations?.length
              ? ` · ${live.locations.length} site(s)`
              : ""}
            {live.lastUpdatedAt ? ` · updated ${live.lastUpdatedAt}` : ""}
          </span>
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

      <p className="mt-1 text-[11px] text-slate-400">
        Eligibility reviewed {trial.curation.checkedAt}
        {trial.curation.clinicianReviewed ? " (clinician-reviewed)" : " · not yet clinician-reviewed"} · site-level
        availability not yet verified
      </p>

      {notRecruiting && (
        <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          This study is not currently recruiting ({live!.overallStatus.replace(/_/g, " ").toLowerCase()}) — shown for reference.
        </p>
      )}

      {stale && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          This trial&rsquo;s official record changed on {live!.lastUpdatedAt}, after our eligibility was last checked
          ({trial.curation.checkedAt}). The details below may be out of date.
        </p>
      )}

      {/* What's stopping you — the answer, up front */}
      <div className="mt-3">
        <p className="text-xs font-bold text-slate-700">What you still need</p>
        {todo.length === 0 ? (
          <p className="mt-1 text-sm text-emerald-700">Nothing left that you can self-report — the next step is to contact the site.</p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {todo.map((r) => {
              const conflict = r.status === "conflict";
              const site = r.siteConfirmationOnly;
              const icon = conflict ? "✕" : site ? "○" : "☐";
              const iconCls = conflict ? "text-rose-500" : site ? "text-sky-500" : "text-amber-500";
              const action = conflict
                ? "may not match — double-check the current criteria with the site"
                : site
                ? "the trial site will check this"
                : r.explanation;
              return (
                <li key={r.requirementId} className="flex gap-2 text-sm">
                  <span className={`mt-0.5 ${iconCls}`}>{icon}</span>
                  <span>
                    <span className="font-medium text-slate-800">{r.label}</span>{" "}
                    <span className="text-slate-500">— {action}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {done.length > 0 && (
          <p className="mt-2 text-xs text-emerald-700">✓ Already confirmed: {done.map((d) => d.label).join(" · ")}</p>
        )}
      </div>

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
          Open on ClinicalTrials.gov →
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

      {/* Prepare to participate — records, screening sequence, burden */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">Prepare to participate — records, steps &amp; burden</summary>
        <div className="mt-2 space-y-3">
          {trial.therapyType && <p className="text-xs text-slate-500">Therapy: {trial.therapyType}</p>}
          {trial.recordsNeeded && trial.recordsNeeded.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700">Records to gather</p>
              <RecordsChecklist nctId={trial.nctId} records={trial.recordsNeeded} />
            </div>
          )}
          {trial.screeningSteps && trial.screeningSteps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700">Likely steps after you contact them</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-slate-600">
                {trial.screeningSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}
          {trial.visitBurden && (
            <div>
              <p className="text-xs font-bold text-slate-700">Visit &amp; travel burden</p>
              <p className="mt-1 text-xs text-slate-600">{trial.visitBurden}</p>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            These are general expectations for this type of trial, not confirmed for this specific study — verify with the site.
          </p>
        </div>
      </details>

      {/* Exact criteria + sources, on demand */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">See exact criteria &amp; sources</summary>
        <div className="mt-2 divide-y divide-slate-100">
          {evaluation.results.map((r) => (
            <ResultRow key={r.requirementId} r={r} />
          ))}
        </div>
      </details>

      {!trial.verified && (
        <p className="mt-2 text-[11px] text-slate-400">
          Eligibility here is transcribed from the public listing and pending verification against the official record.
        </p>
      )}
        </div>
      )}
    </div>
  );
}

function RecordsChecklist({ nctId, records }: { nctId: string; records: string[] }) {
  const KEY = "ird_records_v1";
  const [have, setHave] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      setHave(all[nctId] || {});
    } catch {}
  }, [nctId]);

  function toggle(rec: string) {
    setHave((prev) => {
      const next = { ...prev, [rec]: !prev[rec] };
      try {
        const all = JSON.parse(localStorage.getItem(KEY) || "{}");
        all[nctId] = next;
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {}
      return next;
    });
  }

  const haveCount = records.filter((r) => have[r]).length;
  return (
    <div className="mt-1">
      <p className="text-[11px] text-slate-400">{haveCount} of {records.length} gathered</p>
      <ul className="mt-1 space-y-1">
        {records.map((rec) => (
          <li key={rec}>
            <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={!!have[rec]} onChange={() => toggle(rec)} className="mt-0.5" />
              <span className={have[rec] ? "text-slate-400 line-through" : ""}>{rec}</span>
            </label>
          </li>
        ))}
      </ul>
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
