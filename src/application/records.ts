import { InputError } from "./input-error";
import { roundMoney } from "./money";

const FICTIONAL_EMAIL = /^[^\s@]+@(demo\.local|example\.com)$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ClientInput = {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type ServiceInput = {
  name: string;
  description: string | null;
  price: number;
  taxRate: number;
  isActive: boolean;
};

export type QuoteLineDraft = {
  serviceId: string;
  quantity: number;
  discountPercent: number;
};

export type QuoteCreateInput = {
  clientId: string;
  notes: string | null;
  lines: QuoteLineDraft[];
};

export type QuotePatchInput = {
  status?: QuoteStatus;
  notes?: string | null;
  lines?: QuoteLineDraft[];
};

export type FollowUpInput = {
  scheduledOn: string;
  note: string;
  status?: FollowUpStatus;
};

export type FollowUpPatchInput = {
  scheduledOn?: string;
  note?: string;
  status?: FollowUpStatus;
};

export const QUOTE_STATUSES = ["Draft", "Sent", "InFollowUp", "Accepted", "Declined", "Cancelled"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const FOLLOW_UP_STATUSES = ["Pending", "Done", "Cancelled"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InputError("El cuerpo de la solicitud no es válido.");
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InputError(`${label} es obligatorio.`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new InputError(`${label} supera la longitud permitida.`);
  }
  return text;
}

function optionalText(value: unknown, label: string, max: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new InputError(`${label} no es válido.`);
  }
  const text = value.trim();
  if (text.length === 0) return null;
  if (text.length > max) {
    throw new InputError(`${label} supera la longitud permitida.`);
  }
  return text;
}

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  throw new InputError("Se esperaba un número.");
}

export function parseClientInput(body: unknown): ClientInput {
  const record = asRecord(body);
  const email = optionalText(record.email, "El correo", 200);
  if (email && !FICTIONAL_EMAIL.test(email)) {
    throw new InputError("El correo debe usar los dominios ficticios demo.local o example.com.");
  }
  const phone = optionalText(record.phone, "El teléfono", 40);
  if (phone && !/^[0-9+\s()-]+$/.test(phone)) {
    throw new InputError("El teléfono contiene caracteres no admitidos.");
  }
  return {
    name: requiredText(record.name, "El nombre o la razón social", 200),
    contactName: optionalText(record.contactName, "El contacto", 200),
    email,
    phone,
    notes: optionalText(record.notes, "Las notas", 4000),
  };
}

export function parseServiceInput(body: unknown, partial = false): ServiceInput {
  const record = asRecord(body);
  const price = optionalNumber(record.price);
  const taxRate = optionalNumber(record.taxRate);
  if (!partial || price !== undefined) {
    if (price === undefined || !Number.isFinite(price)) {
      throw new InputError("El precio es obligatorio.");
    }
  }
  if (!partial || taxRate !== undefined) {
    if (taxRate === undefined || !Number.isFinite(taxRate)) {
      throw new InputError("El impuesto es obligatorio.");
    }
  }
  const safePrice = roundMoney(price ?? 0);
  const safeTax = roundMoney(taxRate ?? 0);
  if (safePrice < 0 || safePrice > 1000000) {
    throw new InputError("El precio está fuera del rango permitido.");
  }
  if (safeTax < 0 || safeTax > 100) {
    throw new InputError("El impuesto está fuera del rango permitido.");
  }
  if (record.isActive != null && typeof record.isActive !== "boolean") {
    throw new InputError("El estado activo no es válido.");
  }
  return {
    name: requiredText(record.name, "El nombre del servicio", 200),
    description: optionalText(record.description, "La descripción", 4000),
    price: safePrice,
    taxRate: safeTax,
    isActive: record.isActive == null ? true : Boolean(record.isActive),
  };
}

