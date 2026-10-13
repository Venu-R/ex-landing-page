import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@bdmg/ui/styles/page.css";
import "./design.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Example Landing Page",
  description: "Generated with the BDMG landing-page generator."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
