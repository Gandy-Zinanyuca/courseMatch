"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function CoursesPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) {
      router.replace("/studyGroups");
    }
  }, [hydrated, router]);

  return null;
}
