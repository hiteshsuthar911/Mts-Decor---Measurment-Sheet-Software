import Image from "next/image";

const sectors = [
  {
    name: "Luxury Residences",
    company: "Villas & Penthouses",
    image: "/investors/1.webp",
  },
  {
    name: "Corporate Fitouts",
    company: "Grade-A Commercial Offices",
    image: "/investors/2.webp",
  },
  {
    name: "Retail Showrooms",
    company: "Boutiques & Retail Stores",
    image: "/investors/3.webp",
  },
  {
    name: "Hospitality & Leisure",
    company: "Hotels & Fine Dining",
    image: "/investors/4.webp",
  },
  {
    name: "Civil Architecture",
    company: "Turnkey Contracting",
    image: "/investors/5.webp",
  },
];

export function Investors() {
  return (
    <section className="container max-w-5xl py-12">
      <h2 className="text-foreground text-3xl md:text-4xl font-semibold tracking-tight">
        Project Sectors We Empower
      </h2>
      <p className="text-muted-foreground mt-2 max-w-xl text-base">
        Trusted across premier civil construction and interior contracting developments throughout India.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sectors.map((sector) => (
          <div key={sector.name} className="flex flex-col">
            <div className="overflow-hidden rounded-xl bg-muted/50 border p-1 mb-3">
              <Image
                src={sector.image}
                alt={sector.name}
                width={120}
                height={120}
                className="object-cover w-full h-auto rounded-lg aspect-square"
              />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{sector.name}</h3>
            <p className="text-muted-foreground text-xs">{sector.company}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
