import type { Metadata } from "next";
import { DM_Sans, Shippori_Mincho, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { DevSwitcher } from "@/components/dev/DevSwitcher";
import { ToastHost } from "@/components/ui/Toast";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-shippori",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "courseMatch — find classmates at ANU",
  description:
    "See who's in your labs and tutorials, find classmates in other sessions, and swap your timetable to be where your people are.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${shippori.variable} ${jetbrains.variable} min-h-screen`}
        suppressHydrationWarning
      >
        <TopNav />
        <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
        <DevSwitcher />
        <ToastHost />
      </body>
    </html>
  );
}
