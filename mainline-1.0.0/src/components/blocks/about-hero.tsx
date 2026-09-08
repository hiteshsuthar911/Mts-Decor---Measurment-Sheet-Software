import { DashedLine } from "@/components/dashed-line";

const stats = [
  {
    value: "30+ Yrs",
    label: "Field Heritage",
  },
  {
    value: "10K+",
    label: "Sheets Generated",
  },
  {
    value: "500+",
    label: "Delivered Sites",
  },
  {
    value: "99.9%",
    label: "Billing Accuracy",
  },
];

export function AboutHero() {
  return (
    <section className="">
      <div className="container flex max-w-5xl flex-col justify-between gap-8 md:gap-20 lg:flex-row lg:items-center lg:gap-24 xl:gap-24">
        <div className="flex-[1.5]">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1 text-xs font-mono font-medium text-muted-foreground mb-4">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            CRAFTED BY CONTRACTORS FOR CONTRACTORS
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
            Precision Built From 30+ Years On Site
          </h1>

          <p className="text-muted-foreground mt-5 text-xl md:text-2xl lg:text-3xl leading-snug">
            MTS DECOR was born on active construction sites to eliminate measurement chaos.
          </p>

          <p className="text-muted-foreground mt-8 hidden max-w-lg space-y-6 text-base md:text-lg text-balance md:block lg:mt-12 leading-relaxed">
            Founded by veteran master contractor <strong>Madanlal T Suthar</strong> and operations director <strong>Jagdish Suthar</strong>, MTS DECOR unites three decades of civil contracting craftsmanship with modern digital software.
            <br />
            <br />
            We built this software system because contractors and interior designers deserve tools as meticulous and dedicated as they are. No more lost diary notes, no more dispute-ridden Excel sheets, and no more payment bottlenecks. Just absolute measurement accuracy and real-time site clarity.
          </p>
        </div>

        <div
          className={`relative flex flex-1 flex-col justify-center gap-3 pt-10 lg:pt-0 lg:pl-10`}
        >
          <DashedLine
            orientation="vertical"
            className="absolute top-0 left-0 max-lg:hidden"
          />
          <DashedLine
            orientation="horizontal"
            className="absolute top-0 lg:hidden"
          />
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <div className="font-display text-4xl tracking-wide md:text-5xl">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
