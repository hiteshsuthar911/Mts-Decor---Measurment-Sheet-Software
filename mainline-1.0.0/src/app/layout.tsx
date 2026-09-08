import { Inter } from "next/font/google";
import localFont from "next/font/local";

import type { Metadata } from "next";

import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";
import { StyleGlideProvider } from "@/components/styleglide-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "@/styles/globals.css";

const dmSans = localFont({
  src: [
    {
      path: "../../fonts/dm-sans/DMSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../fonts/dm-sans/DMSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/dm-sans/DMSans-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mtsdecor.com"),
  title: {
    default: "MTS DECOR — Civil Contractor & Interior Designer Measurement Software",
    template: "%s | MTS DECOR",
  },
  description:
    "High-precision on-site measurement sheets, construction site progress reports, automated RA billing, and Excel exports built for civil contractors & interior designers.",
  keywords: [
    "MTS DECOR",
    "Measurement Sheet Software",
    "Civil Contractor Software",
    "Interior Designer Measurement",
    "Construction Site Progress Report",
    "RA Billing Software",
    "BoQ Estimation",
    "Excel Measurement Sheet",
  ],
  authors: [{ name: "MTS DECOR" }],
  creator: "MTS DECOR",
  publisher: "MTS DECOR",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/mtsdecor.png" },
      { url: "/logo.png" },
    ],
    apple: [{ url: "/mtsdecor.png" }],
    shortcut: [{ url: "/mtsdecor.png" }],
  },
  openGraph: {
    title: "MTS DECOR — Civil Contractor & Interior Designer Measurement Software",
    description:
      "High-precision on-site measurement sheets, construction site progress reports, automated RA billing, and Excel exports built for civil contractors & interior designers.",
    siteName: "MTS DECOR",
    images: [
      {
        url: "/mtsdecor.png",
        width: 800,
        height: 600,
        alt: "MTS DECOR Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MTS DECOR — Civil Contractor & Interior Designer Measurement Software",
    description:
      "High-precision on-site measurement sheets, construction site progress reports, automated RA billing, and Excel exports built for civil contractors & interior designers.",
    images: ["/mtsdecor.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${dmSans.variable} ${inter.variable} antialiased overflow-x-hidden w-full relative min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <StyleGlideProvider />
          <Navbar />
          <main className="w-full overflow-x-hidden">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
