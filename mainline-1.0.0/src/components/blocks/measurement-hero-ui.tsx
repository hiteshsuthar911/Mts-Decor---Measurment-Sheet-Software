"use client";

import React, { useState } from "react";

import {
  FileSpreadsheet,
  Download,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Building2,
  ChevronDown,
  Calculator,
  HardHat,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const MeasurementHeroUI = () => {
  const [activeTab, setActiveTab] = useState<"sheets" | "progress" | "billing">("sheets");

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden text-start font-sans">
      {/* Window Header Bar */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-3 py-2.5 sm:px-4 sm:py-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* macOS window dots */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="size-2.5 sm:size-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="size-2.5 sm:size-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-border/60">
            <div className="flex size-5 sm:size-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px] sm:text-xs">
              M
            </div>
            <span className="font-semibold text-[11px] sm:text-xs text-foreground tracking-tight hidden xs:inline">
              MTS DECOR
            </span>
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Site Sync</span>
              <span className="sm:hidden">Live</span>
            </span>
          </div>
        </div>

        {/* Active Project Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground bg-background/80 border px-2 sm:px-3 py-1 rounded-lg max-w-[140px] xs:max-w-[200px] sm:max-w-[280px]">
          <Building2 className="size-3 text-primary shrink-0" />
          <span className="text-foreground font-semibold truncate">
            The Grand Oberoi Penthouse
          </span>
          <ChevronDown className="size-3 text-muted-foreground ml-0.5 shrink-0 hidden sm:inline" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium border border-emerald-500/20 transition-colors">
            <FileSpreadsheet className="size-3.5" />
            <span>Export .XLSX</span>
          </button>
          <button className="inline-flex items-center gap-1 rounded-md bg-primary text-primary-foreground px-2.5 sm:px-3 py-1 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors">
            <Download className="size-3" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-border/70 bg-muted/20 px-2.5 sm:px-4 pt-1.5 sm:pt-2 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("sheets")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs font-semibold border-b-2 transition-all shrink-0",
            activeTab === "sheets"
              ? "border-primary text-foreground bg-background/60 rounded-t-md"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Calculator className="size-3.5 text-primary" />
          <span><span className="sm:hidden">Sheets</span><span className="hidden sm:inline">Measurement Sheets (L×W×H)</span></span>
          <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.2 text-[10px] font-mono">
            4 Areas
          </span>
        </button>

        <button
          onClick={() => setActiveTab("progress")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs font-semibold border-b-2 transition-all shrink-0",
            activeTab === "progress"
              ? "border-primary text-foreground bg-background/60 rounded-t-md"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Camera className="size-3.5 text-amber-500" />
          <span><span className="sm:hidden">Progress</span><span className="hidden sm:inline">Construction Site Progress Report</span></span>
          <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-mono">
            18 Photos
          </span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs font-semibold border-b-2 transition-all shrink-0",
            activeTab === "billing"
              ? "border-primary text-foreground bg-background/60 rounded-t-md"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="size-3.5 text-emerald-500" />
          <span><span className="sm:hidden">RA Bill #03</span><span className="hidden sm:inline">Running Account (RA) Bill #03</span></span>
        </button>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-4 bg-muted/15 border-b border-border/60 text-xs">
        <div className="bg-background/90 rounded-xl p-2.5 sm:p-3 border shadow-2xs">
          <span className="text-muted-foreground block text-[10px] sm:text-[11px] font-medium">
            Total Net Measured Area
          </span>
          <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
            <span className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
              18,420.50
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">Sq.Ft</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block truncate">
            -1,729.50 Auto-Deducted
          </span>
        </div>

        <div className="bg-background/90 rounded-xl p-2.5 sm:p-3 border shadow-2xs">
          <span className="text-muted-foreground block text-[10px] sm:text-[11px] font-medium">
            Gross Estimated Bill
          </span>
          <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
            <span className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
              ₹38,95,400
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 block truncate">
            Verified with Client Rates
          </span>
        </div>

        <div className="bg-background/90 rounded-xl p-2.5 sm:p-3 border shadow-2xs">
          <span className="text-muted-foreground block text-[10px] sm:text-[11px] font-medium">
            Site Progress Status
          </span>
          <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
            <span className="text-base sm:text-xl font-bold tracking-tight text-foreground font-mono">
              84% Done
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 block truncate">
            Stage 4: False Ceiling
          </span>
        </div>

        <div className="bg-background/90 rounded-xl p-2.5 sm:p-3 border shadow-2xs">
          <span className="text-muted-foreground block text-[10px] sm:text-[11px] font-medium">
            Site Supervision Lead
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
            <HardHat className="size-3.5 sm:size-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
              Jagdish Suthar
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 block truncate">
            Field Operations
          </span>
        </div>
      </div>

      {/* Dynamic Content Body based on activeTab */}
      {activeTab === "sheets" && (
        <div className="w-full">
          <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-muted/40 text-[10px] text-muted-foreground border-b font-mono">
            <span>↔ Swipe horizontally for all 14 measurement columns</span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3 min-w-[140px]">Area / Room</th>
                <th className="py-2.5 px-3 min-w-[240px]">Item Description & Specs</th>
                <th className="py-2.5 px-2 text-center">Nos</th>
                <th className="py-2.5 px-2 text-center">L (ft)</th>
                <th className="py-2.5 px-2 text-center">W (ft)</th>
                <th className="py-2.5 px-2 text-center">H (ft)</th>
                <th className="py-2.5 px-2 text-center">Unit</th>
                <th className="py-2.5 px-3 text-right">Gross</th>
                <th className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">Deduction</th>
                <th className="py-2.5 px-3 text-right font-bold text-foreground">Net Qty</th>
                <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right font-bold text-foreground">Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-xs">
              {/* Row 1 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 text-muted-foreground">01</td>
                <td className="py-3 px-3 font-sans font-semibold text-foreground">
                  Living & Dining
                  <span className="block text-[10px] font-mono text-muted-foreground">Wall Plaster</span>
                </td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  12mm POP Wall Punning & Acrylic Emulsion Base over Masonry
                </td>
                <td className="py-3 px-2 text-center">4</td>
                <td className="py-3 px-2 text-center">24&apos;-6&quot;</td>
                <td className="py-3 px-2 text-center text-muted-foreground">—</td>
                <td className="py-3 px-2 text-center">11&apos;-0&quot;</td>
                <td className="py-3 px-2 text-center font-semibold">Sq.Ft</td>
                <td className="py-3 px-3 text-right">1,078.00</td>
                <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                  -168.00
                  <span className="block text-[9px] text-muted-foreground font-sans">Window W1 & Door</span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-foreground">910.00</td>
                <td className="py-3 px-3 text-right">₹55.00</td>
                <td className="py-3 px-3 text-right font-bold text-foreground">₹50,050.00</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 text-muted-foreground">02</td>
                <td className="py-3 px-3 font-sans font-semibold text-foreground">
                  Master Suite
                  <span className="block text-[10px] font-mono text-muted-foreground">Flooring</span>
                </td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Italian Botticino Marble Flooring with Diamond Mirror Polish
                </td>
                <td className="py-3 px-2 text-center">1</td>
                <td className="py-3 px-2 text-center">20&apos;-0&quot;</td>
                <td className="py-3 px-2 text-center">16&apos;-6&quot;</td>
                <td className="py-3 px-2 text-center text-muted-foreground">—</td>
                <td className="py-3 px-2 text-center font-semibold">Sq.Ft</td>
                <td className="py-3 px-3 text-right">330.00</td>
                <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                  -24.50
                  <span className="block text-[9px] text-muted-foreground font-sans">Wardrobe Base</span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-foreground">305.50</td>
                <td className="py-3 px-3 text-right">₹420.00</td>
                <td className="py-3 px-3 text-right font-bold text-foreground">₹1,28,310.00</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 text-muted-foreground">03</td>
                <td className="py-3 px-3 font-sans font-semibold text-foreground">
                  Ceiling Architecture
                  <span className="block text-[10px] font-mono text-muted-foreground">False Ceiling</span>
                </td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Perimeter Saint-Gobain Gypsum Ceiling with LED Cove Framing
                </td>
                <td className="py-3 px-2 text-center">1</td>
                <td className="py-3 px-2 text-center">82&apos;-0&quot;</td>
                <td className="py-3 px-2 text-center">2&apos;-6&quot;</td>
                <td className="py-3 px-2 text-center text-muted-foreground">—</td>
                <td className="py-3 px-2 text-center font-semibold">Rft</td>
                <td className="py-3 px-3 text-right">82.00</td>
                <td className="py-3 px-3 text-right text-muted-foreground">—</td>
                <td className="py-3 px-3 text-right font-bold text-foreground">82.00</td>
                <td className="py-3 px-3 text-right">₹210.00</td>
                <td className="py-3 px-3 text-right font-bold text-foreground">₹17,220.00</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-3 text-muted-foreground">04</td>
                <td className="py-3 px-3 font-sans font-semibold text-foreground">
                  Dining Partition
                  <span className="block text-[10px] font-mono text-muted-foreground">Woodwork</span>
                </td>
                <td className="py-3 px-3 font-sans text-muted-foreground">
                  Marine Ply Grade-710 Frame with Natural Teak Veneer & PU Finish
                </td>
                <td className="py-3 px-2 text-center">2</td>
                <td className="py-3 px-2 text-center">9&apos;-0&quot;</td>
                <td className="py-3 px-2 text-center text-muted-foreground">—</td>
                <td className="py-3 px-2 text-center">8&apos;-6&quot;</td>
                <td className="py-3 px-2 text-center font-semibold">Sq.Ft</td>
                <td className="py-3 px-3 text-right">153.00</td>
                <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400">
                  -21.00
                  <span className="block text-[9px] text-muted-foreground font-sans">Arch Cutout</span>
                </td>
                <td className="py-3 px-3 text-right font-bold text-foreground">132.00</td>
                <td className="py-3 px-3 text-right">₹680.00</td>
                <td className="py-3 px-3 text-right font-bold text-foreground">₹89,760.00</td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-sans font-medium">
                    <Clock className="size-3" /> In Progress
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === "progress" && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h4 className="font-bold text-foreground text-sm">
                Daily Construction Site Progress Log — 18 Photos Logged Today
              </h4>
              <p className="text-muted-foreground text-xs">
                Stage 4: Italian Marble Laying & Gypsum Perimeter Framing
              </p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold">
              Milestone Sign-off: 84% Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-mono">
                📸 Site Photo #01 - Living Room Marble
              </div>
              <p className="text-xs font-semibold text-foreground">Master Living Room</p>
              <p className="text-[11px] text-muted-foreground">Floor leveling verified with laser level. Botticino marble slabs laid.</p>
              <span className="text-[10px] font-mono text-emerald-600">✓ Inspected 10:30 AM</span>
            </div>

            <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-mono">
                📸 Site Photo #02 - False Ceiling
              </div>
              <p className="text-xs font-semibold text-foreground">Gypsum Cove Framing</p>
              <p className="text-[11px] text-muted-foreground">Saint-Gobain channels fastened at 450mm c/c with perimeter hangers.</p>
              <span className="text-[10px] font-mono text-emerald-600">✓ Inspected 01:15 PM</span>
            </div>

            <div className="rounded-xl border p-3 bg-muted/20 space-y-2">
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs font-mono">
                📸 Site Photo #03 - Teak Veneer
              </div>
              <p className="text-xs font-semibold text-foreground">Dining Partition Veneer</p>
              <p className="text-[11px] text-muted-foreground">Grain matching inspected by Jagdish Suthar. PU base coat applied.</p>
              <span className="text-[10px] font-mono text-amber-600">⏳ 2nd Coat Tomorrow</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h4 className="font-bold text-foreground text-sm">
                Running Account (RA) Bill #03 — Tax Invoice Summary
              </h4>
              <p className="text-muted-foreground text-xs">
                Client: Mr. Rajesh Sharma • Oberoi Sky City Tower B #2402
              </p>
            </div>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
              Net Payable: ₹14,25,840.00
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-muted/10">
              <span className="text-muted-foreground text-[11px]">Cumulative Work Done</span>
              <p className="font-mono font-bold text-base text-foreground mt-1">₹38,95,400.00</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/10">
              <span className="text-muted-foreground text-[11px]">Previous RA Bills Paid</span>
              <p className="font-mono font-bold text-base text-foreground mt-1">₹24,69,560.00</p>
            </div>
            <div className="p-3 rounded-lg border bg-muted/10">
              <span className="text-muted-foreground text-[11px]">Retention Deducted (5%)</span>
              <p className="font-mono font-bold text-base text-rose-600 mt-1">-₹1,94,770.00</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Audit Guarantee Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-border/70 bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <span>Automated deduction calculations compliant with <strong>IS 1200 / CPWD specifications</strong></span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-emerald-600 dark:text-emerald-400">● 100% Formula Verified</span>
          <span className="text-muted-foreground hidden sm:inline">Saved directly to Client Portal</span>
        </div>
      </div>
    </div>
  );
};
