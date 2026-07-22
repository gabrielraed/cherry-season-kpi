// Helpers de semana ISO y su asignación a mes calendario.
// Regla: una semana ISO pertenece al mes que contiene su jueves (estándar ISO-8601).

export function isoWeekInfo(date: Date): { isoYear: number; isoWeek: number } {
  // Extraer año/mes/día en UTC: todo el resto del módulo construye fechas con Date.UTC,
  // así que leer con getters locales acá desalinea el resultado según el huso horario
  // del servidor (p. ej. "siguiente semana" podía calcular mal cerca de medianoche UTC).
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // lunes=0 ... domingo=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // jueves de esta semana
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum);
  const isoWeek = Math.round((d.getTime() - week1Monday.getTime()) / (7 * 86400000)) + 1;
  return { isoYear, isoWeek };
}

export function weekBounds(isoYear: number, isoWeek: number): { startDate: Date; endDate: Date } {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayNum = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4DayNum);
  const startDate = new Date(week1Monday);
  startDate.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  return { startDate, endDate };
}

// Mes calendario (year/month 1-12) que contiene el jueves de la semana ISO dada.
export function isoWeekToMonth(isoYear: number, isoWeek: number): { year: number; month: number } {
  const { startDate } = weekBounds(isoYear, isoWeek);
  const thursday = new Date(startDate);
  thursday.setUTCDate(startDate.getUTCDate() + 3);
  return { year: thursday.getUTCFullYear(), month: thursday.getUTCMonth() + 1 };
}

export function formatWeekLabel(isoYear: number, isoWeek: number): string {
  const { startDate, endDate } = weekBounds(isoYear, isoWeek);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return `Semana ${isoWeek} · ${isoYear} · ${fmt(startDate)} al ${fmt(endDate)}`;
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatMonthLabel(year: number, month: number): string {
  return `${MESES[month - 1]} ${year}`;
}

// Rango calendario real del mes (día 1 al último día), en UTC.
export function monthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // día 0 del mes siguiente = último día de este mes
  return { start, end };
}

// Cantidad de días de [aStart, aStart+6] que caen dentro de [bStart, bEnd] (todos UTC, inclusive).
export function overlapDays(aStart: Date, bStart: Date, bEnd: Date): number {
  const aEnd = new Date(aStart);
  aEnd.setUTCDate(aStart.getUTCDate() + 6);
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  if (end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}
