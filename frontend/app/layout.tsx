import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google"; // Import fonts
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: "DOCIT - Upload it. Understand it. Act on it.",
  description: "Automated Document Management System enhanced with AI intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, caveat.variable, "antialiased font-sans bg-[#FDFBF7] text-neutral-900 selection:bg-yellow-200")}>
        {children}
      </body>
    </html>
  );
}
