import * as XLSX from "xlsx";

export interface ParsedWeeklyRow {
  rowNumber: number;
  localNombre: string;
  fecha: Date;
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
  notas: string;
}

export interface ImportError {
  rowNumber: number;
  message: string;
}

export interface ImportParseResult {
  rows: ParsedWeeklyRow[];
  errors: ImportError[];
}

// Encabezados aceptados (se normalizan a minúsculas sin espacios/acentos).
const HEADER_MAP: Record<string, keyof ParsedWeeklyRow> = {
  local: "localNombre",
  fecha: "fecha",
  ventas: "ventas",
  costoinsumos: "costoInsumos",
  costolaboral: "costoLaboral",
  gastoestructura: "gastoEstructura",
  comisionesapps: "comisionesApps",
  marketing: "marketing",
  descartes: "descartes",
  vajilla: "vajilla",
  cantidadtickets: "cantidadTickets",
  ingresocaja: "ingresoCaja",
  egresocaja: "egresoCaja",
  notas: "notas",
};

const NUMERIC_KEYS: Array<keyof ParsedWeeklyRow> = [
  "ventas",
  "costoInsumos",
  "costoLaboral",
  "gastoEstructura",
  "comisionesApps",
  "marketing",
  "descartes",
  "vajilla",
  "cantidadTickets",
  "ingresoCaja",
  "egresoCaja",
];

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function excelSerialToDate(serial: number): Date {
  // Época de Excel: día 1 = 1900-01-01 (con el conocido offset de 1900 bisiesto que maneja SheetJS).
  const parsed = XLSX.SSF.parse_date_code(serial);
  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
}

export function parseWeeklyImportFile(buffer: ArrayBuffer): ImportParseResult {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  const errors: ImportError[] = [];
  const rows: ParsedWeeklyRow[] = [];

  if (raw.length === 0) {
    return { rows, errors: [{ rowNumber: 0, message: "El archivo está vacío." }] };
  }

  const headerRow = (raw[0] as unknown[]).map((h) => normalizeHeader(String(h)));
  const columnIndex = new Map<keyof ParsedWeeklyRow, number>();
  headerRow.forEach((h, i) => {
    const mapped = HEADER_MAP[h];
    if (mapped) columnIndex.set(mapped, i);
  });

  if (!columnIndex.has("localNombre") || !columnIndex.has("fecha") || !columnIndex.has("ventas")) {
    return {
      rows,
      errors: [
        {
          rowNumber: 1,
          message:
            "Faltan columnas obligatorias: 'Local', 'Fecha' y 'Ventas'. Descargá la plantilla y respetá los encabezados.",
        },
      ],
    };
  }

  for (let i = 1; i < raw.length; i++) {
    const rowNumber = i + 1; // 1-indexado, coincide con el número de fila en el Excel
    const cells = raw[i] as unknown[];
    if (!cells || cells.every((c) => c === undefined || c === "")) continue;

    const get = (key: keyof ParsedWeeklyRow): unknown => {
      const idx = columnIndex.get(key);
      return idx === undefined ? undefined : cells[idx];
    };

    const localNombre = String(get("localNombre") ?? "").trim();
    if (!localNombre) {
      errors.push({ rowNumber, message: "Falta el nombre del local." });
      continue;
    }

    const fechaRaw = get("fecha");
    let fecha: Date | null = null;
    if (typeof fechaRaw === "number") {
      fecha = excelSerialToDate(fechaRaw);
    } else if (typeof fechaRaw === "string" && fechaRaw.trim()) {
      const d = new Date(fechaRaw.trim());
      if (!Number.isNaN(d.getTime())) fecha = d;
    }
    if (!fecha) {
      errors.push({ rowNumber, message: `Fecha inválida: "${String(fechaRaw ?? "")}".` });
      continue;
    }

    const values: Partial<Record<keyof ParsedWeeklyRow, number>> = {};
    let numericError = false;
    for (const key of NUMERIC_KEYS) {
      const cellValue = get(key);
      if (cellValue === undefined || cellValue === "") {
        values[key] = 0;
        continue;
      }
      const num = Number(cellValue);
      if (!Number.isFinite(num)) {
        errors.push({ rowNumber, message: `Valor numérico inválido en "${key}": "${String(cellValue)}".` });
        numericError = true;
        break;
      }
      values[key] = num;
    }
    if (numericError) continue;

    rows.push({
      rowNumber,
      localNombre,
      fecha,
      ventas: values.ventas ?? 0,
      costoInsumos: values.costoInsumos ?? 0,
      costoLaboral: values.costoLaboral ?? 0,
      gastoEstructura: values.gastoEstructura ?? 0,
      comisionesApps: values.comisionesApps ?? 0,
      marketing: values.marketing ?? 0,
      descartes: values.descartes ?? 0,
      vajilla: values.vajilla ?? 0,
      cantidadTickets: Math.round(values.cantidadTickets ?? 0),
      ingresoCaja: values.ingresoCaja ?? 0,
      egresoCaja: values.egresoCaja ?? 0,
      notas: String(get("notas") ?? ""),
    });
  }

  return { rows, errors };
}

export function buildTemplateWorkbook(localesNombres: string[]): ArrayBuffer {
  const headers = [
    "Local",
    "Fecha",
    "Ventas",
    "CostoInsumos",
    "CostoLaboral",
    "GastoEstructura",
    "ComisionesApps",
    "Marketing",
    "Descartes",
    "Vajilla",
    "CantidadTickets",
    "IngresoCaja",
    "EgresoCaja",
    "Notas",
  ];
  const example = localesNombres.length > 0 ? localesNombres[0] : "Local Centro";
  const today = new Date().toISOString().slice(0, 10);
  const sheetData = [
    headers,
    [example, today, 1450000, 464000, 420500, 232000, 101500, 43500, 29000, 14500, 345, 1450000, 1232500, "Ejemplo"],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Carga semanal");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
