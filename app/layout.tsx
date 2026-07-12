import type { Metadata } from "next";
import "./globals.css";
import { Google_Sans_Flex, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "TransitOps — Smart Transport Operations Platform",
  description:
    "Unified fleet management for drivers, vehicles, trips, maintenance, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="h-full">{children}</body>
    </html>
  );
}

