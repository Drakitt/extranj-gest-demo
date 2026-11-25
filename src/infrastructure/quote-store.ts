import { Prisma } from "@prisma/client";
import { getPrisma } from "@/infrastructure/prisma";
import type { AuthUser } from "@/infrastructure/auth/guard";
import { InputError, LookupError } from "@/application/input-error";
import { priceQuoteLine, sumQuote } from "@/application/quote-totals";
import { formatQuoteNumber } from "@/application/quote-sequence";
import {
  assertQuoteTransition,
  describeFollowUpChange,
  describeFollowUpCreated,
  describeQuoteStatusChange,
  followUpsAllowed,
} from "@/application/follow-ups";
import type { FollowUpPatchInput, QuoteCreateInput, QuoteLineDraft, QuotePatchInput } from "@/application/records";
import type { QuoteDto } from "@/types/demo";

const quoteInclude = {
  client: true,
  lines: { orderBy: { concept: "asc" as const } },
  followUps: {
    orderBy: { scheduledOn: "asc" as const },
    include: { events: { orderBy: { createdAt: "asc" as const } } },
  },
  events: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.QuoteInclude;

type QuoteRecord = Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>;

function money(value: Prisma.Decimal | number): number {
  return Number(value.toString());
}

function scheduledDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function serializeQuote(quote: QuoteRecord): QuoteDto {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    clientId: quote.clientId,
    clientName: quote.client.name,
    status: quote.status,
    notes: quote.notes,
    baseAmount: money(quote.baseAmount),
    taxAmount: money(quote.taxAmount),
    totalAmount: money(quote.totalAmount),
    lines: quote.lines.map((line) => ({
      id: line.id,
      serviceId: line.serviceId,
      concept: line.concept,
      quantity: money(line.quantity),
      unitPrice: money(line.unitPrice),
      discountPercent: money(line.discountPercent),
      taxRate: money(line.taxRate),
      baseAmount: money(line.baseAmount),
      taxAmount: money(line.taxAmount),
      totalAmount: money(line.totalAmount),
    })),
    followUps: quote.followUps.map((followUp) => ({
      id: followUp.id,
      scheduledOn: scheduledDate(followUp.scheduledOn),
      note: followUp.note,
      status: followUp.status,
      events: followUp.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        description: event.description,
        userName: event.userName,
        createdAt: event.createdAt.toISOString(),
      })),
    })),
    events: quote.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      description: event.description,
      userName: event.userName,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

async function buildLines(tx: Prisma.TransactionClient, drafts: QuoteLineDraft[]) {
  const services = await tx.service.findMany({
    where: { id: { in: drafts.map((line) => line.serviceId) } },
  });
  const byId = new Map(services.map((service) => [service.id, service]));
  return drafts.map((draft) => {
    const service = byId.get(draft.serviceId);
    if (!service) throw new InputError("Hay un servicio que no existe.");
    if (!service.isActive) throw new InputError("Hay un servicio que no está activo.");
    const priced = priceQuoteLine({
      quantity: draft.quantity,
      unitPrice: money(service.price),
      discountPercent: draft.discountPercent,
      taxRate: money(service.taxRate),
    });
    return {
      serviceId: service.id,
      concept: service.name,
      quantity: priced.quantity.toFixed(2),
      unitPrice: priced.unitPrice.toFixed(2),
      discountPercent: priced.discountPercent.toFixed(2),
      taxRate: priced.taxRate.toFixed(2),
      baseAmount: priced.baseAmount.toFixed(2),
      taxAmount: priced.taxAmount.toFixed(2),
      totalAmount: priced.totalAmount.toFixed(2),
      amounts: priced,
    };
  });
}

async function loadQuote(id: string): Promise<QuoteRecord> {
  const quote = await getPrisma().quote.findUnique({ where: { id }, include: quoteInclude });
  if (!quote) throw new LookupError("El presupuesto no existe.");
  return quote;
}

export async function listQuotes(): Promise<QuoteDto[]> {
  const quotes = await getPrisma().quote.findMany({
    include: quoteInclude,
    orderBy: { createdAt: "desc" },
  });
  return quotes.map(serializeQuote);
}

export async function getQuote(id: string): Promise<QuoteDto> {
  return serializeQuote(await loadQuote(id));
}

export async function createQuote(input: QuoteCreateInput, user: AuthUser): Promise<QuoteDto> {
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new InputError("El cliente es obligatorio.");

  const quote = await prisma.$transaction(async (tx) => {
    const lines = await buildLines(tx, input.lines);
    const totals = sumQuote(lines.map((line) => line.amounts));
    await tx.quoteSequence.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", prefix: "PRE-", nextNumber: 1 },
    });
    const sequence = await tx.quoteSequence.update({
      where: { id: "default" },
      data: { nextNumber: { increment: 1 } },
    });
    const created = await tx.quote.create({
      data: {
        clientId: client.id,
        quoteNumber: formatQuoteNumber(sequence.nextNumber - 1),
        notes: input.notes,
        status: "Draft",
        baseAmount: totals.baseAmount.toFixed(2),
        taxAmount: totals.taxAmount.toFixed(2),
        totalAmount: totals.totalAmount.toFixed(2),
        createdById: user.id,
        lines: {
          create: lines.map((line) => ({
            serviceId: line.serviceId,
            concept: line.concept,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent,
            taxRate: line.taxRate,
            baseAmount: line.baseAmount,
            taxAmount: line.taxAmount,
            totalAmount: line.totalAmount,
          })),
        },
        events: {
          create: {
            eventType: "Created",
            description: `Presupuesto creado para ${client.name}.`,
            userId: user.id,
            userName: user.name,
          },
        },
      },
      include: quoteInclude,
    });
    return created;
  });

  return serializeQuote(quote);
}

