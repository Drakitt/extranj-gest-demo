import { NextResponse } from "next/server";
import { withAuth } from "@/infrastructure/auth/guard";

export const dynamic = "force-dynamic";

export const GET = withAuth("clients.read", async (_req, user) => {
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});
