"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatKpiValue, type KpiUnit } from "@/lib/kpi";

const SERIES_COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"];

export interface TrendSeries {
  key: string;
  label: string;
}

export function TrendChart({
  data,
  series,
  unit = "currency",
}: {
  data: Array<Record<string, number | string>>;
  series: TrendSeries[];
  unit?: KpiUnit;
}) {
  const valueFormatter = (v: number) => formatKpiValue(v, unit);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--gridline)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="var(--ink-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: "var(--gridline)" }}
        />
        <YAxis
          stroke="var(--ink-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          formatter={(value) => valueFormatter(Number(value))}
          contentStyle={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink-primary)",
          }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-secondary)" }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
