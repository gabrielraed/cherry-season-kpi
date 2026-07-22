// Catálogo de KPIs, fórmulas de cálculo y evaluación de semáforo.

export type KpiUnit = "currency" | "percent" | "number";
export type KpiCategory = "semanal" | "mensual";
export type Semaforo = "verde" | "amarillo" | "rojo" | "sin_meta";

export interface KpiDef {
  code: string;
  label: string;
  unit: KpiUnit;
  category: KpiCategory;
  higherIsBetter: boolean;
  /** Metas por defecto usadas al sembrar la base (el admin las puede editar en /metas). */
  defaultVerde: number;
  defaultAmarillo: number;
  descripcion: string;
  /** Fórmula compacta, para mostrar en letra chica debajo del valor en el tablero. */
  formula: string;
}

export const KPI_CATALOG: KpiDef[] = [
  {
    code: "ventas",
    label: "Ventas",
    unit: "currency",
    category: "semanal",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Ventas totales de la semana por local.",
    formula: "Suma de ventas de todos los locales",
  },
  {
    code: "rentabilidad_pct",
    label: "Rentabilidad",
    unit: "percent",
    category: "semanal",
    higherIsBetter: true,
    defaultVerde: 15,
    defaultAmarillo: 8,
    descripcion: "Resultado sobre ventas, luego de todos los costos y gastos operativos.",
    formula: "(Ventas − costos totales) / Ventas",
  },
  {
    code: "margen_bruto_pct",
    label: "Margen bruto",
    unit: "percent",
    category: "semanal",
    higherIsBetter: true,
    defaultVerde: 68,
    defaultAmarillo: 62,
    descripcion: "(Ventas - costo de insumos) / Ventas.",
    formula: "(Ventas − costo de insumos) / Ventas",
  },
  {
    code: "costo_laboral_pct",
    label: "Costo laboral",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 28,
    defaultAmarillo: 32,
    descripcion: "Costo laboral sobre ventas.",
    formula: "Costo laboral / Ventas",
  },
  {
    code: "gasto_estructura_pct",
    label: "Gasto de estructura",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 15,
    defaultAmarillo: 18,
    descripcion: "Alquiler, servicios y estructura fija sobre ventas.",
    formula: "Gasto de estructura / Ventas",
  },
  {
    code: "comisiones_apps_pct",
    label: "Comisiones Apps",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 6,
    defaultAmarillo: 9,
    descripcion: "Comisiones de apps de delivery sobre ventas.",
    formula: "Comisiones Apps / Ventas",
  },
  {
    code: "marketing_pct",
    label: "Marketing",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 4,
    defaultAmarillo: 6,
    descripcion: "Inversión en marketing sobre ventas.",
    formula: "Marketing / Ventas",
  },
  {
    code: "descartes_pct",
    label: "Descartes",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 2,
    defaultAmarillo: 3.5,
    descripcion: "Producto descartado/merma sobre ventas.",
    formula: "Descartes / Ventas",
  },
  {
    code: "vajilla_pct",
    label: "Vajilla",
    unit: "percent",
    category: "semanal",
    higherIsBetter: false,
    defaultVerde: 1,
    defaultAmarillo: 2,
    descripcion: "Roturas y reposición de vajilla sobre ventas.",
    formula: "Vajilla / Ventas",
  },
  {
    code: "ticket_promedio",
    label: "Ticket promedio",
    unit: "currency",
    category: "semanal",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Ventas / cantidad de tickets de la semana.",
    formula: "Ventas / Cantidad de tickets",
  },
  {
    code: "ventas_mes",
    label: "Ventas del mes",
    unit: "currency",
    category: "mensual",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Ventas del mes calendario (día 1 al último día), prorateando por día las semanas que cruzan de mes.",
    formula: "Ventas de cada semana × (días de esa semana en el mes / 7)",
  },
  {
    code: "cantidad_tickets",
    label: "Cantidad de tickets",
    unit: "number",
    category: "mensual",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Tickets del mes calendario, prorateando por día las semanas que cruzan de mes.",
    formula: "Tickets de cada semana × (días de esa semana en el mes / 7)",
  },
  {
    code: "flujo_caja_neto",
    label: "Flujo de caja",
    unit: "currency",
    category: "mensual",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Variación de caja del mes (operativo + inversión + financiación).",
    formula: "Flujo operativo + inversión + financiación",
  },
  {
    code: "ebitda",
    label: "EBITDA / resultado operativo",
    unit: "currency",
    category: "mensual",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Resultado operativo del mes antes de intereses, impuestos y amortizaciones.",
    formula: "Ventas − costos y gastos operativos del mes",
  },
  {
    code: "resultado_neto_consolidado",
    label: "Resultado neto consolidado",
    unit: "currency",
    category: "mensual",
    higherIsBetter: true,
    defaultVerde: 0,
    defaultAmarillo: 0,
    descripcion: "Resultado neto final del mes, todos los locales consolidados.",
    formula: "EBITDA − intereses, impuestos y amortizaciones",
  },
];

