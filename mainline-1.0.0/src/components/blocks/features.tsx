import Image from "next/image";
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
                    <div className="relative aspect-[1.28/1] overflow-hidden rounded-xl bg-muted/40 mb-5">
                      <Image
                        src={item.image}
                        alt={`${item.title} interface`}
                        fill
                        className="object-cover object-left-top ps-4 pt-2"
                      />
                      <div className="from-background absolute inset-0 z-10 bg-linear-to-t via-transparent to-transparent" />
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
                    href={item.href}
                    className="group flex items-center justify-between gap-4 pt-6 mt-4 border-t border-border/60"
                  >
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      Learn more
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
