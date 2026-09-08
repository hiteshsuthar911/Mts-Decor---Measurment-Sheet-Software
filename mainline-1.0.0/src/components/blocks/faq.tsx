import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Measurement & Calculations",
    questions: [
      {
        question: "How does MTS DECOR calculate deductions for doors, windows, and openings?",
        answer:
          "When measuring walls, ceilings, or partitions, you can enter deduction sub-items for openings. The engine automatically calculates the gross area, subtracts the deduction quantities according to standard civil contracting practices (IS 1200 / CPWD norms), and displays the exact net billable quantity.",
      },
      {
        question: "Can I export measurement sheets to Microsoft Excel (.xlsx) and PDF?",
        answer:
          "Yes. With one click, MTS DECOR exports multi-sheet Excel workbooks complete with active formula cells, itemized area breakdowns, and client summary sheets. You can also export high-resolution branded PDF reports.",
      },
      {
        question: "Does the system support multiple units of measurement (Sq.Ft, Sq.M, Rft, Cum)?",
        answer:
          "Yes. MTS DECOR seamlessly handles Metric and Imperial units including Square Feet, Square Meters, Running Feet, Running Meters, Cubic Feet, Cubic Meters, and piece-based counts with instant unit conversions.",
      },
    ],
  },
  {
    title: "Construction Site Progress",
    questions: [
      {
        question: "How does the Construction Site Progress Report work on site?",
        answer:
          "Site supervisors can record daily task completions, worker headcounts, milestone percentages, and attach high-resolution progress photos directly from mobile phones. Daily progress logs roll up into weekly and monthly executive summaries for architects and owners.",
      },
      {
        question: "Can clients or architects sign off on completed milestones?",
        answer:
          "Yes. Progress milestones can be flagged for review, allowing clients and PMC consultants to verify photographic evidence and approve stages before releasing Running Account (RA) payments.",
      },
    ],
  },
  {
    title: "Billing & Cloud Security",
    questions: [
      {
        question: "How are Running Account (RA) bills generated?",
        answer:
          "MTS DECOR pulls measured quantities from your verified site sheets, applies BoQ item rates, adds configured GST/taxes, and automatically deducts retention amounts and mobilization advances to produce professional, audit-ready bills.",
      },
      {
        question: "Can multiple supervisors work on different project areas simultaneously?",
        answer:
          "Yes. MTS DECOR supports multi-user collaboration. Supervisors can simultaneously enter measurements for different floors or rooms without overwriting each other's data.",
      },
    ],
  },
];

export const FAQ = ({
  headerTag = "h2",
  className,
  className2,
}: {
  headerTag?: "h1" | "h2";
  className?: string;
  className2?: string;
}) => {
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container max-w-5xl">
        <div className={cn("mx-auto grid gap-16 lg:grid-cols-2", className2)}>
          <div className="space-y-4">
            {headerTag === "h1" ? (
              <h1 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
                Got Questions?
              </h1>
            ) : (
              <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
                Got Questions?
              </h2>
            )}
            <p className="text-muted-foreground max-w-md leading-snug lg:mx-auto">
              If you can't find what you're looking for,{" "}
              <Link href="/contact" className="underline underline-offset-4">
                get in touch
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-6 text-start">
            {categories.map((category, categoryIndex) => (
              <div key={category.title} className="">
                <h3 className="text-muted-foreground border-b py-4">
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, i) => (
                    <AccordionItem key={i} value={`${categoryIndex}-${i}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
