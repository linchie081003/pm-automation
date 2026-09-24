export type RagStatus = "on_track" | "at_risk" | "off_track";

export function computeSpi(actualPct: number, plannedPct: number): number {
  if (plannedPct <= 0) return 1;
  return Math.round((actualPct / plannedPct) * 100) / 100;
}

export function ragFromSpi(spi: number): RagStatus {
  if (spi >= 0.95) return "on_track";
  if (spi >= 0.85) return "at_risk";
  return "off_track";
}

export function ragLabel(status: RagStatus): string {
  switch (status) {
    case "on_track":
      return "On Track";
    case "at_risk":
      return "At Risk";
    case "off_track":
      return "Off Track";
  }
}