export function parseServicePatch(body: unknown): Partial<ServiceInput> {
  const record = asRecord(body);
  const patch: Partial<ServiceInput> = {};
  if ("name" in record) patch.name = requiredText(record.name, "El nombre del servicio", 200);
  if ("description" in record) {
    patch.description = optionalText(record.description, "La descripción", 4000);
  }
  if ("price" in record) {
    const price = optionalNumber(record.price);
    if (price === undefined || !Number.isFinite(price)) {
      throw new InputError("El precio es obligatorio.");
    }
    const safePrice = roundMoney(price);
    if (safePrice < 0 || safePrice > 1000000) {
      throw new InputError("El precio está fuera del rango permitido.");
    }
    patch.price = safePrice;
  }
  if ("taxRate" in record) {
    const taxRate = optionalNumber(record.taxRate);
    if (taxRate === undefined || !Number.isFinite(taxRate)) {
      throw new InputError("El impuesto es obligatorio.");
    }
    const safeTax = roundMoney(taxRate);
    if (safeTax < 0 || safeTax > 100) {
      throw new InputError("El impuesto está fuera del rango permitido.");
    }
    patch.taxRate = safeTax;
  }
  if ("isActive" in record) {
    if (typeof record.isActive !== "boolean") {
      throw new InputError("El estado activo no es válido.");
    }
    patch.isActive = record.isActive;
  }
  if (Object.keys(patch).length === 0) {
    throw new InputError("No hay cambios para guardar.");
  }
  return patch;
}

function parseLine(value: unknown): QuoteLineDraft {
  const record = asRecord(value);
  const serviceId = requiredText(record.serviceId, "El servicio", 80);
  if (!UUID.test(serviceId)) {
    throw new InputError("El servicio no es válido.");
  }
  const quantity = optionalNumber(record.quantity);
  const discountPercent = optionalNumber(record.discountPercent ?? 0);
  if (quantity === undefined || discountPercent === undefined) {
    throw new InputError("La línea del presupuesto está incompleta.");
  }
  return { serviceId, quantity, discountPercent };
}

function parseLines(value: unknown): QuoteLineDraft[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InputError("Añade al menos un servicio.");
  }
  if (value.length > 50) {
    throw new InputError("El presupuesto admite como máximo 50 líneas.");
  }
  return value.map(parseLine);
}

export function parseQuoteCreate(body: unknown): QuoteCreateInput {
  const record = asRecord(body);
  const clientId = requiredText(record.clientId, "El cliente", 80);
  if (!UUID.test(clientId)) {
    throw new InputError("El cliente es obligatorio.");
  }
  return {
    clientId,
    notes: optionalText(record.notes, "Las notas", 4000),
    lines: parseLines(record.lines),
  };
}

export function parseQuotePatch(body: unknown): QuotePatchInput {
  const record = asRecord(body);
  const patch: QuotePatchInput = {};
  if ("status" in record && record.status != null) {
    patch.status = parseQuoteStatus(record.status);
  }
  if ("notes" in record) {
    patch.notes = optionalText(record.notes, "Las notas", 4000);
  }
  if ("lines" in record) {
    patch.lines = parseLines(record.lines);
  }
  if (Object.keys(patch).length === 0) {
    throw new InputError("No hay cambios para guardar.");
  }
  return patch;
}

export function parseQuoteStatus(value: unknown): QuoteStatus {
  if (typeof value !== "string" || !(QUOTE_STATUSES as readonly string[]).includes(value)) {
    throw new InputError("El estado del presupuesto no es válido.");
  }
  return value as QuoteStatus;
}

export function parseScheduledDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputError("La fecha prevista debe tener el formato AAAA-MM-DD.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputError("La fecha prevista no existe.");
  }
  return value;
}

export function parseFollowUpCreate(body: unknown): FollowUpInput {
  const record = asRecord(body);
  return {
    scheduledOn: parseScheduledDate(record.scheduledOn),
    note: requiredText(record.note, "La nota", 2000),
  };
}

export function parseFollowUpPatch(body: unknown): FollowUpPatchInput {
  const record = asRecord(body);
  const patch: FollowUpPatchInput = {};
  if ("scheduledOn" in record) patch.scheduledOn = parseScheduledDate(record.scheduledOn);
  if ("note" in record) patch.note = requiredText(record.note, "La nota", 2000);
  if ("status" in record) {
    if (typeof record.status !== "string" || !(FOLLOW_UP_STATUSES as readonly string[]).includes(record.status)) {
      throw new InputError("El estado del seguimiento no es válido.");
    }
    patch.status = record.status as FollowUpStatus;
  }
  if (Object.keys(patch).length === 0) {
    throw new InputError("No hay cambios para guardar.");
  }
  return patch;
}

export function parseLogin(body: unknown): { email: string; password: string } {
  const record = asRecord(body);
  const email = requiredText(record.email, "El correo", 200).toLowerCase();
  const password = typeof record.password === "string" ? record.password : "";
  if (!password) {
    throw new InputError("El correo o la contraseña no son válidos.");
  }
  return { email, password };
}
