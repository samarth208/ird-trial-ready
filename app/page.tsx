export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <section className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Understand what a retinal trial requires —
          <br className="hidden sm:block" /> and what to confirm with your care team
        </h1>
        <p className="mt-4 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
          Clinical-trial listings show you <em>what studies exist</em>. They rarely make clear{" "}
          <em>what information you need before contacting a site</em> — especially the genetic
          details. IRD Trial Ready turns official trial criteria into a plain-language readiness
          checklist for people with inherited retinal disease.
        </p>
        <div className="mt-8">
          <a
            href="/check"
            className="inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 text-white font-semibold hover:bg-brand-600 transition"
          >
            Start a readiness check
          </a>
          <p className="mt-3 text-xs text-slate-500">
            Free · no account · your answers stay in your browser
          </p>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "Answer a few questions",
            d: "Age range, location, genetic-testing status, and — when you know it — your confirmed gene. No clinical measurements.",
          },
          {
            t: "See each requirement, one by one",
            d: "For each trial: what appears confirmed, what needs more information, and what only a trial site can assess.",
          },
          {
            t: "Get a care-team checklist",
            d: "A source-linked list of exactly what to bring up with your ophthalmologist or genetic counselor.",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">{c.t}</h3>
            <p className="mt-2 text-sm text-slate-600">{c.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <strong>What this tool does not do.</strong> It does not tell you that you qualify or may
        qualify, does not interpret your genetic result, and is not medical advice. It helps you
        understand a trial&rsquo;s stated requirements and prepare questions. Only a trial site and
        your care team can determine eligibility.
      </section>
    </div>
  );
}
