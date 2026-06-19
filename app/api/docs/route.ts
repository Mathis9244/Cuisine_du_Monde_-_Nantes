import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { createSwaggerSpec } from "@/lib/swagger";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(createSwaggerSpec(isAdmin(user)));
}
