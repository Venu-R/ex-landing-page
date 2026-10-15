import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Source and overview",
  description: "Purpose: preserve the visible landing-page copy in an editable document. The Figma REST response remains the source of truth for geometry, typography, colors, imagery, icons, and layout.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
