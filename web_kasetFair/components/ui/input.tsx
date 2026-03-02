import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-[#5a4bff] focus:ring-2 focus:ring-[#5a4bff] focus:ring-offset-0",
        className,
      )}
      {...props}
    />
  );
}
