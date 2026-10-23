import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoodCart — Local supermarket offers",
  description: "Browse current offers from supermarkets near you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
