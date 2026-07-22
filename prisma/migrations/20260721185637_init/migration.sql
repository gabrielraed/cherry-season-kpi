-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'ENCARGADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Local" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "UserLocal" (
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,

    PRIMARY KEY ("userId", "localId"),
    CONSTRAINT "UserLocal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserLocal_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isoYear" INTEGER NOT NULL,
    "isoWeek" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "monthId" TEXT NOT NULL,
    CONSTRAINT "Week_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Month" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "ventas" REAL NOT NULL DEFAULT 0,
    "costoInsumos" REAL NOT NULL DEFAULT 0,
    "costoLaboral" REAL NOT NULL DEFAULT 0,
    "gastoEstructura" REAL NOT NULL DEFAULT 0,
    "comisionesApps" REAL NOT NULL DEFAULT 0,
    "marketing" REAL NOT NULL DEFAULT 0,
    "descartes" REAL NOT NULL DEFAULT 0,
    "vajilla" REAL NOT NULL DEFAULT 0,
    "cantidadTickets" INTEGER NOT NULL DEFAULT 0,
    "ingresoCaja" REAL NOT NULL DEFAULT 0,
    "egresoCaja" REAL NOT NULL DEFAULT 0,
    "notas" TEXT,
    "origen" TEXT NOT NULL DEFAULT 'manual',
    "cargadoPorId" TEXT,
    "cargadoAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyEntry_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WeeklyEntry_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WeeklyEntry_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyClose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthId" TEXT NOT NULL,
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
    CONSTRAINT "MonthlyClose_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KpiGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiCode" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'consolidado',
    "localId" TEXT,
    "higherIsBetter" BOOLEAN NOT NULL DEFAULT true,
    "verdeThreshold" REAL NOT NULL,
    "amarilloThreshold" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KpiGoal_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KpiResponsible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiCode" TEXT NOT NULL,
    "localId" TEXT,
    "userId" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL DEFAULT 'semanal',
    CONSTRAINT "KpiResponsible_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "KpiResponsible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Week_isoYear_isoWeek_key" ON "Week"("isoYear", "isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Month_year_month_key" ON "Month"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyEntry_weekId_localId_key" ON "WeeklyEntry"("weekId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyClose_monthId_key" ON "MonthlyClose"("monthId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiGoal_kpiCode_localId_key" ON "KpiGoal"("kpiCode", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiResponsible_kpiCode_localId_key" ON "KpiResponsible"("kpiCode", "localId");
