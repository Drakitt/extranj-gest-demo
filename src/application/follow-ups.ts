import { InputError } from "./input-error";
import type { FollowUpStatus, QuoteStatus } from "./records";

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  Draft: ["Sent", "Cancelled"],
  Sent: ["InFollowUp", "Accepted", "Declined", "Cancelled"],
  InFollowUp: ["Accepted", "Declined", "Cancelled"],
  Accepted: [],
  Declined: [],
  Cancelled: [],
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  Draft: "Borrador",
  Sent: "Enviado",
  InFollowUp: "En seguimiento",
  Accepted: "Aceptado",
  Declined: "Rechazado",
  Cancelled: "Cancelado",
};

export const FOLLOW_UP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  Pending: "Pendiente",
  Done: "Hecho",
  Cancelled: "Cancelado",
};

export function allowedQuoteTransitions(status: QuoteStatus): QuoteStatus[] {
  return [...TRANSITIONS[status]];
}

export function assertQuoteTransition(from: QuoteStatus, to: QuoteStatus): void {
  if (from === to) return;
  if (!TRANSITIONS[from].includes(to)) {
    throw new InputError(
      `No se puede pasar de ${QUOTE_STATUS_LABEL[from]} a ${QUOTE_STATUS_LABEL[to]}.`
    );
  }
}

export function followUpsAllowed(status: QuoteStatus): boolean {
  return status === "Sent" || status === "InFollowUp" || status === "Accepted";
}

export function describeFollowUpCreated(scheduledOn: string, note: string): {
  eventType: string;
  description: string;
} {
  return {
    eventType: "Created",
    description: `Seguimiento previsto para ${scheduledOn}. ${note}`.trim(),
  };
}

export function describeFollowUpChange(
  before: { scheduledOn: string; note: string; status: FollowUpStatus },
  after: { scheduledOn: string; note: string; status: FollowUpStatus }
): Array<{ eventType: string; description: string }> {
  const events: Array<{ eventType: string; description: string }> = [];
  if (before.scheduledOn !== after.scheduledOn) {
    events.push({
      eventType: "Rescheduled",
      description: `Fecha prevista: ${before.scheduledOn} → ${after.scheduledOn}.`,
    });
  }
  if (before.note !== after.note) {
    events.push({
      eventType: "NoteUpdated",
      description: `Nota actualizada: ${after.note}`,
    });
  }
  if (before.status !== after.status) {
    events.push({
      eventType: "StatusChanged",
      description: `Estado: ${FOLLOW_UP_STATUS_LABEL[before.status]} → ${FOLLOW_UP_STATUS_LABEL[after.status]}.`,
    });
  }
  return events;
}

export function describeQuoteStatusChange(from: QuoteStatus, to: QuoteStatus): string {
  return `Estado: ${QUOTE_STATUS_LABEL[from]} → ${QUOTE_STATUS_LABEL[to]}.`;
}
