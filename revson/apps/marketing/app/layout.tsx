import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@revson/shared";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Revson Services — Your shop's paperwork runs itself",
  description:
    "Leases, payroll logs, hiring, reviews — 30 sec AI workflows, saved forever. Built for barbers, salons, auto, cafes."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
