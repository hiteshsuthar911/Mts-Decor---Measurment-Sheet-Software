import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Footer() {
  const navigation = [
    { name: "Product", href: "/#feature-modern-teams" },
    { name: "About Us", href: "/about" },
    { name: "Pricing", href: "/pricing" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
  ];

  const social = [
    { name: "Xwitter", href: "#" },
    { name: "LinkedIn", href: "#" },
  ];

  const legal = [{ name: "Privacy Policy", href: "/privacy" }];

  return (
    <footer className="flex flex-col items-center gap-14 pt-28 lg:pt-32">
      <div className="container space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-mono font-medium text-muted-foreground mb-1">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          MASTER CRAFTSMANSHIP • DIGITAL EFFICIENCY
        </div>
        <h2 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
          Ready to Modernize Your Site Measurements?
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl leading-relaxed text-balance">
          MTS DECOR is the fit-for-purpose software built for civil contractors and interior designers to ensure zero calculation errors and effortless client billing.
        </p>
        <div className="pt-2">
          <Button size="lg" className="font-semibold shadow-md" asChild>
            <Link href="/contact">
              Schedule Free Site Demo
            </Link>
          </Button>
        </div>
      </div>

      <nav className="container flex flex-col items-center gap-4">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="font-medium transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
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

      <div className="mt-8 w-full border-t border-border/40 pt-10 pb-6 text-center select-none">
        <div className="container">
          <span className="font-display font-black tracking-tighter text-4xl sm:text-6xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-foreground/25 to-foreground/5 dark:from-foreground/20 dark:to-foreground/0 block">
            MTS DECOR
          </span>
        </div>
      </div>
    </footer>
  );
}
