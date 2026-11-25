"use client";

import { useEffect, useState } from "react";
import { api, readToken, writeToken } from "@/lib/api";
import { isAppRole } from "@/application/permissions";
import { ClientsSection } from "@/components/clients-section";
import { ServicesSection } from "@/components/services-section";
import { QuotesSection } from "@/components/quotes-section";
import type { Role, UserDto } from "@/types/demo";

type Section = "clients" | "services" | "quotes";

export function App() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>("clients");

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setReady(true);
      return;
    }
    api<{ user: UserDto }>("/api/v1/auth/me")
      .then((data) => {
        if (isAppRole(data.user.role)) setUser(data.user);
        else writeToken(null);
      })
      .catch(() => writeToken(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <main className="shell"><p>Cargando la demo…</p></main>;
  if (!user) return <Login onSuccess={setUser} />;

  const role = user.role as Role;
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Marca provisional</p>
          <h1>Servicios Demo</h1>
        </div>
        <div className="row">
          <span className="badge">{user.name} · {role === "Administrator" ? "Administrador" : "Comercial"}</span>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              writeToken(null);
              setUser(null);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <p className="muted">Recorrido local: cliente, servicio, presupuesto y seguimiento simulado.</p>
      <nav className="nav" aria-label="Secciones">
        <button type="button" aria-pressed={section === "clients"} onClick={() => setSection("clients")}>Clientes</button>
        <button type="button" aria-pressed={section === "services"} onClick={() => setSection("services")}>Servicios</button>
        <button type="button" aria-pressed={section === "quotes"} onClick={() => setSection("quotes")}>Presupuestos</button>
      </nav>
      {section === "clients" ? <ClientsSection role={role} /> : null}
      {section === "services" ? <ServicesSection role={role} /> : null}
      {section === "quotes" ? <QuotesSection role={role} /> : null}
    </main>
  );
}

function Login({ onSuccess }: { onSuccess: (user: UserDto) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<{ token: string; user: UserDto }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      writeToken(data.token);
      onSuccess(data.user);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido iniciar sesión.");
    }
  }

  return (
    <main className="shell">
      <form className="login-card fields" onSubmit={submit}>
        <p className="eyebrow">Marca provisional</p>
        <h1>Servicios Demo</h1>
        <p className="muted">
          Acceso local de demostración. Las cuentas ficticias solo existirán después de preparar la base.
        </p>
        <label>
          Correo
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="primary" type="submit">Entrar</button>
      </form>
    </main>
  );
}
