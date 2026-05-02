"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, User2, GraduationCap } from "lucide-react";
import { useStore } from "@/lib/store";

const items = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "My profile", icon: User2 },
];

export function TopNav() {
  const pathname = usePathname();
  const currentUserId = useStore((s) => s.currentUserId);
  const onboarding = pathname?.startsWith("/onboarding");

  return (
    <header className="bg-anu-navy text-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <GraduationCap className="text-anu-goldLight" size={22} />
          <span className="text-lg">courseMatch</span>
          <span className="text-xs text-anu-goldLight/80 font-normal hidden sm:inline">· ANU</span>
        </Link>
        {currentUserId && !onboarding && (
          <nav className="flex items-center gap-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition ${
                    active
                      ? "bg-anu-goldLight text-anu-navy"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
