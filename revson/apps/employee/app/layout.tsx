import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@revson/shared";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Revson — Team",
  description: "Your shifts, pay, and tasks in one place."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
