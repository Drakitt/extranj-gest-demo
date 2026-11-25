"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { can } from "@/application/permissions";
import type { Role, ServiceDto } from "@/types/demo";

const EMPTY = { name: "", description: "", price: "", taxRate: "21", isActive: true };

export function ServicesSection({ role }: { role: Role }) {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const canWrite = can(role, "services.write");

  async function load() {
    const data = await api<{ services: ServiceDto[] }>("/api/v1/services");
    setServices(data.services);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const body = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      taxRate: Number(form.taxRate),
      isActive: form.isActive,
    };
    try {
      if (editingId) {
        await api(`/api/v1/services/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await api("/api/v1/services", { method: "POST", body: JSON.stringify(body) });
      }
      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido guardar el servicio.");
    }
  }

  async function remove(service: ServiceDto) {
    if (!window.confirm(`¿Borrar el servicio ficticio ${service.name}?`)) return;
    setError("");
    try {
      await api(`/api/v1/services/${service.id}`, { method: "DELETE" });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido borrar el servicio.");
    }
  }

  return (
    <section className="grid">
      {canWrite ? (
        <form className="card fields" onSubmit={save}>
          <h3>{editingId ? "Editar servicio" : "Nuevo servicio"}</h3>
          <label>
            Nombre
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label>
            Precio sin impuesto
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
          </label>
          <label>
            Impuesto %
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxRate}
              onChange={(event) => setForm({ ...form, taxRate: event.target.value })}
              required
            />
          </label>
          <label>
            <span>Activo</span>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
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
          <p>El perfil comercial consulta el catálogo. El alta y los cambios los hace Administración.</p>
          {error ? <p className="error">{error}</p> : null}
        </div>
      )}
      <div className="card">
        {services.length === 0 ? <p className="muted">Todavía no hay servicios ficticios.</p> : null}
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Precio</th>
              <th>Impuesto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>
                  <strong>{service.name}</strong>
                  {service.description ? <div className="muted">{service.description}</div> : null}
                </td>
                <td>{formatMoney(service.price)}</td>
                <td>{service.taxRate}%</td>
                <td>{service.isActive ? "Activo" : "Inactivo"}</td>
                <td>
                  {canWrite ? (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => {
                        setEditingId(service.id);
                        setForm({
                          name: service.name,
                          description: service.description || "",
                          price: String(service.price),
                          taxRate: String(service.taxRate),
                          isActive: service.isActive,
                        });
                      }}
                    >
                      Editar
                    </button>
                  ) : null}
                  {can(role, "services.delete") ? (
                    <button type="button" className="danger" onClick={() => remove(service)}>
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
