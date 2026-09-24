import { addDays, format, isSaturday, isSunday, parseISO } from "date-fns";

function isHoliday(date: Date, holidays: string[]): boolean {
  const key = format(date, "yyyy-MM-dd");
  return holidays.includes(key);
}

function isWorkingDay(date: Date, holidays: string[]): boolean {
  if (isSaturday(date) || isSunday(date)) return false;
  return !isHoliday(date, holidays);
}

/** Add N working days starting from startDate (inclusive if n>=1). */
export function addWorkingDays(
  startDate: string,
  workingDays: number,
  holidays: string[] = [],
): { start: string; end: string } {
  let current = parseISO(startDate);
  while (!isWorkingDay(current, holidays)) {
    current = addDays(current, 1);
  }
  const phaseStart = current;
  let remaining = Math.max(workingDays, 1) - 1;
  while (remaining > 0) {
    current = addDays(current, 1);
    if (isWorkingDay(current, holidays)) remaining -= 1;
  }
  return {
    start: format(phaseStart, "yyyy-MM-dd"),
    end: format(current, "yyyy-MM-dd"),
  };
}

export function schedulePhases(
  plannedStart: string,
  phases: { id: string; name: string; durationDays: number; sortOrder: number }[],
  holidays: string[] = [],
): { phaseId: string; startDate: string; endDate: string }[] {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  let cursor = plannedStart;
  const result: { phaseId: string; startDate: string; endDate: string }[] = [];
  for (const phase of sorted) {
    const { start, end } = addWorkingDays(cursor, phase.durationDays, holidays);
    result.push({ phaseId: phase.id, startDate: start, endDate: end });
    cursor = format(addDays(parseISO(end), 1), "yyyy-MM-dd");
  }
  return result;
}

export function totalWorkingDaysBetween(
  start: string,
  end: string,
  holidays: string[] = [],
): number {
  let current = parseISO(start);
  const endDate = parseISO(end);
  let count = 0;
  while (current <= endDate) {
    if (isWorkingDay(current, holidays)) count += 1;
    current = addDays(current, 1);
  }
  return count;
}
