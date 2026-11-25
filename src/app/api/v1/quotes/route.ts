import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { parseQuoteCreate } from "@/application/records";
import { createQuote, listQuotes } from "@/infrastructure/quote-store";

export const dynamic = "force-dynamic";

export const GET = withAuth("quotes.read", async () => {
  return handle(async () => NextResponse.json({ quotes: await listQuotes() }));
});

export const POST = withAuth("quotes.write", async (req: NextRequest, user) => {
  return handle(async () => {
    const input = parseQuoteCreate(await readJson(req));
    const quote = await createQuote(input, user);
    return NextResponse.json({ quote }, { status: 201 });
  });
});
