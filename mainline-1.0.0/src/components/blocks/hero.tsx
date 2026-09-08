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
    <section className="py-16 sm:py-20 lg:py-28 pt-24 sm:pt-28 lg:pt-40 overflow-hidden">
      <div className="container flex flex-col justify-between gap-8 md:gap-14 lg:flex-row lg:gap-16">
        {/* Left side - Main content */}
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] sm:text-xs font-mono font-semibold text-primary mb-4 shadow-2xs">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            ENGINEERED FOR CONTRACTORS & DESIGNERS
          </div>

          <h1 className="text-foreground text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.2] sm:leading-[1.15]">
            MTS DECOR <br />
            <span className="text-primary">Measurement Software</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-lg md:text-xl mt-3 sm:mt-4 max-w-xl leading-relaxed">
            Professional on-site measurement sheets, automated deduction calculations, and daily construction site progress reporting for civil contractors & interior designers.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Button size="lg" className="shadow-md font-semibold w-full sm:w-auto justify-center" asChild>
              <Link href="/contact">
                Book Site Demo
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="from-background h-auto gap-2 bg-linear-to-r to-transparent shadow-md font-medium w-full sm:w-auto justify-center"
              asChild
            >
              <Link
                href="/#features"
                className="justify-center flex items-center gap-2"
              >
                <span>Explore Products & Features</span>
                <ArrowRight className="size-4 shrink-0" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Right side - Features list */}
        <div className="relative flex flex-1 flex-col justify-center space-y-4 sm:space-y-5 max-lg:pt-6 lg:pl-10">
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
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                  <Icon className="text-primary size-4" />
                </div>
                <div>
                  <h2 className="font-text text-foreground font-semibold text-xs sm:text-base">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground text-[11px] sm:text-sm leading-relaxed mt-0.5">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Interactive UI Preview - Fully padded on mobile */}
      <div className="mt-10 sm:mt-12 md:mt-16 container px-3 sm:px-6">
        <MeasurementHeroUI />
      </div>
    </section>
  );
};
