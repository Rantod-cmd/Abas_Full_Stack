import type { MetricsDaily } from "../types";

type ExtendedDailyMetric = MetricsDaily & {
  date?: string;
  foot_traffic?: number;
  footTraffic?: number;
  foot?: number;
  footTrafficPerDay?: number;
  interest_rate?: number;
  interest?: number;
  interestRate?: number;
  conversion_rate?: number;
  conversion?: number;
  conversionRate?: number;
};

type ProductCostRow = {
  id?: string | number;
  name?: string;
  sku?: string;
  cost_per_unit?: number;
  cost?: number;
  ingredients?: IngredientRow[];
  assumptions_debug?: {
    ingredients?: IngredientRow[];
  };
};

type IngredientRow = {
  name?: string;
  ingredient?: string;
  unit_cost?: number;
  cost_per_unit?: number;
  cost?: number;
};

type VariableCostRow = {
  name?: string;
  item?: string;
  cost_item?: string;
  unit_cost?: number;
  cost_per_unit?: number;
  price?: number;
  qty_per_day?: number;
  qty?: number;
  quantity_per_day?: number;
};

export type NormalizedIngredient = { name: string; cost: number };
export type ProductOption = { label: string; value: string; ingredients: NormalizedIngredient[] };
export type VariableCostItem = { name: string; unitCost: number; qty: number; total: number };
export type ChartPoint = { x: string; foot: number; interest: number; conversion: number; revenue?: number };
export type AssumptionMetricsOverride = {
  footTraffic?: number | null;
  interestRate?: number | null;
  conversionRate?: number | null;
  dailyFootTraffic?: Array<number | null> | null;
};

type ParsedAssumptions = {
  productOptions: ProductOption[];
  topLevelIngredients: NormalizedIngredient[];
  fallbackProductRows: NormalizedIngredient[];
  variableCostRows: VariableCostItem[];
  dailyFootTraffic?: number[] | null;
};

type AssumptionPayload = Record<string, unknown> | null;

const coerceNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeParse = (value: unknown): AssumptionPayload => {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const getArray = <T>(value: unknown): T[] | null => (Array.isArray(value) ? (value as T[]) : null);

const normalizeIngredients = (ingredients: IngredientRow[] | undefined | null): NormalizedIngredient[] => {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map((ing, idx) => ({
    name: ing.name ?? ing.ingredient ?? `Ingredient ${idx + 1}`,
    cost: coerceNumber(ing.unit_cost ?? ing.cost_per_unit ?? ing.cost),
  }));
};

export const parseAssumptionsPayload = (assumptions: unknown): ParsedAssumptions => {
  const parsed = safeParse(assumptions);
  const assumptionsDebug = getRecord(parsed?.["assumptions_debug"]);

  const ingredientSource =
    getArray<IngredientRow>(parsed?.["ingredients"]) ?? getArray<IngredientRow>(assumptionsDebug?.["ingredients"]);
  const topLevelIngredients = normalizeIngredients(ingredientSource ?? null) ?? [];

  const productOptions: ProductOption[] = [];

  const productCandidates =
    getArray<ProductCostRow>(parsed?.["products"]) ?? getArray<ProductCostRow>(assumptionsDebug?.["products"]);

  if (productCandidates) {
    productCandidates.forEach((prod, idx) => {
      const normalized = normalizeIngredients(
        prod.ingredients ?? getArray<IngredientRow>(prod.assumptions_debug?.ingredients) ?? null
      );
      if (normalized.length > 0) {
        productOptions.push({
          label: prod.name ?? prod.sku ?? `Product ${idx + 1}`,
          value: String(prod.sku ?? prod.id ?? idx),
          ingredients: normalized,
        });
      }
    });
  }

  const fallbackSource =
    getArray<ProductCostRow>(parsed?.["products"]) ?? getArray<ProductCostRow>(assumptionsDebug?.["products"]);

  const fallbackProductRows: NormalizedIngredient[] = fallbackSource
    ? fallbackSource
      .map((prod, idx) => ({
        name: prod.name ?? prod.sku ?? `Item ${idx + 1}`,
        cost: coerceNumber(prod.cost_per_unit ?? prod.cost),
      }))
      .filter((row) => Number.isFinite(row.cost) && row.cost > 0)
    : [];

  const variableCandidates =
    getArray<VariableCostRow>(parsed?.["variable_costs"]) ??
    getArray<VariableCostRow>(assumptionsDebug?.["variable_costs"]) ??
    getArray<VariableCostRow>(assumptionsDebug?.["daily_variable_costs"]) ??
    getArray<VariableCostRow>(parsed?.["daily_variable_costs"]) ??
    getArray<VariableCostRow>(assumptionsDebug?.["variableCosts"]);

  const dailyFootTrafficRaw =
    getArray<number>(parsed?.["daily_foot_traffic"]) ??
    getArray<number>(assumptionsDebug?.["daily_foot_traffic"]) ??
    getArray<number>(assumptionsDebug?.["dailyFootTraffic"]);

  const dailyFootTraffic = dailyFootTrafficRaw ? dailyFootTrafficRaw.map(coerceNumber) : null;

  const variableCostRows: VariableCostItem[] = variableCandidates
    ? variableCandidates.map((item, idx) => {
      const unitCost = coerceNumber(item.unit_cost ?? item.cost_per_unit ?? item.price);
      const qty = coerceNumber(item.qty_per_day ?? item.qty ?? item.quantity_per_day);
      return {
        name: item.name ?? item.item ?? item.cost_item ?? `Cost Item ${idx + 1}`,
        unitCost,
        qty,
        total: Number.isFinite(unitCost * qty) ? unitCost * qty : 0,
      };
    })
    : [];

  // Hardcoded daily variable costs as requested (Show only, no DB storage)
  const hardcodedVariableCosts: VariableCostItem[] = [
    { name: "ค่าน้ำแข็ง", unitCost: 80, qty: 1, total: 80 },
    { name: "ค่าแก๊ส", unitCost: 20, qty: 1, total: 20 },
    { name: "ค่าเช่าอุปกรณ์/ค่าเสื่อม", unitCost: 100, qty: 1, total: 100 },
  ];

  return {
    productOptions,
    topLevelIngredients,
    fallbackProductRows,
    variableCostRows: [...variableCostRows, ...hardcodedVariableCosts],
    dailyFootTraffic,
  };
};

export const currency = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    : "-";

export const integer = (value: number) => (Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "-");

export const buildChartData = (
  metrics?: { daily?: MetricsDaily[] } | null,
  overrides?: AssumptionMetricsOverride
): ChartPoint[] => {
  const normalizeOptionalNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const parsed =
      typeof value === "string" ? Number(value.replaceAll(",", "").replace("%", "").trim()) : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const dailyFoot = overrides?.dailyFootTraffic?.map((v) => normalizeOptionalNumber(v)) ?? null;
  const hasDailyFoot = dailyFoot?.some((v) => v !== null) ?? false;
  const overrideFoot = normalizeOptionalNumber(overrides?.footTraffic);
  const overrideInterest = normalizeOptionalNumber(overrides?.interestRate);
  const overrideConversion = normalizeOptionalNumber(overrides?.conversionRate);
  const hasOverrides = hasDailyFoot || overrideFoot !== null || overrideInterest !== null || overrideConversion !== null;

  const resolveFootForIndex = (index: number) => {
    const fromDaily = dailyFoot && index < dailyFoot.length ? dailyFoot[index] : null;
    return fromDaily ?? overrideFoot;
  };

  const coerceMetricValue = (value: unknown) => normalizeOptionalNumber(value) ?? 0;

  const raw =
    metrics?.daily && Array.isArray(metrics.daily) && metrics.daily.length > 0
      ? (metrics.daily.slice(0, 9) as ExtendedDailyMetric[])
      : null;

  if (raw) {
    return raw.map((d: ExtendedDailyMetric, i: number) => {
      const footOverrideFromArray = resolveFootForIndex(i);
      return {
        x: d.date ?? (typeof d.day === "number" ? `Day ${d.day}` : `Day ${i + 1}`),
        foot:
          footOverrideFromArray ??
          coerceMetricValue(d.foot_traffic ?? d.footTraffic ?? d.foot ?? d.footTrafficPerDay ?? 0),
        interest: overrideInterest ?? coerceMetricValue(d.interest_rate ?? d.interest ?? d.interestRate ?? 0),
        conversion: overrideConversion ?? coerceMetricValue(d.conversion_rate ?? d.conversion ?? d.conversionRate ?? 0),
        revenue: d.revenue ?? 0,
      };
    });
  }

  if (hasOverrides) {
    return Array.from({ length: 9 }).map((_, i) => ({
      x: `Day ${i + 1}`,
      foot: resolveFootForIndex(i) ?? 0,
      interest: overrideInterest ?? 0,
      conversion: overrideConversion ?? 0,
      revenue: 0,
    }));
  }

  return Array.from({ length: 9 }).map((_, i) => ({
    x: `Day ${i + 1}`,
    foot: Math.round(1900 + i * 90 + Math.sin(i / 2) * 120),
    interest: Math.round(26 + i * 3.5 + Math.cos(i / 2) * 5),
    conversion: Math.round(12 + i * 1.3 + (i % 2) * 2),
    revenue: 0,
  }));
};

export const deriveForecastStats = (points: ChartPoint[], overrides?: AssumptionMetricsOverride) => {
  const normalize = (value: unknown): number | null => {
    if (typeof value === "string") {
      const num = parseFloat(value); // "25%" → 25
      return Number.isFinite(num) ? num : null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const overrideFoot = normalize(overrides?.footTraffic);
  const overrideInterest = normalize(overrides?.interestRate);
  const overrideConversion = normalize(overrides?.conversionRate);
  const overrideDailyFoot =
    Array.isArray(overrides?.dailyFootTraffic) && overrides.dailyFootTraffic.length
      ? overrides.dailyFootTraffic.map((v) => normalize(v)).filter((v): v is number => v !== null)
      : null;

  const hasOverrides =
    (overrideDailyFoot && overrideDailyFoot.length > 0) ||
    overrideFoot !== null ||
    overrideInterest !== null ||
    overrideConversion !== null;

  const latest = hasOverrides
    ? {
      // Prioritize explicit foot_traffic override; fall back to last provided daily value.
      foot: overrideFoot ?? overrideDailyFoot?.[overrideDailyFoot.length - 1] ?? 0,
      interest: overrideInterest ?? 0,
      conversion: overrideConversion ?? 0,
    }
    : points.length > 0
      ? points[points.length - 1]
      : {
        foot: 2300,
        interest: 32,
        conversion: 18,
      };

  const estimatedBuyersPerDay = Math.max(
    1,
    latest.foot * (latest.interest / 100) * (latest.conversion / 100)
  );
  // Calculate true sum of buyers (Foot Traffic) from Day 1 to 9 based on assumption data
  const totalNineDayBuyers = points.reduce((sum, point) => sum + point.foot, 0);
  const statCards = [
    {
      title: "Foot Traffic Per Day",
      description: "Average number of people passing by",
      value: integer(latest.foot),
      accent: "text-[#4c4bd6]",
    },
    {
      title: "Interest Rate (%)",
      description: "% of people who stop at your booth",
      value: `${integer(latest.interest)} %`,
      accent: "text-[#0ea5e9]",
    },
    {
      title: "Conversion Rate (%)",
      description: "% of interested people who purchase",
      value: `${integer(latest.conversion)} %`,
      accent: "text-[#10b981]",
    },
  ];

  return { latest, statCards, estimatedBuyersPerDay, totalNineDayBuyers };
};
