import { NextRequest, NextResponse } from "next/server";
import { handle, readJson, withAuth } from "@/infrastructure/auth/guard";
import { getPrisma } from "@/infrastructure/prisma";
import { parseServiceInput } from "@/application/records";
import type { ServiceDto } from "@/types/demo";
import { Prisma } from "@prisma/client";

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

export const GET = withAuth("services.read", async () => {
  return handle(async () => {
    const services = await getPrisma().service.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ services: services.map(toService) });
  });
});

export const POST = withAuth("services.write", async (req: NextRequest) => {
  return handle(async () => {
    const input = parseServiceInput(await readJson(req));
    const service = await getPrisma().service.create({
      data: {
        name: input.name,
        description: input.description,
        price: input.price.toFixed(2),
        taxRate: input.taxRate.toFixed(2),
        isActive: input.isActive,
      },
    });
    return NextResponse.json({ service: toService(service) }, { status: 201 });
  });
});
