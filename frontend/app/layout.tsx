import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeforestWatch — Satellite Deforestation Monitor",
  description:
    "AI-powered deforestation monitoring using satellite imagery and drone NDVI analysis. Track vegetation changes, detect deforestation, and receive email alerts.",
  keywords: "deforestation, satellite monitoring, NDVI, drone imagery, vegetation analysis, earth engine",
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
      </head>
      <body>{children}</body>
    </html>
  );
}
