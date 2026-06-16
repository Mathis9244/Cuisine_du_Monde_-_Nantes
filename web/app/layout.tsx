import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeNoFlashScript } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import PWARegister from "@/components/PWARegister";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cuisine du Monde - Nantes",
  description:
    "Découvrez et notez les restaurants du monde à Nantes. Le cercle des explorateurs culinaires.",
  applicationName: "Cuisine du Monde - Nantes",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
    languages: {
      fr: "/",
      en: "/",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "Cuisine du Monde - Nantes",
    description:
      "Découvrez et notez les restaurants du monde à Nantes. Le cercle des explorateurs culinaires.",
    type: "website",
    url: "/",
    siteName: "Cuisine du Monde - Nantes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        {/* Filtre SVG utilisé par GooeyNav */}
        <svg
          style={{ visibility: "hidden", position: "absolute" }}
          width="0"
          height="0"
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
        >
          <defs>
            <filter id="gooey">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        <ThemeProvider>
          <I18nProvider>
            {children}
            <PWARegister />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
