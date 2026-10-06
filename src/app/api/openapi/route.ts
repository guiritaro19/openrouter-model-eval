import { NextRequest, NextResponse } from "next/server";
import { openApiDocument } from "@/lib/openapi";
import { assertLocal } from "@/lib/security";
export async function GET(request: NextRequest) {
  try {
    assertLocal(request);
    return NextResponse.json(openApiDocument);
  } catch {
    return NextResponse.json({ error: "Local access only." }, { status: 403 });
  }
}
