// A working list of common inherited-retinal-disease genes for autocomplete,
// plus a small set of well-known aliases that normalize to the canonical HGNC symbol.
// (Not exhaustive — expand as the curated trial set grows.)

export const IRD_GENES: string[] = [
  "ABCA4", "RHO", "RPGR", "RP1", "RP2", "USH2A", "RPE65", "CRB1", "CEP290",
  "PRPH2", "PDE6A", "PDE6B", "CNGA1", "CNGB1", "EYS", "PRPF31", "PRPF8",
  "NR2E3", "BEST1", "CHM", "MYO7A", "CDH23", "GUCY2D", "AIPL1", "MERTK",
  "NPHP1", "IMPDH1", "TULP1", "LRAT", "RLBP1", "RDH12", "SPATA7", "CACNA1F",
];

// alias (upper, no spaces) -> canonical symbol
const GENE_ALIASES: Record<string, string> = {
  ABCR: "ABCA4",
  RDS: "PRPH2",
  VMD2: "BEST1",
  PNR: "NR2E3",
  REP1: "CHM",
  TCD: "CHM",
  RP3: "RPGR",
  CORD6: "GUCY2D",
};

export function normalizeGeneSymbol(input: string): string {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  return GENE_ALIASES[s] ?? s;
}

export function isKnownGene(input: string): boolean {
  return IRD_GENES.includes(normalizeGeneSymbol(input));
}
