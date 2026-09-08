import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { DashedLine } from "../dashed-line";

import { Card, CardContent } from "@/components/ui/card";

const items = [
  {
    title: "MTS Decor Civil Contractor & Interior Designer Measurement Software System",
    badge: "Flagship Core System",
    description:
      "Hierarchical multi-area measurement sheets (L × W × H), automated deduction calculation, item-wise rates, RA billing & one-click Excel exports.",
    image: "/features/triage-card.svg",
    href: "/#features",
  },
  {
    title: "Construction Site Progress Report",
    badge: "Field Operations & Audits",
    description:
      "Daily contractor progress tracking, stage milestone sign-offs, labor & material staging, photo audits, and client progress summaries.",
    image: "/features/cycle-card.svg",
    href: "/#features",
  },
  {
    title: "Instant Cloud Sync & Multi-Device Field Access",
    badge: "Field-to-Office Connectivity",
    description:
      "Real-time synchronization between site engineers and head office. Access measurement workbooks and site reports anywhere, anytime.",
    image: "/features/overview-card.svg",
    href: "/#features",
  },
];

export const Features = () => {
  return (
    <section id="features" className="pb-28 lg:pb-32 scroll-mt-20">
      <div className="container">
        {/* Top dashed line with text */}
        <div className="relative flex items-center justify-center">
          <DashedLine className="text-muted-foreground" />
          <span className="bg-muted text-muted-foreground absolute px-3 font-mono text-xs md:text-sm font-semibold tracking-widest max-md:hidden uppercase">
            MEASURE TWICE • CUT ONCE • ZERO DISPUTES
          </span>
        </div>

        {/* Content */}
        <div className="mx-auto mt-10 grid max-w-4xl items-center gap-3 md:gap-8 lg:mt-20 lg:grid-cols-2">
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
            Engineered specifically for civil contractors & designers
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            MTS DECOR bridges the gap between chaotic site measurements and precision billing. Eliminate calculation mistakes, streamline RA bills, and track site progress transparently.
          </p>
        </div>

        {/* Features Card */}
        <Card className="mt-8 rounded-3xl md:mt-12 lg:mt-16 overflow-hidden border">
          <CardContent className="flex p-0 max-md:flex-col">
            {items.map((item, i) => (
              <div key={i} className="flex flex-1 max-md:flex-col">
                <div className="flex-1 p-5 md:p-7 flex flex-col justify-between">
                  <div>
                    {/* Custom Contractor Feature Preview Card */}
                    <div className="relative aspect-[1.28/1] overflow-hidden rounded-xl border bg-muted/30 p-3.5 mb-5 font-sans flex flex-col justify-between select-none">
                      {i === 0 && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b pb-1.5 font-mono text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Room 101 — Living & Dining</span>
                            <span className="text-emerald-600 font-bold">Auto-Deductions Active</span>
                          </div>
                          <div className="bg-background/80 rounded p-2 border space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Gross Wall Plaster (4 × 24&apos;6&quot; × 11&apos;)</span>
                              <span>1,078.00 Sq.Ft</span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                              <span>- French Window W1 & Main Door</span>
                              <span>-168.00 Sq.Ft</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground border-t pt-1">
                              <span>Net Billable Area</span>
                              <span className="text-primary font-mono">910.00 Sq.Ft</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
                            <span>Rate: ₹55/Sq.Ft</span>
                            <span className="font-bold text-foreground">Total: ₹50,050.00</span>
                          </div>
                        </div>
                      )}

                      {i === 1 && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b pb-1.5 font-mono text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Daily Progress Log</span>
                            <span className="text-amber-600 font-bold">Stage 4 of 5</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full w-[84%]" />
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between bg-background/80 p-1.5 rounded border text-muted-foreground">
                              <span>✓ Botticino Marble Laying</span>
                              <span className="text-emerald-600 font-mono text-[10px]">Done</span>
                            </div>
                            <div className="flex items-center justify-between bg-background/80 p-1.5 rounded border text-muted-foreground">
                              <span>✓ False Ceiling Framing</span>
                              <span className="text-emerald-600 font-mono text-[10px]">Done</span>
                            </div>
                            <div className="flex items-center justify-between bg-background/80 p-1.5 rounded border text-foreground">
                              <span>⏳ Teak Veneer Paneling</span>
                              <span className="text-amber-600 font-mono text-[10px]">80%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {i === 2 && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b pb-1.5 font-mono text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Cloud Sync & Export</span>
                            <span className="text-emerald-600 font-bold">● Connected</span>
                          </div>
                          <div className="bg-background/80 rounded p-2.5 border space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Field Site Sync</span>
                              <span className="font-mono text-emerald-600 font-semibold">100% Up to Date</span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-1.5">
                              <span className="text-muted-foreground">Workbook Format</span>
                              <span className="font-mono text-foreground font-semibold">Excel (.XLSX)</span>
                            </div>
                            <div className="flex items-center justify-between border-t pt-1.5">
                              <span className="text-muted-foreground">Formula Preservation</span>
                              <span className="font-mono text-primary font-semibold">Active Formulas</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
                        <span>IS 1200 / CPWD Standard</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified</span>
                      </div>
                    </div>

                    <span className="inline-block px-2.5 py-0.5 mb-2.5 rounded-full text-[11px] font-mono font-medium bg-primary/10 text-primary">
                      {item.badge}
                    </span>

                    <h3 className="font-display text-xl md:text-2xl leading-snug font-bold tracking-tight text-foreground">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed mt-2.5">
                      {item.description}
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="group flex items-center justify-between gap-4 pt-6 mt-4 border-t border-border/60"
                  >
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      Book Site Demo
                    </span>
                    <div className="rounded-full border p-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </div>
                {i < items.length - 1 && (
                  <div className="relative hidden md:block">
                    <DashedLine orientation="vertical" />
                  </div>
                )}
                {i < items.length - 1 && (
                  <div className="relative block md:hidden">
                    <DashedLine orientation="horizontal" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
