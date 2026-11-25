export const DEMO_DATABASE = {
  user: "crm_servicios_demo",
  port: "5436",
  database: "crm_servicios_demo",
  hosts: ["127.0.0.1", "localhost"],
} as const;

const PLACEHOLDER_PASSWORDS = new Set([
  "change_me",
  "changeme",
  "change-me",
  "postgres",
  "password",
  "secret",
]);

export type DatabaseVerdict =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Comprueba el destino antes de abrir cualquier conexión.
 * Solo admite el usuario, el puerto y la base exclusivos de esta demo.
 */
export function inspectDatabaseUrl(raw: string | undefined): DatabaseVerdict {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "DATABASE_URL está vacía." };
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "DATABASE_URL no es una URL válida." };
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return { ok: false, reason: "DATABASE_URL debe usar el protocolo postgresql." };
  }

  const host = url.hostname.toLowerCase();
  const port = url.port;
  const database = decodeURIComponent(url.pathname.replace(/^\//, "")).split("?")[0];
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);

  if (!DEMO_DATABASE.hosts.includes(host as (typeof DEMO_DATABASE.hosts)[number])) {
    return { ok: false, reason: "El host no es el de la demo local." };
  }
  if (port !== DEMO_DATABASE.port) {
    return { ok: false, reason: "El puerto no es el de la demo local." };
  }
  if (database !== DEMO_DATABASE.database) {
    return { ok: false, reason: "La base de datos no es la de la demo." };
  }
  if (user !== DEMO_DATABASE.user) {
    return { ok: false, reason: "El usuario no es el de la demo." };
  }
  if (!password || PLACEHOLDER_PASSWORDS.has(password.toLowerCase()) || password.toUpperCase().includes("CHANGE_ME")) {
    return { ok: false, reason: "La contraseña de la base falta o sigue siendo un marcador." };
  }

  return { ok: true };
}

export function assertDemoDatabaseUrl(raw: string | undefined): string {
  const verdict = inspectDatabaseUrl(raw);
  if (!verdict.ok) {
    throw new Error(`Destino de base rechazado: ${verdict.reason}`);
  }
  return raw!.trim();
}
