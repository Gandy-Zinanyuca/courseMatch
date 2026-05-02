import { NextRequest, NextResponse } from "next/server";
import { blurbForPair } from "@/lib/claude";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { me, other } = (await req.json()) as { me: User; other: User };
    if (!me || !other) {
      return NextResponse.json({ error: "missing me/other" }, { status: 400 });
    }
    const blurb = await blurbForPair(me, other);
    return NextResponse.json({ blurb });
  } catch (e: any) {
    return NextResponse.json({ blurb: "Worth saying hi to" });
  }
}
