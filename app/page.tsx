"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(currentUserId ? "/discover" : "/intro");
  }, [hydrated, currentUserId, router]);

  return (
    <div className="text-center py-32 text-anu-navy/60">
      Loading courseMatch…
    </div>
  );
}