export function kpiDef(code: string): KpiDef {
  const def = KPI_CATALOG.find((k) => k.code === code);
  if (!def) throw new Error(`KPI desconocido: ${code}`);
  return def;
}

export interface WeeklyTotals {
  ventas: number;
  costoInsumos: number;
  costoLaboral: number;
  gastoEstructura: number;
  comisionesApps: number;
  marketing: number;
  descartes: number;
  vajilla: number;
  cantidadTickets: number;
  ingresoCaja: number;
  egresoCaja: number;
}

export const emptyWeeklyTotals: WeeklyTotals = {
  ventas: 0,
  costoInsumos: 0,
  costoLaboral: 0,
  gastoEstructura: 0,
  comisionesApps: 0,
  marketing: 0,
  descartes: 0,
  vajilla: 0,
  cantidadTickets: 0,
  ingresoCaja: 0,
  egresoCaja: 0,
};

export function sumWeeklyTotals(rows: WeeklyTotals[]): WeeklyTotals {
  return rows.reduce<WeeklyTotals>(
    (acc, r) => ({
      ventas: acc.ventas + r.ventas,
      costoInsumos: acc.costoInsumos + r.costoInsumos,
      costoLaboral: acc.costoLaboral + r.costoLaboral,
      gastoEstructura: acc.gastoEstructura + r.gastoEstructura,
      comisionesApps: acc.comisionesApps + r.comisionesApps,
      marketing: acc.marketing + r.marketing,
      descartes: acc.descartes + r.descartes,
      vajilla: acc.vajilla + r.vajilla,
      cantidadTickets: acc.cantidadTickets + r.cantidadTickets,
      ingresoCaja: acc.ingresoCaja + r.ingresoCaja,
      egresoCaja: acc.egresoCaja + r.egresoCaja,
    }),
    { ...emptyWeeklyTotals }
  );
}

function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export interface WeeklyKpis {
  ventas: number;
  costosTotales: number;
  rentabilidad: number;
  rentabilidad_pct: number;
  margen_bruto: number;
  margen_bruto_pct: number;
  costo_laboral_pct: number;
  gasto_estructura_pct: number;
  comisiones_apps_pct: number;
  marketing_pct: number;
  descartes_pct: number;
  vajilla_pct: number;
  ticket_promedio: number;
  cantidadTickets: number;
  flujoCajaSemana: number;
}

export function computeWeeklyKpis(t: WeeklyTotals): WeeklyKpis {
  const costosTotales =
    t.costoInsumos +
    t.costoLaboral +
    t.gastoEstructura +
    t.comisionesApps +
    t.marketing +
    t.descartes +
    t.vajilla;
  const rentabilidad = t.ventas - costosTotales;
  const margen_bruto = t.ventas - t.costoInsumos;

  return {
    ventas: t.ventas,
    costosTotales,
    rentabilidad,
    rentabilidad_pct: safeDiv(rentabilidad, t.ventas) * 100,
    margen_bruto,
    margen_bruto_pct: safeDiv(margen_bruto, t.ventas) * 100,
    costo_laboral_pct: safeDiv(t.costoLaboral, t.ventas) * 100,
    gasto_estructura_pct: safeDiv(t.gastoEstructura, t.ventas) * 100,
    comisiones_apps_pct: safeDiv(t.comisionesApps, t.ventas) * 100,
    marketing_pct: safeDiv(t.marketing, t.ventas) * 100,
    descartes_pct: safeDiv(t.descartes, t.ventas) * 100,
    vajilla_pct: safeDiv(t.vajilla, t.ventas) * 100,
    ticket_promedio: safeDiv(t.ventas, t.cantidadTickets),
    cantidadTickets: t.cantidadTickets,
    flujoCajaSemana: t.ingresoCaja - t.egresoCaja,
  };
}

export interface GoalLike {
  higherIsBetter: boolean;
  verdeThreshold: number;
  amarilloThreshold: number;
}

export function evaluateSemaforo(value: number, goal: GoalLike | null | undefined): Semaforo {
  if (!goal) return "sin_meta";
  if (goal.higherIsBetter) {
    if (value >= goal.verdeThreshold) return "verde";
    if (value >= goal.amarilloThreshold) return "amarillo";
    return "rojo";
  }
  if (value <= goal.verdeThreshold) return "verde";
  if (value <= goal.amarilloThreshold) return "amarillo";
  return "rojo";
}

export function formatKpiValue(value: number, unit: KpiUnit): string {
  if (unit === "percent") return `${value.toFixed(1)}%`;
  if (unit === "number") return Math.round(value).toLocaleString("es-AR");
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}
