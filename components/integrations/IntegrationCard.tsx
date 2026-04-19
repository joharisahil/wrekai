import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function IntegrationCard({
  action,
  children,
  description,
  footer,
  logo,
  name,
  status,
  statusTone = "neutral",
  subtitle,
}: {
  action?: ReactNode;
  children?: ReactNode;
  description: string;
  footer?: ReactNode;
  logo: ReactNode;
  name: string;
  status: string;
  statusTone?: "neutral" | "success" | "comingSoon";
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3">{logo}</div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-950">{name}</h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  statusTone === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : statusTone === "comingSoon"
                      ? "bg-slate-200 text-slate-600"
                      : "bg-slate-100 text-slate-600",
                )}
              >
                {status}
              </span>
            </div>
            {subtitle ? <p className="text-sm font-medium text-slate-700">{subtitle}</p> : null}
            <p className="max-w-md text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
