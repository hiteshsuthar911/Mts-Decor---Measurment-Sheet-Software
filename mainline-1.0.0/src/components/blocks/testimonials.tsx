import Image from "next/image";
import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { DashedLine } from "../dashed-line";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const items = [
  {
    quote: "MTS DECOR cut our measurement recording time by 70%. The automatic deduction feature alone saved us lakhs in plaster and paint overestimations.",
    author: "Rajesh Sharma",
    role: "Principal Contractor",
    company: "Apex Infra Projects, Mumbai",
    image: "/testimonials/amy-chase.webp",
  },
  {
    quote: "The Construction Site Progress Report gives our clients clear photographic proof of milestone completion. Billing approvals that took weeks now happen in 24 hours.",
    author: "Pooja Mehta",
    role: "Lead Interior Designer",
    company: "Studio Atelier Interiors",
    image: "/testimonials/jonas-kotara.webp",
  },
  {
    quote: "Our supervisors draft multi-room BoQs right from their mobile phones on site. The multi-sheet Excel export is identical to our corporate billing format.",
    author: "Vikram Rathore",
    role: "Managing Director",
    company: "Marwar Construction & Fitouts",
    image: "/testimonials/kevin-yam.webp",
  },
  {
    quote: "Running Account (RA) bills generated through MTS DECOR are transparent and dispute-free. Architects and clients praise the clear area calculations.",
    author: "Sunil Panchal",
    role: "Senior Civil Contractor",
    company: "SP Projects & Civil Works",
    image: "/testimonials/kundo-marta.webp",
  },
  {
    quote: "Replacing handwritten diaries with MTS DECOR across 14 simultaneous interior sites has completely transformed our margin control.",
    author: "Anand Kulkarni",
    role: "Project Head",
    company: "Metro Turnkey Interiors",
    image: "/testimonials/amy-chase.webp",
  },
];

export const Testimonials = ({
  className,
  dashedLineClassName,
}: {
  className?: string;
  dashedLineClassName?: string;
}) => {
  return (
    <>
      <section className={cn("overflow-hidden py-28 lg:py-32", className)}>
        <div className="container">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
              Trusted by Civil Contractors & Interior Designers
            </h2>
            <p className="text-muted-foreground max-w-lg leading-relaxed">
              Real feedback from project managers, master contractors, and interior designers who rely on MTS DECOR daily.
            </p>
            <Button variant="outline" className="shadow-md" asChild>
              <Link href="/about">
                Read About Our Contracting Legacy <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="relative mt-8 -mr-[max(3rem,calc((100vw-80rem)/2+3rem))] md:mt-12 lg:mt-20">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="">
                {items.map((testimonial, index) => (
                  <CarouselItem
                    key={index}
                    className="xl:basis-1/3.5 grow basis-4/5 sm:basis-3/5 md:basis-2/5 lg:basis-[28%] 2xl:basis-[24%]"
                  >
                    <Card className="bg-muted h-full overflow-hidden border-none">
                      <CardContent className="flex h-full flex-col p-0">
                        <div className="relative h-[288px] lg:h-[328px]">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.author}
                            fill
                            className="object-cover object-top"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between gap-10 p-6">
                          <blockquote className="font-display text-lg leading-none! font-medium md:text-xl lg:text-2xl">
                            {testimonial.quote}
                          </blockquote>
                          <div className="space-y-0.5">
                            <div className="text-primary font-semibold">
                              {testimonial.author}, {testimonial.role}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {testimonial.company}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="mt-8 flex gap-3">
                <CarouselPrevious className="bg-muted hover:bg-muted/80 static size-14.5 translate-x-0 translate-y-0 transition-colors [&>svg]:size-6 lg:[&>svg]:size-8" />
                <CarouselNext className="bg-muted hover:bg-muted/80 static size-14.5 translate-x-0 translate-y-0 transition-colors [&>svg]:size-6 lg:[&>svg]:size-8" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>
      <DashedLine
        orientation="horizontal"
        className={cn("mx-auto max-w-[80%]", dashedLineClassName)}
      />
    </>
  );
};
