import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { parseQuotePatch } from "@/application/records";
import { deleteQuote, getQuote, updateQuote } from "@/infrastructure/quote-store";

export const dynamic = "force-dynamic";

export const GET = withAuth("quotes.read", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    return NextResponse.json({ quote: await getQuote(id) });
  });
});

export const PATCH = withAuth("quotes.write", async (req: NextRequest, user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    const quote = await updateQuote(id, parseQuotePatch(await readJson(req)), user);
    return NextResponse.json({ quote });
  });
});

export const DELETE = withAuth("quotes.delete", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    await deleteQuote(id);
    return NextResponse.json({ ok: true });
  });
});
