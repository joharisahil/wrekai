import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_32%),linear-gradient(180deg,_#fffdf5_0%,_#ffffff_52%,_#f8fafc_100%)]">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16 sm:px-10 lg:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-sm font-medium text-amber-950 shadow-sm backdrop-blur">
            Built for Series A SaaS product teams
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Turn scattered customer feedback into evidence-backed product decisions.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Clareeva ingests Slack feedback, clusters recurring issues, scores business impact,
            and drafts ticket-ready insights your team can act on quickly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
