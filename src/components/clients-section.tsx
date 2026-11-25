"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { can } from "@/application/permissions";
import type { ClientDto, Role } from "@/types/demo";

const EMPTY = { name: "", contactName: "", email: "", phone: "", notes: "" };

export function ClientsSection({ role }: { role: Role }) {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const data = await api<{ clients: ClientDto[] }>("/api/v1/clients");
    setClients(data.clients);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  function update(field: keyof typeof EMPTY, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const body = {
      name: form.name,
      contactName: form.contactName || null,
      email: form.email || null,
      phone: form.phone || null,
      notes: form.notes || null,
    };
    try {
      if (editingId) {
        await api(`/api/v1/clients/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await api("/api/v1/clients", { method: "POST", body: JSON.stringify(body) });
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido guardar el cliente.");
    }
  }

  async function remove(client: ClientDto) {
    if (!window.confirm(`¿Borrar el cliente ficticio ${client.name}?`)) return;
    setError("");
    try {
      await api(`/api/v1/clients/${client.id}`, { method: "DELETE" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido borrar el cliente.");
    }
  }

  const canWrite = can(role, "clients.write");

  return (
    <section className="grid">
      {canWrite ? (
      <form className="card fields" onSubmit={save}>
        <h3>{editingId ? "Editar cliente" : "Nuevo cliente"}</h3>
        <label>
          Nombre o razón social
          <input value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </label>
        <label>
          Contacto
          <input value={form.contactName} onChange={(event) => update("contactName", event.target.value)} />
        </label>
        <label>
          Correo ficticio
          <input
            type="email"
            placeholder="nombre@demo.local"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>
        <label>
          Teléfono
          <input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
        </label>
        <label>
          Notas
          <textarea rows={3} value={form.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="row">
          <button className="primary" type="submit">Guardar</button>
          {editingId ? (
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
      ) : (
        <div className="card">
          <p>Este perfil no puede crear ni editar clientes.</p>
          {error ? <p className="error">{error}</p> : null}
        </div>
      )}
      <div className="card">
        {clients.length === 0 ? <p className="muted">Todavía no hay clientes ficticios.</p> : null}
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  {client.notes ? <div className="muted">{client.notes}</div> : null}
                </td>
                <td>{client.contactName || "—"}</td>
                <td>{client.email || "—"}</td>
                <td>{client.phone || "—"}</td>
                <td>
                  {canWrite ? (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setEditingId(client.id);
                        setForm({
                          name: client.name,
                          contactName: client.contactName || "",
                          email: client.email || "",
                          phone: client.phone || "",
                          notes: client.notes || "",
                        });
                      }}
                    >
                      Editar
                    </button>
                  ) : null}
                  {can(role, "clients.delete") ? (
                    <button type="button" className="danger" onClick={() => remove(client)}>
                      Borrar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
