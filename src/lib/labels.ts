import type { QuoteStatus } from "@/types/demo";

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  Draft: "Borrador",
  Sent: "Enviado",
  InFollowUp: "En seguimiento",
  Accepted: "Aceptado",
  Declined: "Rechazado",
  Cancelled: "Cancelado",
};

export const FOLLOW_UP_STATUS_LABEL = {
  Pending: "Pendiente",
  Done: "Hecho",
  Cancelled: "Cancelado",
} as const;
