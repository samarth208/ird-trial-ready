import { NextResponse } from "next/server";
import type { LiveTrialFacts } from "@/lib/types";

// Serverless route: ClinicalTrials.gov owns the *changing facts*.
// We fetch the official v2 API server-side, normalize to only the fields we need, and cache.
// (Deployed on Vercel this runs as a serverless function; results are edge-cached for 1h.)

export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: { nctId: string } }
) {
  const nctId = params.nctId.toUpperCase();
  if (!/^NCT\d{8}$/.test(nctId)) {
    return NextResponse.json({ error: "invalid_nct_id" }, { status: 400 });
  }

  try {
    const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}?format=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_unavailable", status: res.status }, { status: 502 });
    }
    const data: any = await res.json();
    const ps = data?.protocolSection ?? {};
    const idM = ps.identificationModule ?? {};
    const statusM = ps.statusModule ?? {};
    const sponsorM = ps.sponsorCollaboratorsModule ?? {};
    const designM = ps.designModule ?? {};
    const contactsM = ps.contactsLocationsModule ?? {};

    const facts: LiveTrialFacts = {
      nctId,
      officialTitle: idM.officialTitle ?? idM.briefTitle ?? nctId,
      overallStatus: statusM.overallStatus ?? "UNKNOWN",
      sponsor: sponsorM.leadSponsor?.name ?? "—",
      phase: Array.isArray(designM.phases) && designM.phases.length ? designM.phases.join(", ") : "N/A",
      lastUpdatedAt:
        statusM.lastUpdatePostDateStruct?.date ??
        statusM.statusVerifiedDate ??
        "",
      locations: (contactsM.locations ?? []).slice(0, 25).map((l: any) => ({
        facility: l.facility,
        city: l.city,
        state: l.state,
        country: l.country,
        status: l.status,
      })),
      sourceUrl: `https://clinicaltrials.gov/study/${nctId}`,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(facts, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
