import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { parseFollowUpPatch } from "@/application/records";
import { updateFollowUp } from "@/infrastructure/quote-store";

export const dynamic = "force-dynamic";

export const PATCH = withAuth("followUps.write", async (req: NextRequest, user, context) => {
  return handle(async () => {
    const { id, followUpId } = await context.params;
    const quote = await updateFollowUp(id, followUpId, parseFollowUpPatch(await readJson(req)), user);
    return NextResponse.json({ quote });
  });
});
