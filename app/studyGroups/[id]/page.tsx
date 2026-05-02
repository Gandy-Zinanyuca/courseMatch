"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { StudyGroupDetails } from "@/components/studyGroups/StudyGroupDetails";

export default function StudyGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = Array.isArray(params.id) ? params.id[0] : params.id;

  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const group = useStore((s) =>
    groupId ? s.studyGroups.find((item) => item.id === groupId) : undefined,
  );

  useEffect(() => {
    if (hydrated && !me) {
      router.replace("/onboarding");
    }
  }, [hydrated, me, router]);

  if (!me) return null;

  if (!group) {
    return (
      <div className="space-y-5">
        <Link
          href="/studyGroups"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-anu-navy"
        >
          <ArrowLeft size={14} /> Back to study groups
        </Link>
        <div className="rounded-3xl border border-[#E0D8CC] bg-white p-8 text-center text-muted">
          No study group found for this link.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/studyGroups"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-anu-navy"
      >
        <ArrowLeft size={14} /> Back to study groups
      </Link>
      <StudyGroupDetails group={group} />
    </div>
  );
}
