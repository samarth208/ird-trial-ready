import { NextResponse } from "next/server";
import type { DiscoveredTrial } from "@/lib/types";

// Discovery search: pull ALL currently-recruiting interventional retinitis pigmentosa trials
// live from the authoritative ClinicalTrials.gov registry, normalized to a light shape.
// This is the comprehensive "opportunity" list; deep eligibility matching stays on the curated set.

export const revalidate = 3600;

export async function GET() {
  try {
    const url =
      "https://clinicaltrials.gov/api/v2/studies?query.cond=retinitis+pigmentosa&filter.overallStatus=RECRUITING&pageSize=100";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream_unavailable", status: res.status }, { status: 502 });
    }
    const data: any = await res.json();
    const studies: any[] = Array.isArray(data?.studies) ? data.studies : [];

    const trials: DiscoveredTrial[] = studies
      .filter((s) => s?.protocolSection?.designModule?.studyType === "INTERVENTIONAL")
      .map((s) => {
        const ps = s.protocolSection ?? {};
        const idM = ps.identificationModule ?? {};
        const statusM = ps.statusModule ?? {};
        const designM = ps.designModule ?? {};
        const condM = ps.conditionsModule ?? {};
        const contactsM = ps.contactsLocationsModule ?? {};
        return {
          nctId: idM.nctId ?? "",
          title: idM.briefTitle ?? idM.officialTitle ?? idM.nctId ?? "",
          overallStatus: statusM.overallStatus ?? "UNKNOWN",
          phase: Array.isArray(designM.phases) && designM.phases.length ? designM.phases.join(", ") : "N/A",
          conditions: Array.isArray(condM.conditions) ? condM.conditions : [],
          lastUpdatedAt: statusM.lastUpdatePostDateStruct?.date ?? "",
          locations: (contactsM.locations ?? []).slice(0, 40).map((l: any) => ({
            facility: l.facility,
            city: l.city,
            state: l.state,
            country: l.country,
            status: l.status,
            lat: typeof l.geoPoint?.lat === "number" ? l.geoPoint.lat : undefined,
            lon: typeof l.geoPoint?.lon === "number" ? l.geoPoint.lon : undefined,
          })),
          url: `https://clinicaltrials.gov/study/${idM.nctId}`,
        };
      })
      .filter((t) => /^NCT\d{8}$/.test(t.nctId));

    return NextResponse.json(
      { trials },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
