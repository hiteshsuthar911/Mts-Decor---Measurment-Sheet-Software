"use client";

import { useState } from "react";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    description: "Ideal for solo contractors & estimators",
    features: [
      "Up to 3 active projects",
      "Hierarchical L × W × H calculations",
      "Automatic door & window deductions",
      "Basic PDF sheet exports",
      "Mobile on-site access",
    ],
  },
  {
    name: "Pro Contractor",
    monthlyPrice: "₹1,499",
    yearlyPrice: "₹1,199",
    description: "Built for contracting firms & interior studios",
    features: [
      "All Starter features and...",
      "Unlimited active project sites",
      "Construction Site Progress Reports",
      "Multi-sheet Excel (.xlsx) workbooks",
      "Automated RA billing & tax breakdowns",
      "Instant cloud backup & multi-device sync",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    description: "For turnkey contractors & developers",
    features: [
      "All Pro Contractor features and...",
      "Unlimited supervisors & estimators",
      "Multi-site progress audit dashboards",
      "Custom corporate BoQ rate schedules",
      "2FA security & role-based permissions",
      "Priority phone support & dedicated SLA",
    ],
  },
];

export const Pricing = ({ className }: { className?: string }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-5xl">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-mono font-medium text-muted-foreground mb-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            CLEAR & PREDICTABLE PRICING
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
            Simple Plans for Every Site Scale
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed text-balance">
            Start free with essential measurement tools. Upgrade to Pro for full Construction Site Progress Reports, automated RA billing, and one-click Excel workbook exports.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-5 text-start md:mt-12 md:grid-cols-3 lg:mt-20">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`${
                plan.name === "Pro Contractor"
                  ? "outline-primary origin-top outline-4"
                  : ""
              }`}
            >
              <CardContent className="flex flex-col gap-7 px-6 py-5">
                <div className="space-y-2">
                  <h3 className="text-foreground font-semibold">{plan.name}</h3>
                  <div className="space-y-1">
                    <div className="text-muted-foreground text-lg font-medium">
                      {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}{" "}
                      {plan.name !== "Starter" && plan.monthlyPrice !== "Custom" && (
                        <span className="text-muted-foreground">
                          /
                          {isAnnual ? "month (billed yearly)" : "month"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {plan.name !== "Starter" ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isAnnual}
                      onCheckedChange={() => setIsAnnual(!isAnnual)}
                      aria-label="Toggle annual billing"
                    />
                    <span className="text-sm font-medium">Billed annually</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {plan.description}
                  </span>
                )}

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="text-muted-foreground flex items-center gap-1.5"
                    >
                      <Check className="size-5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-fit"
                  variant={plan.name === "Pro Contractor" ? "default" : "outline"}
                >
                  Get started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
