"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Search, User2 } from "lucide-react";
import { useStore } from "@/lib/store";

const items = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile", label: "My profile", icon: User2 },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUserId = useStore((s) => s.currentUserId);
  const resetDemo = useStore((s) => s.resetDemo);
  const onboarding = pathname?.startsWith("/onboarding");

  function handleLogout() {
    resetDemo();
    router.replace("/onboarding");
  }

  return (
    <header className="bg-white border-b border-[#E0D8CC]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-anu-navy tracking-tight">
          courseMatch
        </Link>
        {currentUserId && !onboarding && (
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition ${
                      active
                        ? "bg-terra text-white"
                        : "text-anu-navy/60 hover:text-anu-navy hover:bg-anu-navy/5"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full text-sm border border-[#E0D8CC] text-anu-navy/70 hover:text-terra hover:border-terra transition"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
