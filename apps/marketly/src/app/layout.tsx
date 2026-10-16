import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contact Marketly",
  description: "Get in touch with Marketly. We're here to assist you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
