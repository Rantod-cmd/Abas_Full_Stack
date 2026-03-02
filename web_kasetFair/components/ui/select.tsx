import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-[#5a4bff] focus:ring-2 focus:ring-[#5a4bff] focus:ring-offset-0",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
