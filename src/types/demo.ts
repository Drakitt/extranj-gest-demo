export type Role = "Administrator" | "Comercial";

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type ClientDto = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type ServiceDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  taxRate: number;
  isActive: boolean;
};

export type QuoteLineDto = {
  id: string;
  serviceId: string | null;
  concept: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type FollowUpEventDto = {
  id: string;
  eventType: string;
  description: string;
  userName: string | null;
  createdAt: string;
};

export type FollowUpDto = {
  id: string;
  scheduledOn: string;
  note: string;
  status: "Pending" | "Done" | "Cancelled";
  events: FollowUpEventDto[];
};

export type QuoteEventDto = {
  id: string;
  eventType: string;
  description: string;
  userName: string | null;
  createdAt: string;
};

export type QuoteStatus = "Draft" | "Sent" | "InFollowUp" | "Accepted" | "Declined" | "Cancelled";

export type QuoteDto = {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  status: QuoteStatus;
  notes: string | null;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: QuoteLineDto[];
  followUps: FollowUpDto[];
  events: QuoteEventDto[];
};
