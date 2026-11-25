export const ROLES = ["Administrator", "Comercial"] as const;

export type AppRole = (typeof ROLES)[number];

export const ACTIONS = [
  "clients.read",
  "clients.write",
  "clients.delete",
  "services.read",
  "services.write",
  "services.delete",
  "quotes.read",
  "quotes.write",
  "quotes.delete",
  "followUps.read",
  "followUps.write",
] as const;

export type Action = (typeof ACTIONS)[number];

const COMERCIAL_DENIED = new Set<Action>([
  "clients.delete",
  "services.write",
  "services.delete",
  "quotes.delete",
]);

export function isAppRole(role: string): role is AppRole {
  return (ROLES as readonly string[]).includes(role);
}

/**
 * Administrador: las cuatro secciones, incluido el catálogo y el borrado.
 * Comercial: clientes, presupuestos y seguimiento; el catálogo solo se consulta.
 */
export function can(role: string, action: Action): boolean {
  if (role === "Administrator") return true;
  if (role === "Comercial") return !COMERCIAL_DENIED.has(action);
  return false;
}
