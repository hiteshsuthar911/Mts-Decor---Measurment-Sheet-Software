import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Camera,
  ShieldCheck,
  Calculator,
  BellRing,
} from "lucide-react";

import { DashedLine } from "../dashed-line";

export const ResourceAllocation = () => {
  return (
    <section
      id="contractor-workflow"
      className="overflow-hidden pb-24 lg:pb-32 scroll-mt-20"
    >
      <div className="">
        <div className="container text-center space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-mono font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            END-TO-END CONTRACTOR WORKFLOW
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl text-foreground">
            Built for Real Construction Sites and Turnkey Interiors
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Eliminate communication gaps between site supervisors, office estimators, and client architects.
          </p>
        </div>

        <div className="mt-8 md:mt-12 lg:mt-16">
          <DashedLine
            orientation="horizontal"
            className="container scale-x-105"
          />

          {/* Top Features Grid - 2 items */}
          <div className="relative container flex max-md:flex-col">
            {/* Top Item 1 */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-border/70">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-foreground inline">Civil & Interior BoQ Templates. </h3>
                <span className="text-muted-foreground text-sm">
                  Pre-configured rate cards and measurement structures for Masonry, Flooring, False Ceiling, Woodwork & Painting.
                </span>
              </div>

              {/* Visual Card 1 */}
              <div className="rounded-xl border bg-muted/20 p-4 font-mono text-xs space-y-2 select-none shadow-2xs">
                <div className="flex items-center justify-between border-b pb-2 text-muted-foreground">
                  <span className="font-sans font-semibold text-foreground">Master Item Schedule</span>
                  <span className="text-primary font-sans text-[11px]">CPWD / State PWD Rates</span>
                </div>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center justify-between bg-background p-2 rounded border">
                    <span className="font-sans text-foreground truncate">12mm POP Wall Punning & Gypsum Finish</span>
                    <span className="font-bold text-primary font-mono ml-2">₹55 / Sq.Ft</span>
                  </div>
                  <div className="flex items-center justify-between bg-background p-2 rounded border">
                    <span className="font-sans text-foreground truncate">Italian Botticino Marble Laying & Polish</span>
                    <span className="font-bold text-primary font-mono ml-2">₹420 / Sq.Ft</span>
                  </div>
                  <div className="flex items-center justify-between bg-background p-2 rounded border">
                    <span className="font-sans text-foreground truncate">Saint-Gobain Gypsum False Ceiling Perimeter Cove</span>
                    <span className="font-bold text-primary font-mono ml-2">₹210 / Rft</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Item 2 */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between relative">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-foreground inline">Replace Fragmented Site Diaries. </h3>
                <span className="text-muted-foreground text-sm">
                  No more lost handwritten notebooks, broken Excel formulas, or chaotic WhatsApp photo groups.
                </span>
              </div>

              {/* Visual Card 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border bg-muted/20 select-none shadow-2xs">
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <Calculator className="size-5 text-primary" />
                  <span className="text-xs font-semibold font-sans text-foreground">L×W×H Math</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Zero Errors</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <Sparkles className="size-5 text-emerald-600" />
                  <span className="text-xs font-semibold font-sans text-foreground">Auto Deduct</span>
                  <span className="text-[10px] text-muted-foreground font-mono">IS 1200 Specs</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <Camera className="size-5 text-amber-600" />
                  <span className="text-xs font-semibold font-sans text-foreground">Daily Photos</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Geotagged</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <FileSpreadsheet className="size-5 text-emerald-600" />
                  <span className="text-xs font-semibold font-sans text-foreground">Excel Exports</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Active Formulas</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <Layers className="size-5 text-primary" />
                  <span className="text-xs font-semibold font-sans text-foreground">RA Billing</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Instant Bills</span>
                </div>
                <div className="p-2.5 rounded-lg border bg-background text-center flex flex-col items-center gap-1.5">
                  <ShieldCheck className="size-5 text-blue-600" />
                  <span className="text-xs font-semibold font-sans text-foreground">Cloud Sync</span>
                  <span className="text-[10px] text-muted-foreground font-mono">100% Secured</span>
                </div>
              </div>
            </div>
          </div>

          <DashedLine
            orientation="horizontal"
            className="container max-w-7xl scale-x-110"
          />

          {/* Bottom Features Grid - 3 items */}
          <div className="relative container grid max-w-7xl md:grid-cols-3">
            {/* Bottom Item 1 */}
            <div className="p-6 md:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-border/70">
              <div className="mb-5">
                <h3 className="font-bold text-base text-foreground inline">Automated Deduction Engine. </h3>
                <span className="text-muted-foreground text-sm">
                  Sub-line door, window, and arch deductions calculated automatically per CPWD guidelines.
                </span>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 font-mono text-xs shadow-2xs">
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Gross Plaster Area</span>
                  <span>1,078.00 Sq.Ft</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 text-[11px]">
                  <span>- Windows & Openings</span>
                  <span>-168.00 Sq.Ft</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold text-foreground text-xs">
                  <span>Net Billable Area</span>
                  <span className="text-emerald-600">910.00 Sq.Ft</span>
                </div>
              </div>
            </div>

            {/* Bottom Item 2 */}
            <div className="p-6 md:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-border/70">
              <div className="mb-5">
                <h3 className="font-bold text-base text-foreground inline">Site Audit & Sign-offs. </h3>
                <span className="text-muted-foreground text-sm">
                  Daily progress tracking with supervisor photo verification and architect approvals.
                </span>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 font-mono text-xs shadow-2xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground font-sans">Oberoi Penthouse #2402</span>
                  <span className="text-emerald-600 font-bold">84% Verified</span>
                </div>
                <div className="flex items-center gap-2 bg-background p-2 rounded border text-[11px] font-sans">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="text-muted-foreground truncate">Inspected by Jagdish Suthar</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>📸 18 Site Photos Attached</span>
                  <span className="text-primary font-semibold">Approved</span>
                </div>
              </div>
            </div>

            {/* Bottom Item 3 */}
            <div className="p-6 md:p-8 flex flex-col justify-between relative">
              <div className="mb-5">
                <h3 className="font-bold text-base text-foreground inline">Instant Billing Alerts. </h3>
                <span className="text-muted-foreground text-sm">
                  Live notifications when site measurements are verified and ready for client RA invoices.
                </span>
              </div>
              <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 bg-background p-2 rounded border">
                  <BellRing className="size-4 text-amber-500 shrink-0" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-foreground block">RA Bill #03 Prepared</span>
                    <span className="text-muted-foreground text-[10px]">Net Payable: ₹14,25,840</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-background p-2 rounded border">
                  <Clock className="size-4 text-emerald-500 shrink-0" />
                  <div className="text-[11px]">
                    <span className="font-semibold text-foreground block">Excel Export Generated</span>
                    <span className="text-muted-foreground text-[10px]">4 Worksheets Synced to Cloud</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DashedLine
          orientation="horizontal"
          className="container max-w-7xl scale-x-110"
        />
      </div>
    </section>
  );
};

