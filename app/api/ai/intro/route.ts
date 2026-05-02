import { NextRequest, NextResponse } from "next/server";
import { introMessage } from "@/lib/claude";
import type { SharedSession, User } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { me, other, shared } = (await req.json()) as {
      me: User;
      other: User;
      shared: SharedSession[];
    };
    if (!me || !other) {
      return NextResponse.json({ error: "missing me/other" }, { status: 400 });
    }
    const message = await introMessage(me, other, shared ?? []);
    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({
      message: "Hey — we share some courses, wanted to say hi.",
    });
  }
}
