"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export function Button({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}: PropsWithChildren<
  {
    variant?: Variant;
    size?: Size;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5a4bff] cursor-pointer";

  const variants: Record<Variant, string> = {
    default: "bg-[#5a4bff] text-white shadow hover:bg-[#5144e6]",
    outline:
      "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  };

  const sizes: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
