import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { DevSwitcher } from "@/components/dev/DevSwitcher";
import { ToastHost } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "courseMatch — find classmates at ANU",
  description:
    "See who's in your labs and tutorials, find classmates in other sessions, and swap your timetable to be where your people are.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" suppressHydrationWarning>
        <TopNav />
        <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
        <DevSwitcher />
        <ToastHost />
      </body>
    </html>
  );
}
