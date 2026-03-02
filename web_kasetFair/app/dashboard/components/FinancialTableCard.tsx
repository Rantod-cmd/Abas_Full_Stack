"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FinancialRow, MetricsDaily, MetricsProduct } from "../types";
import { formatNumber } from "../utils";
import { useState } from "react";
import { useLocale } from "../i18n";

type FinancialTableCardProps = {
  rows: FinancialRow[];
  metricsDaily?: MetricsDaily[] | null;
  metricsProducts?: MetricsProduct[] | null;
  userId?: string | null;
  error?: string | null;
  loading?: boolean;
};

export function FinancialTableCard({
  rows,
  metricsDaily,
  metricsProducts,
  userId,
  error,
  loading,
}: FinancialTableCardProps) {
  const { t } = useLocale();
  const csvRows = rows.map((row) => ({
    day: row.day,
    revenue: row.revenue,
    cogs: row.cogs ?? row.expense,
    opex: row.opex ?? 0,
    expense: row.expense,
    profit: row.profit,
    accumulated: row.accumulated ?? null,
  }));

  const metricRows =
    metricsDaily?.length && metricsDaily.length > 0
      ? metricsDaily.map((day) => ({
        day: `Day ${day.day}`,
        revenue: day.revenue,
        cogs: day.cogs,
        opex: day.opex,
        expense: (day.cogs || 0) + (day.opex || 0),
        profit: day.net_profit,
        accumulated: day.accumulated ?? null,
      }))
      : [];

  const sourceRows = metricRows.length ? metricRows : csvRows;

  return (
    <Card className="border-[#e8eaff] shadow-sm">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#2c2f52]">
              {t("finance.summary")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="overflow-hidden rounded-xl border border-[#edf0ff] shadow-inner">
          {loading ? (
            <Table>
              <TableHeader className="bg-[#f5f7ff]">
                <TableRow className="hover:bg-[#f0f3ff]">
                  <TableHead>{t("finance.day")}</TableHead>
                  <TableHead>{t("finance.revenue")}</TableHead>
                  <TableHead>{t("finance.cogs")}</TableHead>
                  <TableHead>{t("finance.opex")}</TableHead>
                  <TableHead>{t("finance.netProfit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-[#2f3657]">
                {[...Array(4)].map((_, idx) => (
                  <TableRow key={idx}>
                    {[...Array(5)].map((__, cellIdx) => (
                      <TableCell key={cellIdx}>
                        <div className="h-3 w-full animate-pulse rounded bg-slate-200/80" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : sourceRows.length ? (
            <Table>
              <TableHeader className="bg-[#f5f7ff]">
                <TableRow className="hover:bg-[#f0f3ff]">
                  <TableHead>{t("finance.day")}</TableHead>
                  <TableHead>{t("finance.revenue")}</TableHead>
                  <TableHead>{t("finance.cogs")}</TableHead>
                  <TableHead>{t("finance.opex")}</TableHead>
                  {/* <TableHead>{t("finance.netProfit")}</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-[#2f3657]">
                {sourceRows.map((row) => (
                  <TableRow key={row.day}>
                    <TableCell className="font-semibold text-[#4c4bd6]">
                      {row.day}
                    </TableCell>
                    <TableCell>฿{formatNumber(row.revenue)}</TableCell>
                    <TableCell>฿{formatNumber(row.cogs ?? 0)}</TableCell>
                    <TableCell>฿{formatNumber(row.opex ?? 0)}</TableCell>
                    {/* <TableCell
                      className={
                        row.profit < 0 ? "text-rose-500" : "text-emerald-600"
                      }
                    > */}
                    {/* ฿{formatNumber(row.profit)} */}
                    {/* </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 text-sm text-[#7a80a7]">
              {t("finance.noData")}
            </div>
          )}
        </div>
        {metricsProducts?.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#edf0ff] bg-white shadow-inner">
            <Table>
              <TableHeader className="bg-[#f5f7ff]">
                <TableRow className="hover:bg-[#f0f3ff]">
                  <TableHead>{t("finance.product")}</TableHead>
                  <TableHead>{t("finance.totalRevenue")}</TableHead>
                  <TableHead>{t("finance.totalCogs")}</TableHead>
                  <TableHead>{t("finance.units")}</TableHead>
                  <TableHead>{t("finance.avgPrice")}</TableHead>
                  <TableHead>{t("finance.avgCost")}</TableHead>
                  <TableHead>{t("finance.grossMargin")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-[#2f3657]">
                {metricsProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-semibold text-[#4c4bd6]">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      ฿{formatNumber(product.total_revenue)}
                    </TableCell>
                    <TableCell>฿{formatNumber(product.total_cogs)}</TableCell>
                    <TableCell>{formatNumber(product.total_units)}</TableCell>
                    <TableCell>฿{formatNumber(product.avg_price)}</TableCell>
                    <TableCell>฿{formatNumber(product.avg_cost)}</TableCell>
                    <TableCell className="text-[#16a34a]">
                      {product.gross_margin_pct.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
