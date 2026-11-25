import "dotenv/config";
import { assertDemoDatabaseUrl } from "../src/infrastructure/db-guard";
import { hashPassword } from "../src/infrastructure/auth/crypto";
import { getPrisma } from "../src/infrastructure/prisma";

const CLIENTS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Taller Norte Demo",
    contactName: "Ana Ruiz Demo",
    email: "ana.ruiz@demo.local",
    phone: "600000001",
    notes: "Cliente ficticio para el recorrido de la demo.",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Estudio Lumina Demo",
    contactName: "Luis Pérez Demo",
    email: "luis.perez@demo.local",
    phone: "600000002",
    notes: "Cliente ficticio. No corresponde a una empresa real.",
  },
];

const SERVICES = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Visita de diagnóstico",
    description: "Servicio ficticio. El precio no incluye un impuesto real.",
    price: "80.00",
    taxRate: "21.00",
    isActive: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Mantenimiento mensual",
    description: "Servicio ficticio de cuota periódica.",
    price: "150.00",
    taxRate: "21.00",
    isActive: true,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Informe técnico",
    description: "Servicio ficticio inactivo. No debe entrar en presupuestos nuevos.",
    price: "45.00",
    taxRate: "10.00",
    isActive: false,
  },
];

async function main(): Promise<void> {
  assertDemoDatabaseUrl(process.env.DATABASE_URL);
  const seedPassword = process.env.SEED_PASSWORD ?? "";
  if (seedPassword.length < 8 || seedPassword.toUpperCase().includes("CHANGE_ME")) {
    throw new Error("SEED_PASSWORD falta o sigue siendo un marcador.");
  }

  const prisma = getPrisma();
  const passwordHash = hashPassword(seedPassword);

  await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: { name: "Administración Demo", role: "Administrator", passwordHash },
    create: {
      email: "admin@demo.local",
      name: "Administración Demo",
      role: "Administrator",
      passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { email: "comercial@demo.local" },
    update: { name: "Comercial Demo", role: "Comercial", passwordHash },
    create: {
      email: "comercial@demo.local",
      name: "Comercial Demo",
      role: "Comercial",
      passwordHash,
    },
  });

  await prisma.quoteSequence.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", prefix: "PRE-", nextNumber: 1 },
  });

  for (const client of CLIENTS) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: {
        name: client.name,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
      },
      create: client,
    });
  }

  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {
        name: service.name,
        description: service.description,
        price: service.price,
        taxRate: service.taxRate,
        isActive: service.isActive,
      },
      create: service,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.name : "seed-error");
    process.exit(1);
  });
