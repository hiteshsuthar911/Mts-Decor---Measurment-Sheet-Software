"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    label: "Features",
    href: "/#features",
    dropdownItems: [
      {
        title: "Civil & Interior Measurement System",
        href: "/#features",
        description:
          "Hierarchical L×W×H measurement sheets, auto-deductions & multi-sheet Excel export",
      },
      {
        title: "Construction Site Progress Report",
        href: "/#features",
        description:
          "Daily site progress, contractor milestones, task tracking & audit photo documentation",
      },
      {
        title: "Contractor Project & Cost Workflow",
        href: "/#contractor-workflow",
        description:
          "Area-wise BoQ, automated RA billing, contractor rate calculation & cloud sync",
      },
    ],
  },
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <section
      className={cn(
        "bg-background/85 absolute left-1/2 z-50 w-[min(94%,760px)] -translate-x-1/2 rounded-4xl border backdrop-blur-md shadow-sm transition-all duration-300",
        "top-3 sm:top-5 lg:top-10",
      )}
    >
      <div className="flex items-center justify-between px-3.5 py-2 sm:px-6 sm:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <Image
            src="/mtsdecor.png"
            alt="MTS DECOR Logo"
            width={38}
            height={38}
            className="size-8 sm:size-10 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="font-display font-black tracking-tight text-foreground leading-none text-base sm:text-xl">
              MTS DECOR
            </span>
            <span className="text-[9px] sm:text-[11px] font-mono font-semibold tracking-wider text-primary uppercase mt-0.5">
              Measurement Software
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="max-lg:hidden">
          <NavigationMenuList>
            {ITEMS.map((link) =>
              link.dropdownItems ? (
                <NavigationMenuItem key={link.label} className="">
                  <NavigationMenuTrigger className="data-[state=open]:bg-accent/50 bg-transparent! px-1.5">
                    {link.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="w-[400px] space-y-2 p-4">
                      {link.dropdownItems.map((item) => (
                        <li key={item.title}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={item.href}
                              className="group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none"
                            >
                              <div className="space-y-1.5 transition-transform duration-300 group-hover:translate-x-1">
                                <div className="text-sm leading-none font-medium">
                                  {item.title}
                                </div>
                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                  {item.description}
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={link.label} className="">
                  <Link
                    href={link.href}
                    className={cn(
                      "relative bg-transparent px-1.5 text-sm font-medium transition-opacity hover:opacity-75",
                      pathname === link.href && "text-muted-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />
          <Link href="/contact" className="hidden sm:inline-flex">
            <Button size="sm" className="font-semibold shadow-xs">
              <span className="relative z-10">Book Site Demo</span>
            </Button>
          </Link>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="text-muted-foreground relative flex size-8 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open main menu</span>
            <div className="relative w-[18px] h-[14px]">
              <span
                aria-hidden="true"
                className={`absolute left-0 block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out ${isMenuOpen ? "top-[6px] rotate-45" : "top-0"}`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-0 top-[6px] block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out ${isMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                aria-hidden="true"
                className={`absolute left-0 block h-0.5 w-full rounded-full bg-current transition duration-300 ease-in-out ${isMenuOpen ? "top-[6px] -rotate-45" : "top-[12px]"}`}
              />
            </div>
          </button>
        </div>
      </div>

      {/*  Mobile Menu Navigation */}
      <div
        className={cn(
          "bg-background/95 fixed inset-x-2 sm:inset-x-0 top-[calc(100%+0.75rem)] flex flex-col rounded-2xl border p-5 shadow-xl backdrop-blur-xl transition-all duration-300 ease-in-out lg:hidden max-h-[82vh] overflow-y-auto",
          isMenuOpen
            ? "visible translate-y-0 opacity-100 pointer-events-auto"
            : "invisible -translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        <nav className="divide-border flex flex-1 flex-col divide-y">
          {ITEMS.map((link) =>
            link.dropdownItems ? (
              <div key={link.label} className="py-3.5 first:pt-0 last:pb-0">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === link.label ? null : link.label,
                    )
                  }
                  className="text-foreground hover:text-primary flex w-full items-center justify-between text-base font-semibold transition-colors"
                >
                  {link.label}
                  <ChevronRight
                    className={cn(
                      "size-4 transition-transform duration-200 text-muted-foreground",
                      openDropdown === link.label ? "rotate-90 text-primary" : "",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openDropdown === link.label
                      ? "mt-3 max-h-[1000px] opacity-100"
                      : "max-h-0 opacity-0",
                  )}
                >
                  <div className="bg-muted/50 space-y-2.5 rounded-xl p-3 border border-border/50">
                    {link.dropdownItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="group hover:bg-accent block rounded-lg p-2 transition-colors"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenDropdown(null);
                        }}
                      >
                        <div className="transition-transform duration-200 group-hover:translate-x-1">
                          <div className="text-foreground font-semibold text-sm">
                            {item.title}
                          </div>

                          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-foreground hover:text-primary py-3.5 text-base font-semibold transition-colors first:pt-0 last:pb-0",
                  pathname === link.href && "text-primary font-bold",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Dedicated Mobile Demo CTA Button */}
        <div className="mt-4 pt-4 border-t border-border">
          <Link
            href="/contact"
            className="w-full block"
            onClick={() => setIsMenuOpen(false)}
          >
            <Button className="w-full justify-center font-bold shadow-md py-5 text-sm gap-2" size="lg">
              <span>Book Site Demo</span>
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
