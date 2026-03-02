import type { FinancialRow, MetricsProduct, ProductMix } from "./types";

export function formatNumber(value: number) {
  return value.toLocaleString("th-TH");
}

export function calculateSummary(rows: FinancialRow[]) {
  if (!rows.length) {
    return { revenue: 0, expense: 0, profit: 0, customers: 0, items: 0 };
  }

  return rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      expense: acc.expense + row.expense,
      profit: acc.profit + row.profit,
      customers: acc.customers + row.customers,
      items: acc.items + row.items,
    }),
    { revenue: 0, expense: 0, profit: 0, customers: 0, items: 0 },
  );
}

export function maxFinancialValue(rows: FinancialRow[]) {
  if (!rows.length) return 1;
  return Math.max(...rows.map((row) => Math.max(row.revenue || 0, row.expense || 0, row.profit || 0)), 1);
}

export function parseFinancialCsv(csv: string | null | Record<string, unknown> | undefined): FinancialRow[] {
  if (typeof csv !== "string") return [];
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const cells = lines.map((line) => line.split(","));

  // Legacy format: Day,Revenue,...
  if (cells[0][0]?.toLowerCase() === "day") {
    return cells.slice(1).map((row) => {
      const [day, revenue, expense, profit, customers, items] = row;
      return {
        day: day ?? "",
        revenue: Number(revenue) || 0,
        expense: Number(expense) || 0,
        profit: Number(profit) || 0,
        customers: Number(customers) || 0,
        items: Number(items) || 0,
        cogs: Number(expense) || 0,
        opex: 0,
        accumulated: null,
      };
    });
  }

  // New format: first row contains "รายการ (Item)", summary rows exist later.
  const header = cells[0];
  if (header[0]?.includes("รายการ")) {
    const dayLabels = header.slice(2);
    const findRow = (keyword: string) => cells.find((row) => row[0]?.includes(keyword));
    const revenueRow = findRow("รวมรายได้");
    const cogsRow = findRow("รวมต้นทุนขาย");
    const opexRow = findRow("ค่าใช้จ่ายดำเนินงาน");
    const profitRow = findRow("กำไรสุทธิ");
    const accumulatedRow = findRow("กำไรสะสม");

    return dayLabels.map((label, idx) => {
      const revenue = Number(revenueRow?.[idx + 2]) || 0;
      const cogs = Number(cogsRow?.[idx + 2]) || 0;
      const opex = Number(opexRow?.[idx + 2]) || 0;
      const expense = cogs + opex;
      const profit =
        profitRow && profitRow[idx + 2] !== undefined ? Number(profitRow[idx + 2]) || 0 : revenue - expense;
      const accumulatedValue = accumulatedRow?.[idx + 2];
      const accumulated =
        accumulatedValue !== undefined && accumulatedValue !== ""
          ? Number(accumulatedValue) || 0
          : null;

      return {
        day: label || `Day ${idx + 1}`,
        revenue,
        expense,
        profit,
        customers: 0,
        items: 0,
        cogs,
        opex,
        accumulated,
      };
    });
  }

  return [];
}

type AssumptionProduct = {
  name?: string;
  price_per_unit?: unknown;
  sales_forecast?: unknown;
};

export function buildProductMixFromAssumptions(assumptions: unknown): ProductMix[] {
  const products = (assumptions as { products?: AssumptionProduct[] })?.products;
  if (!Array.isArray(products)) return [];

  const unitTotals = products.map((product) => {
    const name = product?.name ?? "สินค้า";
    const forecast = sumSalesForecast(product?.sales_forecast);
    return { name, value: forecast };
  });

  const total = unitTotals.reduce((sum, item) => sum + (item.value || 0), 0);
  if (!total) return [];

  return unitTotals.map((item) => ({
    name: item.name,
    value: item.value || 0,
    percent: Math.max(0, Math.round((((item.value || 0) / total) * 1000)) / 10),
  }));
}

export function buildProductMixFromMetrics(products?: MetricsProduct[]): ProductMix[] {
  if (!products?.length) return [];
  const total = products.reduce((sum, product) => sum + (product.total_units || 0), 0);
  if (!total) return [];
  return products.map((product) => ({
    name: product.name,
    value: product.total_units || 0,
    percent: Math.max(0, Math.round((((product.total_units || 0) / total) * 1000)) / 10),
  }));
}

type FinancialCsvProduct = {
  name?: string;
  product_name?: string;
  sales_forecast?: unknown;
};

type FinancialCsvContainer = {
  products?: FinancialCsvProduct[] | Record<string, unknown>;
  assumptions?: {
    products?: FinancialCsvProduct[] | Record<string, unknown>;
  };
  financial_csv?: unknown;
  data?: unknown;
};

function safeParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function looksLikeProduct(value: unknown): value is FinancialCsvProduct {
  if (typeof value !== "object" || value === null) return false;
  const product = value as FinancialCsvProduct & Record<string, unknown>;
  return (
    "sales_forecast" in product ||
    typeof product.name === "string" ||
    typeof product.product_name === "string" ||
    NUMERIC_KEYS.some((key) => key in product)
  );
}

function looksLikeProductArray(value: unknown): value is FinancialCsvProduct[] {
  if (!Array.isArray(value) || !value.length) return false;
  return value.some((item) => looksLikeProduct(item));
}

function extractProductsFromRecord(value: unknown): FinancialCsvProduct[] | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const entries = Object.values(value);
  const products = entries.filter((entry) => looksLikeProduct(entry)) as FinancialCsvProduct[];
  return products.length ? products : null;
}

function extractFinancialProducts(payload: unknown): FinancialCsvProduct[] {
  if (!payload) return [];

  const queue: unknown[] = [payload];
  const seen = new WeakSet<object>();

  while (queue.length) {
    const candidate = queue.shift();
    if (!candidate) continue;

    if (looksLikeProductArray(candidate)) {
      return candidate as FinancialCsvProduct[];
    }

    if (typeof candidate === "string") {
      const parsed = safeParseJson(candidate);
      if (parsed) {
        queue.push(parsed);
      }
      continue;
    }

    if (typeof candidate === "object") {
      if (seen.has(candidate)) continue;
      seen.add(candidate as object);

      const obj = candidate as FinancialCsvContainer & Record<string, unknown>;

      if (looksLikeProduct(obj)) {
        return [obj];
      }

      const productRecord = extractProductsFromRecord(obj);
      if (productRecord) {
        return productRecord;
      }

      if (looksLikeProductArray(obj.products)) {
        return obj.products as FinancialCsvProduct[];
      }
      const productsFromRecord = extractProductsFromRecord(obj.products);
      if (productsFromRecord) {
        return productsFromRecord;
      }
      if (obj.assumptions) {
        const assumptionProducts = Array.isArray(obj.assumptions.products)
          ? obj.assumptions.products
          : extractProductsFromRecord(obj.assumptions.products);
        if (assumptionProducts && assumptionProducts.length) {
          return assumptionProducts as FinancialCsvProduct[];
        }
      }
      if (obj.financial_csv) {
        queue.push(obj.financial_csv);
      }
      if (obj.data) {
        queue.push(obj.data);
      }

      for (const value of Object.values(obj)) {
        if (value !== obj.products && value !== obj.assumptions && value !== obj.financial_csv && value !== obj.data) {
          queue.push(value);
        }
      }
    }
  }

  return [];
}

const NUMERIC_KEYS = ["value", "amount", "quantity", "qty", "units", "unit", "forecast"];

function sumSalesForecast(values: unknown): number {
  if (values === null || values === undefined) return 0;
  if (typeof values === "number") return Number.isFinite(values) ? values : 0;
  if (typeof values === "string") {
    const numeric = Number(values);
    if (Number.isFinite(numeric)) return numeric;
    const trimmed = values.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const parsed = safeParseJson(trimmed);
      if (parsed !== null) {
        return sumSalesForecast(parsed);
      }
    }
    return 0;
  }
  if (Array.isArray(values)) {
    return values.reduce((total, value) => total + sumSalesForecast(value), 0);
  }
  if (typeof values === "object") {
    const obj = values as Record<string, unknown>;
    let matchedKey = false;
    let sum = 0;
    for (const key of NUMERIC_KEYS) {
      if (key in obj) {
        matchedKey = true;
        sum += sumSalesForecast(obj[key]);
      }
    }
    if (matchedKey) {
      return sum;
    }

    const objectValues = Object.values(obj);
    if (
      objectValues.length &&
      objectValues.every(
        (value) =>
          typeof value === "number" ||
          (typeof value === "string" && Number.isFinite(Number(value))),
      )
    ) {
      return objectValues.reduce((total:number, value) => total + (Number(value) || 0), 0);
    }
  }
  return 0;
}

export function buildProductMixFromFinancialJson(financial: unknown): ProductMix[] {
  const products = extractFinancialProducts(financial);
  if (!products.length) return [];

  const totals = products.map((product) => ({
    name: product.product_name || product.name || "สินค้า",
    value: sumSalesForecast(product.sales_forecast),
  }));

  const grandTotal = totals.reduce((sum, item) => sum + (item.value || 0), 0);
  if (!grandTotal) return [];

  return totals.map((item) => ({
    name: item.name,
    value: item.value,
    percent: Math.max(0, Math.round(((item.value || 0) / grandTotal) * 1000) / 10),
  }));
}
