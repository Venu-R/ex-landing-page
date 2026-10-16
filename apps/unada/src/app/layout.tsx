import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNADA. | Next-Gen Software Services",
  description: "Next-gen software services to businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
