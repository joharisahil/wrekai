import * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Accordion({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

export function AccordionItem({
  children,
  className,
}: React.HTMLAttributes<HTMLDetailsElement>) {
  return (
    <details className={cn("group rounded-xl border border-slate-200 bg-white", className)}>
      {children}
    </details>
  );
}

export function AccordionTrigger({
  children,
  className,
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-slate-900 marker:hidden",
        className,
      )}
    >
      <span>{children}</span>
      <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
    </summary>
  );
}

export function AccordionContent({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 text-sm leading-6 text-slate-600", className)}>{children}</div>;
}
