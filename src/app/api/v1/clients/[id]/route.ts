import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { getPrisma } from "@/infrastructure/prisma";
import { LookupError } from "@/application/input-error";
import { parseClientInput } from "@/application/records";
import type { ClientDto } from "@/types/demo";

export const dynamic = "force-dynamic";

function toClient(client: {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}): ClientDto {
  return client;
}

async function requireClient(id: string) {
  const client = await getPrisma().client.findUnique({ where: { id } });
  if (!client) throw new LookupError("El cliente no existe.");
  return client;
}

export const GET = withAuth("clients.read", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    return NextResponse.json({ client: toClient(await requireClient(id)) });
  });
});

export const PATCH = withAuth("clients.write", async (req: NextRequest, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    await requireClient(id);
    const input = parseClientInput(await readJson(req));
    const client = await getPrisma().client.update({ where: { id }, data: input });
    return NextResponse.json({ client: toClient(client) });
  });
});

export const DELETE = withAuth("clients.delete", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    await requireClient(id);
    await getPrisma().client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });
});
