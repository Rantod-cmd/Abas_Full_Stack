import { cn } from "@/lib/utils";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Table({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function TableHeader({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableRowElement>>) {
  return <tr className={cn("border-b transition-colors hover:bg-amber-50/60", className)} {...props} />;
}

export function TableHead({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
