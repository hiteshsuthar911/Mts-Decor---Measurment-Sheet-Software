import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const About = () => {
  return (
    <section className="container mt-10 flex max-w-5xl flex-col-reverse gap-8 md:mt-14 md:gap-14 lg:mt-20 lg:flex-row lg:items-end">
      {/* Images Left - Text Right */}
      <div className="flex flex-col gap-8 lg:gap-16 xl:gap-20">
        <ImageSection
          images={[
            { src: "/founder_madanlal.jpg", alt: "Madanlal T Suthar - Co-Founder" },
            { src: "/founder_jagdish.jpg", alt: "Jagdish Suthar - Co-Founder" },
          ]}
          className="xl:-translate-x-10"
        />

        <TextSection
          title="Leadership & Heritage"
          paragraphs={[
            "MTS DECOR was established under the visionary leadership of Madanlal T Suthar and Jagdish Suthar. Rooted in deep carpentry and civil engineering heritage, our contracting firm has executed premier commercial and residential spaces across India.",
            "Our software was born out of direct necessity on active jobsites: we wanted every civil contractor, interior designer, and site supervisor to have a single, dispute-free source of truth for measurements and site progress.",
            "Today, MTS DECOR software empowers contractors to turn raw site dimensions into clean, formula-backed workbooks and verifiable progress milestones in minutes.",
          ]}
          ctaButton={{
            href: "/contact",
            text: "Get in touch with us",
          }}
        />
      </div>

      {/* Text Left - Images Right */}
      <div className="flex flex-col gap-8 lg:gap-16 xl:gap-20">
        <TextSection
          paragraphs={[
            "Every feature in the MTS DECOR system reflects real-world contracting challenges. From complex L-shaped room perimeters and ceiling beam drops to multi-layer door jamb deductions, our system automates the calculations that traditionally consumed hours of manual math.",
            "We believe that when measurements are transparent and site progress is documented with clear photos and milestone sign-offs, contractors get paid faster, architects stay informed, and clients experience zero friction.",
          ]}
        />
        <ImageSection
          images={[
            { src: "/about/3.webp", alt: "Site execution and planning" },
            { src: "/about/4.webp", alt: "Contractor collaboration" },
          ]}
          className="hidden lg:flex xl:translate-x-10"
        />
      </div>
    </section>
  );
};

export default About;

interface ImageSectionProps {
  images: { src: string; alt: string }[];
  className?: string;
}

export function ImageSection({ images, className }: ImageSectionProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {images.map((image, index) => (
        <div
          key={index}
          className="relative aspect-[2/1.5] overflow-hidden rounded-2xl"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface TextSectionProps {
  title?: string;
  paragraphs: string[];
  ctaButton?: {
    href: string;
    text: string;
  };
}

export function TextSection({
  title,
  paragraphs,
  ctaButton,
}: TextSectionProps) {
  return (
    <section className="flex-1 space-y-4 text-lg md:space-y-6">
      {title && <h2 className="text-foreground text-4xl">{title}</h2>}
      <div className="text-muted-foreground max-w-xl space-y-6">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {ctaButton && (
        <div className="mt-8">
          <Link href={ctaButton.href}>
            <Button size="lg">{ctaButton.text}</Button>
          </Link>
        </div>
      )}
    </section>
  );
}
