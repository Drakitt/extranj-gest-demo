import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { getPrisma } from "@/infrastructure/prisma";
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
  return {
    id: client.id,
    name: client.name,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
  };
}

export const GET = withAuth("clients.read", async () => {
  return handle(async () => {
    const clients = await getPrisma().client.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ clients: clients.map(toClient) });
  });
});

export const POST = withAuth("clients.write", async (req: NextRequest) => {
  return handle(async () => {
    const input = parseClientInput(await readJson(req));
    const client = await getPrisma().client.create({ data: input });
    return NextResponse.json({ client: toClient(client) }, { status: 201 });
  });
});
