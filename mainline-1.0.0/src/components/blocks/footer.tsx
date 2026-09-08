import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Footer() {
  const navigation = [
    { name: "Features", href: "/#features" },
    { name: "About Us", href: "/about" },
    { name: "Pricing", href: "/pricing" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
    {
      name: "Software App (Render)",
      href: "https://mts-decor-measurment-sheet-software.onrender.com",
      external: true,
    },
  ];

  const social = [
    { name: "Xwitter", href: "#" },
    { name: "LinkedIn", href: "#" },
  ];

  const legal = [{ name: "Privacy Policy", href: "/privacy" }];

  return (
    <footer className="flex flex-col items-center gap-12 pt-28 lg:pt-32">
      <div className="container space-y-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
          Ready to Modernize Your Site Measurements?
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed text-balance">
          MTS DECOR is the fit-for-purpose software built for civil contractors and interior designers to ensure zero calculation errors and effortless client billing.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="font-semibold shadow-md" asChild>
            <Link href="/contact">
              Schedule Free Site Demo
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="font-semibold shadow-md border-primary/30 text-primary gap-2" asChild>
            <a
              href="https://mts-decor-measurment-sheet-software.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Launch Software App</span>
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      <nav className="container flex flex-col items-center gap-4">
        {/* Render Live Portal Pill */}
        <div className="pb-1">
          <a
            href="https://mts-decor-measurment-sheet-software.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-1.5 text-xs font-bold transition-all shadow-xs group"
          >
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Software Portal on Render</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-6">
          {navigation.map((item) => (
            <li key={item.name}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium transition-opacity hover:opacity-75 inline-flex items-center gap-1 text-primary"
                >
                  {item.name} <ArrowUpRight className="size-3.5" />
                </a>
              ) : (
                <Link
                  href={item.href}
                  className="font-medium transition-opacity hover:opacity-75"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
          {social.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
              >
                {item.name} <ArrowUpRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {legal.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="text-muted-foreground text-sm transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs text-center">
          Copyright © {new Date().getFullYear()} MTS DECOR. All rights reserved. • Founded by Madanlal T Suthar & Jagdish Suthar
        </p>
      </nav>

      <div className="mt-8 w-full border-t border-border/40 pt-10 pb-6 text-center select-none overflow-hidden">
        <div className="w-full px-2">
          <span className="font-display font-black tracking-tighter text-6xl sm:text-8xl md:text-9xl lg:text-[13rem] xl:text-[16rem] 2xl:text-[19rem] leading-none text-transparent bg-clip-text bg-gradient-to-b from-primary/50 to-primary/10 dark:from-primary/45 dark:to-primary/5 block whitespace-nowrap">
            MTS DECOR
          </span>
        </div>
      </div>
    </footer>
  );
}
