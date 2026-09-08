"use client";

import { useState } from "react";

import Link from "next/link";

import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FeatureSection {
  category: string;
  features: {
    name: string;
    free: true | false | null | string;
    startup: true | false | null | string;
    enterprise: true | false | null | string;
  }[];
}

const pricingPlans = [
  {
    name: "Starter",
    button: {
      text: "Start Free",
      variant: "outline" as const,
    },
  },
  {
    name: "Pro Contractor",
    button: {
      text: "Get Started",
      variant: "default" as const,
    },
  },
  {
    name: "Enterprise",
    button: {
      text: "Contact Sales",
      variant: "outline" as const,
    },
  },
];

const comparisonFeatures: FeatureSection[] = [
  {
    category: "Measurement & BoQ",
    features: [
      {
        name: "Hierarchical L×W×H Sheets",
        free: true,
        startup: true,
        enterprise: true,
      },
      {
        name: "Auto Door/Window Deductions",
        free: true,
        startup: true,
        enterprise: true,
      },
      {
        name: "Active Site Projects",
        free: "3 Sites",
        startup: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        name: "Multi-Sheet Excel (.xlsx) Export",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "Instant PDF Export",
        free: true,
        startup: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "Site Management & Progress",
    features: [
      {
        name: "Construction Site Progress Report",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "Daily Contractor Task Logs",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "On-Site Photo Documentation",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "Client Milestone Sign-offs",
        free: false,
        startup: true,
        enterprise: true,
      },
    ],
  },
  {
    category: "Billing & Financials",
    features: [
      {
        name: "Running Account (RA) Billing",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "Taxes & Retention Deductions",
        free: false,
        startup: true,
        enterprise: true,
      },
      {
        name: "Contractor Rate BoQ Schedules",
        free: "Standard",
        startup: "Customized",
        enterprise: "Enterprise Multi-Rate",
      },
    ],
  },
  {
    category: "Team & Support",
    features: [
      {
        name: "Mobile On-Site Access",
        free: true,
        startup: true,
        enterprise: true,
      },
      {
        name: "Cloud Auto-Sync & Backup",
        free: true,
        startup: true,
        enterprise: true,
      },
      {
        name: "Site Supervisor Accounts",
        free: "1",
        startup: "Up to 5",
        enterprise: "Unlimited",
      },
      {
        name: "Dedicated Phone Support & SLA",
        free: false,
        startup: false,
        enterprise: true,
      },
    ],
  },
];

const renderFeatureValue = (value: true | false | null | string) => {
  if (value === true) {
    return <Check className="size-5" />;
  }
  if (value === false) {
    return <X className="size-5" />;
  }
  if (value === null) {
    return null;
  }
  // String value
  return (
    <div className="flex items-center gap-2">
      <Check className="size-4" />
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
};

export const PricingTable = () => {
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to Startup plan

  return (
    <section className="pb-28 lg:py-32">
      <div className="container">
        <PlanHeaders
          selectedPlan={selectedPlan}
          onPlanChange={setSelectedPlan}
        />
        <FeatureSections selectedPlan={selectedPlan} />
      </div>
    </section>
  );
};

const PlanHeaders = ({
  selectedPlan,
  onPlanChange,
}: {
  selectedPlan: number;
  onPlanChange: (index: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="">
      {/* Mobile View */}
      <div className="md:hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="">
          <div className="flex items-center justify-between border-b py-4">
            <CollapsibleTrigger className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold">
                {pricingPlans[selectedPlan].name}
              </h3>
              <ChevronsUpDown
                className={`size-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <Button
              variant={pricingPlans[selectedPlan].button.variant}
              className="w-fit"
              asChild
            >
              <Link href="/contact">
                {pricingPlans[selectedPlan].button.text}
              </Link>
            </Button>
          </div>
          <CollapsibleContent className="flex flex-col space-y-2 p-2">
            {pricingPlans.map(
              (plan, index) =>
                index !== selectedPlan && (
                  <Button
                    size="lg"
                    variant="secondary"
                    key={index}
                    onClick={() => {
                      onPlanChange(index);
                      setIsOpen(false);
                    }}
                  >
                    {plan.name}
                  </Button>
                ),
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop View */}
      <div className="grid grid-cols-4 gap-4 max-md:hidden">
        <div className="col-span-1 max-md:hidden"></div>

        {pricingPlans.map((plan, index) => (
          <div key={index} className="">
            <h3 className="mb-3 text-2xl font-semibold">{plan.name}</h3>
            <Button variant={plan.button.variant} className="" asChild>
              <Link href="/contact">
                {plan.button.text}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const FeatureSections = ({ selectedPlan }: { selectedPlan: number }) => (
  <>
    {comparisonFeatures.map((section, sectionIndex) => (
      <div key={sectionIndex} className="">
        <div className="border-primary/40 border-b py-4">
          <h3 className="text-lg font-semibold">{section.category}</h3>
        </div>
        {section.features.map((feature, featureIndex) => (
          <div
            key={featureIndex}
            className="text-foreground grid grid-cols-2 font-medium max-md:border-b md:grid-cols-4"
          >
            <span className="inline-flex items-center py-4">
              {feature.name}
            </span>
            {/* Mobile View - Only Selected Plan */}
            <div className="md:hidden">
              <div className="flex items-center gap-1 py-4 md:border-b">
                {renderFeatureValue(
                  [feature.free, feature.startup, feature.enterprise][
                    selectedPlan
                  ],
                )}
              </div>
            </div>
            {/* Desktop View - All Plans */}
            <div className="hidden md:col-span-3 md:grid md:grid-cols-3 md:gap-4">
              {[feature.free, feature.startup, feature.enterprise].map(
                (value, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 border-b py-4"
                  >
                    {renderFeatureValue(value)}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    ))}
  </>
);
