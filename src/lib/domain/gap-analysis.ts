export interface GapSideA {
  sphDurationDays: number;
  baselineDraftDays: number;
  gapDays: number;
  evaluative: true;
}

export interface GapSideB {
  poDueDate?: string;
  plannedEndDate?: string;
  gapDays: number;
  needsEdit: boolean;
}

export function computeGapSideA(
  sphDurationDays: number,
  baselineDraftDays: number,
): GapSideA {
  return {
    sphDurationDays,
    baselineDraftDays,
    gapDays: baselineDraftDays - sphDurationDays,
    evaluative: true,
  };
}

export function computeGapSideB(
  poDueDate: string | undefined,
  plannedEndDate: string | undefined,
): GapSideB {
  if (!poDueDate || !plannedEndDate) {
    return { poDueDate, plannedEndDate, gapDays: 0, needsEdit: false };
  }
  const due = new Date(poDueDate).getTime();
  const end = new Date(plannedEndDate).getTime();
  const gapDays = Math.round((end - due) / (1000 * 60 * 60 * 24));
  return {
    poDueDate,
    plannedEndDate,
    gapDays,
    needsEdit: gapDays > 0,
  };
}
