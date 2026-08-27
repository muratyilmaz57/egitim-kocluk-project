import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FTY Koçluk",
    template: "%s · FTY Koçluk",
  },
  description: "Öğrenci gelişimini, çalışma planlarını ve koçluk sürecini tek yerde yönetin.",
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
