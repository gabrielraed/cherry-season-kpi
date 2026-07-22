-- AlterTable
ALTER TABLE "User" ADD COLUMN "cargo" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KpiResponsible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiCode" TEXT NOT NULL,
    "localId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'cumplimiento',
    "userId" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL DEFAULT 'semanal',
    CONSTRAINT "KpiResponsible_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KpiResponsible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KpiResponsible" ("frecuencia", "id", "kpiCode", "localId", "userId") SELECT "frecuencia", "id", "kpiCode", "localId", "userId" FROM "KpiResponsible";
DROP TABLE "KpiResponsible";
ALTER TABLE "new_KpiResponsible" RENAME TO "KpiResponsible";
CREATE UNIQUE INDEX "KpiResponsible_kpiCode_localId_tipo_key" ON "KpiResponsible"("kpiCode", "localId", "tipo");
CREATE TABLE "new_MonthlyClose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthId" TEXT NOT NULL,
    "localId" TEXT,
    "ebitda" REAL NOT NULL DEFAULT 0,
    "resultadoOperativo" REAL NOT NULL DEFAULT 0,
    "resultadoNetoConsolidado" REAL NOT NULL DEFAULT 0,
    "flujoCajaOperativo" REAL NOT NULL DEFAULT 0,
    "flujoCajaInversion" REAL NOT NULL DEFAULT 0,
    "flujoCajaFinanciacion" REAL NOT NULL DEFAULT 0,
    "saldoCajaInicial" REAL NOT NULL DEFAULT 0,
    "saldoCajaFinal" REAL NOT NULL DEFAULT 0,
    "notas" TEXT,
    "cargadoPorId" TEXT,
    "cargadoAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyClose_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyClose_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MonthlyClose_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyClose" ("cargadoAt", "cargadoPorId", "ebitda", "flujoCajaFinanciacion", "flujoCajaInversion", "flujoCajaOperativo", "id", "monthId", "notas", "resultadoNetoConsolidado", "resultadoOperativo", "saldoCajaFinal", "saldoCajaInicial", "updatedAt") SELECT "cargadoAt", "cargadoPorId", "ebitda", "flujoCajaFinanciacion", "flujoCajaInversion", "flujoCajaOperativo", "id", "monthId", "notas", "resultadoNetoConsolidado", "resultadoOperativo", "saldoCajaFinal", "saldoCajaInicial", "updatedAt" FROM "MonthlyClose";
DROP TABLE "MonthlyClose";
ALTER TABLE "new_MonthlyClose" RENAME TO "MonthlyClose";
CREATE UNIQUE INDEX "MonthlyClose_monthId_localId_key" ON "MonthlyClose"("monthId", "localId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
