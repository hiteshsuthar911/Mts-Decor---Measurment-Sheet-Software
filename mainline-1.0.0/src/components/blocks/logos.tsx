import Marquee from "react-fast-marquee";

import { cn } from "@/lib/utils";

type Company = {
  name: string;
  tagline: string;
  shortCode: string;
};

export const Logos = () => {
  const topRowCompanies: Company[] = [
    { name: "L&T Construction", tagline: "Civil Infrastructure", shortCode: "L&T" },
    { name: "Shapoorji Pallonji", tagline: "Turnkey Contracting", shortCode: "SP" },
    { name: "Oberoi Realty", tagline: "Luxury Residences", shortCode: "OR" },
    { name: "Godrej Properties", tagline: "Urban Developments", shortCode: "GP" },
  ];

  const bottomRowCompanies: Company[] = [
    { name: "Tata Projects", tagline: "Industrial & Civil", shortCode: "TP" },
    { name: "Lodha Luxury", tagline: "High-Rise Fitouts", shortCode: "LD" },
    { name: "DLF Infrastructure", tagline: "Commercial Towers", shortCode: "DLF" },
    { name: "Sobha Turnkey", tagline: "Master Craftsmanship", shortCode: "SB" },
    { name: "Hiranandani Group", tagline: "Architectural Projects", shortCode: "HG" },
  ];

  return (
    <section className="pb-24 lg:pb-28 overflow-hidden">
      <div className="container space-y-10 lg:space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl lg:text-3xl text-foreground">
            Trusted by Leading Contractors, Architects & Developers
          </h2>
          <p className="text-muted-foreground font-normal text-sm sm:text-base mt-2">
            Powering on-site measurement sheets, RA billing, and site progress audits across India&apos;s landmark projects.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-5">
          {/* Top row - 4 companies */}
          <LogoRow companies={topRowCompanies} gridClassName="grid-cols-2 md:grid-cols-4" />

          {/* Bottom row - 5 companies */}
          <LogoRow
            companies={bottomRowCompanies}
            gridClassName="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
            direction="right"
          />
        </div>
      </div>
    </section>
  );
};

type LogoRowProps = {
  companies: Company[];
  gridClassName: string;
  direction?: "left" | "right";
};

const LogoRow = ({ companies, gridClassName, direction }: LogoRowProps) => {
  return (
    <>
      {/* Desktop static grid */}
      <div className="hidden md:block w-full max-w-5xl">
        <div
          className={cn(
            "grid items-center justify-items-center gap-4",
            gridClassName,
          )}
        >
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-all hover:border-primary/40 w-full justify-center group"
            >
              <div className="size-8 rounded-lg bg-background border flex items-center justify-center font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors shadow-2xs">
                {company.shortCode}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {company.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {company.tagline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile marquee version */}
      <div className="md:hidden w-full">
        <Marquee direction={direction} pauseOnHover speed={35}>
          {companies.map((company, index) => (
            <div
              key={index}
              className="mx-2 flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/40"
            >
              <div className="size-6 rounded bg-background border flex items-center justify-center font-mono font-bold text-[10px] text-foreground">
                {company.shortCode}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground">
                  {company.name}
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  {company.tagline}
                </span>
              </div>
            </div>
          ))}
        </Marquee>
      </div>
    </>
  );
};
