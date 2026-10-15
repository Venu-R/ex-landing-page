import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discord Help Center",
  description: "Find answers and support for everything Discord.",
  openGraph: {
    title: "Discord Help Center",
    description: "Find answers and support for everything Discord.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
