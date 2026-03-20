import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kocluk Platformu",
  description: "Ogrenci takip ve egitim koclugu platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

