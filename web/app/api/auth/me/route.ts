import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    username:
      (user.user_metadata?.username as string | undefined) ??
      user.email?.split("@")[0] ??
      "user",
    isAdmin: isAdmin(user),
  });
}
