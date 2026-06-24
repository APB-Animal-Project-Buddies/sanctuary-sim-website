import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanctuary — a cozy animal care game",
  description:
    "Take in rescued animals, nurse them back to health, and build a sanctuary that becomes their forever home. Join the waitlist.",
  openGraph: {
    title: "Sanctuary — a cozy animal care game",
    description:
      "Take in rescued animals, nurse them back to health, and build a sanctuary that becomes their forever home.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz@0,6..72;1,6..72&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
