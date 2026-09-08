import Link from "next/link";

import {
  ArrowRight,
  Blend,
  ChartNoAxesColumn,
  CircleDot,
  Diamond,
} from "lucide-react";

import { MeasurementHeroUI } from "./measurement-hero-ui";

import { DashedLine } from "@/components/dashed-line";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Precision Measurement Sheets",
    description: "Hierarchical L × W × H, automated area, volume and deduction calculations.",
    icon: CircleDot,
  },
  {
    title: "Construction Site Progress",
    description: "Daily task status, contractor milestones, and site audit documentation.",
    icon: ChartNoAxesColumn,
  },
  {
    title: "Automated RA Billing",
    description: "Instant Running Account bills with custom taxes, retention & advance deductions.",
    icon: Diamond,
  },
  {
    title: "Multi-Sheet Excel Export",
    description: "One-click .xlsx workbooks with native formulas saved to client dashboards.",
    icon: Blend,
  },
];

export const Hero = () => {
  return (
    <section className="py-24 lg:py-28 lg:pt-40">
      <div className="container flex flex-col justify-between gap-8 md:gap-14 lg:flex-row lg:gap-16">
        {/* Left side - Main content */}
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-mono font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ENGINEERED FOR CONTRACTORS & DESIGNERS
          </div>

          <h1 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-5xl leading-[1.15]">
            MTS DECOR <br />
            <span className="text-primary">Measurement Software</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg md:text-xl mt-4 max-w-xl leading-relaxed">
            Professional on-site measurement sheets, automated deduction calculations, and daily construction site progress reporting for civil contractors & interior designers.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="lg" className="shadow-md font-semibold" asChild>
              <Link href="/contact">
                Book Site Demo
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="from-background h-auto gap-2 bg-linear-to-r to-transparent shadow-md font-medium"
              asChild
            >
              <Link
                href="/#features"
                className="max-w-56 truncate text-start md:max-w-none"
              >
                Explore Products & Features
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right side - Features list */}
        <div className="relative flex flex-1 flex-col justify-center space-y-5 max-lg:pt-8 lg:pl-10">
          <DashedLine
            orientation="vertical"
            className="absolute top-0 left-0 max-lg:hidden"
          />
          <DashedLine
            orientation="horizontal"
            className="absolute top-0 lg:hidden"
          />
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-3 lg:gap-4">
                <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                  <Icon className="text-primary size-4" />
                </div>
                <div>
                  <h2 className="font-text text-foreground font-semibold text-sm sm:text-base">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Interactive UI Preview - Replaces bug tracker */}
      <div className="mt-12 md:mt-16 lg:container">
        <MeasurementHeroUI />
      </div>
    </section>
  );
};
