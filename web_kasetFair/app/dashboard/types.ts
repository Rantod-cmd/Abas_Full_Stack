export type BoothForm = {
  name: string;
  products: string;
  theme: string;
  concept: string;
  location: string;
  category: string;
  size: string;
  equipment: string;
  funding: string;
  staff: string;
  hours: string;
};

export type FinancialRow = {
  day: string;
  revenue: number;
  expense: number;
  profit: number;
  customers: number;
  items: number;
  cogs?: number;
  opex?: number;
  accumulated?: number | null;
};

export type ProductMix = { 
  name: string; 
  percent?: number; 
  value: number; 
};

export type Shop = { id: string; label: string; data: BoothForm; store_id?: string };

export type MetricsSummary = {
  total_revenue: number;
  total_cogs: number;
  total_opex: number;
  gross_profit: number;
  net_profit: number;
  initial_investment?: number;
  break_even_day?: number;
};

export type MetricsDaily = {
  day: number;
  revenue: number;
  cogs: number;
  opex: number;
  net_profit: number;
  accumulated?: number;
};

export type MetricsProduct = {
  name: string;
  total_units: number;
  total_revenue: number;
  total_cogs: number;
  avg_price: number;
  avg_cost: number;
  gross_margin_pct: number;
};

export type MetricsMargins = {
  gross_margin_pct: number;
  net_margin_pct: number;
  roi_pct: number;
};

export type Metrics = {
  summary?: MetricsSummary;
  daily?: MetricsDaily[];
  products?: MetricsProduct[];
  margins?: MetricsMargins;
  cashflow?: Array<{ day: number; accumulated: number }>;
};

export type Summary = {
  revenue: number;
  profit: number;
  expense: number;
  customers: number;
  items: number;

  // เพิ่ม optional fields จาก metrics
  total_revenue?: number;
  net_profit?: number;
  break_even_day?: number;
  gross_profit?: number;
  initial_investment?: number;
};

export type EditShopForm = {
  id: string;
  name?: string;
  products?: string;
  theme?: string;
  concept?: string;
  location?: string;
  category?: string;
  size?: string;
  equipment?: string;
  funding?: string;
  staff?: string;
  hours?: string;
};