export async function updateQuote(id: string, input: QuotePatchInput, user: AuthUser): Promise<QuoteDto> {
  const prisma = getPrisma();
  const existing = await prisma.quote.findUnique({ where: { id } });
  if (!existing) throw new LookupError("El presupuesto no existe.");

  let nextStatus = existing.status;
  if (input.status && input.status !== existing.status) {
    assertQuoteTransition(existing.status, input.status);
    nextStatus = input.status;
  }
  if (input.lines && nextStatus !== "Draft") {
    throw new InputError("Las líneas solo pueden cambiar mientras el presupuesto está en borrador.");
  }

  const quote = await prisma.$transaction(async (tx) => {
    if (input.lines) {
      const lines = await buildLines(tx, input.lines);
      const totals = sumQuote(lines.map((line) => line.amounts));
      await tx.quoteLine.deleteMany({ where: { quoteId: id } });
      await tx.quoteLine.createMany({
        data: lines.map((line) => ({
          quoteId: id,
          serviceId: line.serviceId,
          concept: line.concept,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxRate: line.taxRate,
          baseAmount: line.baseAmount,
          taxAmount: line.taxAmount,
          totalAmount: line.totalAmount,
        })),
      });
      await tx.quote.update({
        where: { id },
        data: {
          status: nextStatus,
          notes: input.notes === undefined ? existing.notes : input.notes,
          baseAmount: totals.baseAmount.toFixed(2),
          taxAmount: totals.taxAmount.toFixed(2),
          totalAmount: totals.totalAmount.toFixed(2),
        },
      });
    } else {
      await tx.quote.update({
        where: { id },
        data: {
          status: nextStatus,
          notes: input.notes === undefined ? undefined : input.notes,
        },
      });
    }

    if (input.status && input.status !== existing.status) {
      await tx.quoteEvent.create({
        data: {
          quoteId: id,
          eventType: "StatusChanged",
          description: describeQuoteStatusChange(existing.status, input.status),
          userId: user.id,
          userName: user.name,
        },
      });
    }

    return tx.quote.findUniqueOrThrow({ where: { id }, include: quoteInclude });
  });

  return serializeQuote(quote);
}

export async function deleteQuote(id: string): Promise<void> {
  const prisma = getPrisma();
  const existing = await prisma.quote.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new LookupError("El presupuesto no existe.");
  await prisma.quote.delete({ where: { id } });
}

export async function createFollowUp(
  quoteId: string,
  input: { scheduledOn: string; note: string },
  user: AuthUser
): Promise<QuoteDto> {
  const prisma = getPrisma();
  const existing = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!existing) throw new LookupError("El presupuesto no existe.");
  if (!followUpsAllowed(existing.status)) {
    throw new InputError("Envía el presupuesto antes de registrar un seguimiento.");
  }

  await prisma.$transaction(async (tx) => {
    const createdEvent = describeFollowUpCreated(input.scheduledOn, input.note);
    await tx.followUp.create({
      data: {
        quoteId,
        scheduledOn: new Date(`${input.scheduledOn}T00:00:00.000Z`),
        note: input.note,
        status: "Pending",
        events: {
          create: {
            eventType: createdEvent.eventType,
            description: createdEvent.description,
            userId: user.id,
            userName: user.name,
          },
        },
      },
    });

    if (existing.status === "Sent") {
      await tx.quote.update({ where: { id: quoteId }, data: { status: "InFollowUp" } });
      await tx.quoteEvent.create({
        data: {
          quoteId,
          eventType: "StatusChanged",
          description: describeQuoteStatusChange("Sent", "InFollowUp"),
          userId: user.id,
          userName: user.name,
        },
      });
    }
  });

  return getQuote(quoteId);
}

export async function updateFollowUp(
  quoteId: string,
  followUpId: string,
  input: FollowUpPatchInput,
  user: AuthUser
): Promise<QuoteDto> {
  const prisma = getPrisma();
  const followUp = await prisma.followUp.findFirst({
    where: { id: followUpId, quoteId },
  });
  if (!followUp) throw new LookupError("El seguimiento no existe.");

  const before = {
    scheduledOn: followUp.scheduledOn.toISOString().slice(0, 10),
    note: followUp.note,
    status: followUp.status,
  };
  const after = {
    scheduledOn: input.scheduledOn ?? before.scheduledOn,
    note: input.note ?? before.note,
    status: input.status ?? before.status,
  };
  const changes = describeFollowUpChange(before, after);
  if (changes.length === 0) {
    return getQuote(quoteId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.followUp.update({
      where: { id: followUpId },
      data: {
        scheduledOn: new Date(`${after.scheduledOn}T00:00:00.000Z`),
        note: after.note,
        status: after.status,
      },
    });
    await tx.followUpEvent.createMany({
      data: changes.map((change) => ({
        followUpId,
        eventType: change.eventType,
        description: change.description,
        userId: user.id,
        userName: user.name,
      })),
    });
  });

  return getQuote(quoteId);
}
