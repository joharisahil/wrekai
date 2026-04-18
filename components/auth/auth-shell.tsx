import type { ReactNode } from "react";

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-screen bg-[linear-gradient(180deg,_#fff7ed_0%,_#ffffff_38%,_#f8fafc_100%)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden flex-col justify-between overflow-hidden border-r border-amber-100 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),_transparent_28%),linear-gradient(160deg,_#0f172a_0%,_#134e4a_100%)] px-10 py-12 text-white lg:flex">
        <div>
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
            Clareeva
          </div>
          <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight">
            Product intelligence that starts with customer evidence.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-teal-50/90">
            Bring Slack feedback, customer pain points, and delivery decisions into one
            workspace built for fast-moving product teams.
          </p>
        </div>
        <div className="grid gap-4 text-sm text-teal-50/90">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            Cluster recurring issues, score impact, and export decision-ready tickets without
            stitching evidence together by hand.
          </div>
          <div className="flex gap-8">
            <div>
              <div className="text-2xl font-semibold text-white">3x faster</div>
              <div>from feedback review to Jira-ready action</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">Multi-source</div>
              <div>Slack, tickets, and future customer channels</div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
