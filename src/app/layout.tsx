import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk";
import "./globals.css";
export const metadata: Metadata = {
  title: "OpenRouter Model Evaluation Kit",
  description:
    "Local experiments with real model outputs, latency, tokens and cost.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
