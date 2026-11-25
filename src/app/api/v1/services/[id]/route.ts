import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { getPrisma } from "@/infrastructure/prisma";
import { LookupError } from "@/application/input-error";
import { parseServicePatch } from "@/application/records";
import type { ServiceDto } from "@/types/demo";

export const dynamic = "force-dynamic";

function money(value: Prisma.Decimal): number {
  return Number(value.toString());
}

function toService(service: {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  taxRate: Prisma.Decimal;
  isActive: boolean;
}): ServiceDto {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: money(service.price),
    taxRate: money(service.taxRate),
    isActive: service.isActive,
  };
}

export const PATCH = withAuth("services.write", async (req: NextRequest, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    const existing = await getPrisma().service.findUnique({ where: { id } });
    if (!existing) throw new LookupError("El servicio no existe.");
    const patch = parseServicePatch(await readJson(req));
    const service = await getPrisma().service.update({
      where: { id },
      data: {
        name: patch.name,
        description: patch.description,
        price: patch.price === undefined ? undefined : patch.price.toFixed(2),
        taxRate: patch.taxRate === undefined ? undefined : patch.taxRate.toFixed(2),
        isActive: patch.isActive,
      },
    });
    return NextResponse.json({ service: toService(service) });
  });
});

export const DELETE = withAuth("services.delete", async (_req, _user, context) => {
  return handle(async () => {
    const { id } = await context.params;
    const existing = await getPrisma().service.findUnique({ where: { id } });
    if (!existing) throw new LookupError("El servicio no existe.");
    await getPrisma().service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });
});
