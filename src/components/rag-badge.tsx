import { ragLabel, type RagStatus } from "@/lib/domain/spi-rag";
import { ragToTone, StatusBadge } from "@/components/status-badge";

export function RagBadge({ status }: { status: string }) {
  const s = (
    status === "at_risk" || status === "off_track" ? status : "on_track"
  ) as RagStatus;
  return <StatusBadge tone={ragToTone(s)}>{ragLabel(s)}</StatusBadge>;
}
