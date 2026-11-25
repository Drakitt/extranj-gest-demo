import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { parseFollowUpCreate } from "@/application/records";
import { createFollowUp, getQuote } from "@/infrastructure/quote-store";

export const dynamic = "force-dynamic";

export const GET = withAuth("followUps.read", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    const quote = await getQuote(id);
    return NextResponse.json({ followUps: quote.followUps });
  });
});

export const POST = withAuth("followUps.write", async (req: NextRequest, user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    const quote = await createFollowUp(id, parseFollowUpCreate(await readJson(req)), user);
    return NextResponse.json({ quote }, { status: 201 });
  });
});
