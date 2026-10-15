import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instacart Ads — Landing Page Content",
  description: "This document organizes the visible text from the supplied design into page sections for the landing-page generation workflow. Copy is kept faithful to the design; visual assets and layout are represented in the Figma design JSON, not in this document.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
