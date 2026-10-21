import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PMC Production Management System",
    template: "%s | PMC Production",
  },
  description:
    "Sistem manajemen dan monitoring produksi PMC untuk mengelola data produksi, target, produk, area, shift, dan pencapaian produksi secara terintegrasi.",
  applicationName: "PMC Production",
  keywords: [
    "PMC Production",
    "Production Management System",
    "Production Monitoring",
    "Production Target",
    "Next.js",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}