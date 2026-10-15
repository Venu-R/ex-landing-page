import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contact our sales team | OpenAI",
  description:
    "Get acquainted with OpenAI, explore use cases for your team, and discuss pricing options.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
