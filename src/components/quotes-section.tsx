"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { FOLLOW_UP_STATUS_LABEL, QUOTE_STATUS_LABEL } from "@/lib/labels";
import { can } from "@/application/permissions";
import { priceQuoteLine, sumQuote } from "@/application/quote-totals";
import { allowedQuoteTransitions, followUpsAllowed } from "@/application/follow-ups";
import { FilterPills } from "@/components/filter-pills";
import type { ClientDto, FollowUpDto, QuoteDto, QuoteStatus, Role, ServiceDto } from "@/types/demo";

type DraftLine = { key: string; serviceId: string; quantity: string; discountPercent: string };

function newLine(): DraftLine {
  return { key: crypto.randomUUID(), serviceId: "", quantity: "1", discountPercent: "0" };
}

export function QuotesSection({ role }: { role: Role }) {
  const [quotes, setQuotes] = useState<QuoteDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [quoteData, clientData, serviceData] = await Promise.all([
      api<{ quotes: QuoteDto[] }>("/api/v1/quotes"),
      api<{ clients: ClientDto[] }>("/api/v1/clients"),
      api<{ services: ServiceDto[] }>("/api/v1/services"),
    ]);
    setQuotes(quoteData.quotes);
    setClients(clientData.clients);
    setServices(serviceData.services);
  }

  useEffect(() => {
    load().catch((reason: Error) => setError(reason.message));
  }, []);

  const visible = quotes.filter((quote) => filter === "all" || quote.status === filter);
  const selected = quotes.find((quote) => quote.id === selectedId) ?? null;
  const activeServices = services.filter((service) => service.isActive);

  async function refresh(nextId?: string | null) {
    await load();
    if (nextId === null) setSelectedId(null);
    else if (nextId) setSelectedId(nextId);
  }

  const canWriteQuotes = can(role, "quotes.write");

  return (
    <section className="stack">
      <FilterPills
        label="Estado"
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: "Todos", count: quotes.length },
          ...Object.entries(QUOTE_STATUS_LABEL).map(([id, label]) => ({
            id,
            label,
            count: quotes.filter((quote) => quote.status === id).length,
          })),
        ]}
      />
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        <div className="card quote-list">
          {canWriteQuotes ? (
            <button
              type="button"
              className="primary"
              onClick={() => {
                setCreating(true);
                setSelectedId(null);
                setError("");
              }}
            >
              Nuevo presupuesto
            </button>
          ) : null}
          {visible.length === 0 ? <p className="muted">No hay presupuestos en este estado.</p> : null}
          {visible.map((quote) => (
            <button
              type="button"
              key={quote.id}
              className="ghost"
              aria-pressed={quote.id === selectedId}
              onClick={() => {
                setSelectedId(quote.id);
                setCreating(false);
                setError("");
              }}
            >
              <strong>{quote.quoteNumber}</strong>
              <div>{quote.clientName}</div>
              <div className="muted">
                {QUOTE_STATUS_LABEL[quote.status]} · {formatMoney(quote.totalAmount)}
              </div>
            </button>
          ))}
        </div>
        <div className="card">
          {creating ? (
            <QuoteForm
              clients={clients}
              services={activeServices}
              onCancel={() => setCreating(false)}
              onSaved={async (quote) => {
                setCreating(false);
                await refresh(quote.id);
              }}
            />
          ) : selected ? (
            <QuoteDetail
              quote={selected}
              role={role}
              services={activeServices}
              onChange={refresh}
            />
          ) : (
            <p className="muted">Elige un presupuesto o crea uno con un cliente y al menos un servicio.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function QuoteForm({
  clients,
  services,
  initial,
  onCancel,
  onSaved,
}: {
  clients: ClientDto[];
  services: ServiceDto[];
  initial?: QuoteDto;
  onCancel?: () => void;
  onSaved: (quote: QuoteDto) => Promise<void>;
}) {
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<DraftLine[]>(
    initial
      ? initial.lines.map((line) => ({
          key: line.id,
          serviceId: line.serviceId ?? "",
          quantity: String(line.quantity),
          discountPercent: String(line.discountPercent),
        }))
      : [newLine()]
  );
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const priced = lines.map((line) => {
      const service = services.find((item) => item.id === line.serviceId);
      if (!service) return null;
      try {
        return priceQuoteLine({
          quantity: Number(line.quantity),
          unitPrice: service.price,
          discountPercent: Number(line.discountPercent || 0),
          taxRate: service.taxRate,
        });
      } catch {
        return null;
      }
    });
    const ready = priced.filter((line) => line != null);
    if (ready.length !== priced.length) return null;
    return { totals: sumQuote(ready) };
  }, [lines, services]);

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const body = {
      clientId,
      notes: notes || null,
      lines: lines.map((line) => ({
        serviceId: line.serviceId,
        quantity: Number(line.quantity),
        discountPercent: Number(line.discountPercent || 0),
      })),
    };
    try {
      const data = initial
        ? await api<{ quote: QuoteDto }>(`/api/v1/quotes/${initial.id}`, {
            method: "PATCH",
            body: JSON.stringify({ notes: body.notes, lines: body.lines }),
          })
        : await api<{ quote: QuoteDto }>("/api/v1/quotes", { method: "POST", body: JSON.stringify(body) });
      await onSaved(data.quote);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido guardar el presupuesto.");
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <h3>{initial ? `Editar ${initial.quoteNumber}` : "Nuevo presupuesto"}</h3>
      {initial ? null : (
        <label>
          Cliente
          <select value={clientId} onChange={(event) => setClientId(event.target.value)} required>
            <option value="">Selecciona un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>
      )}
      {lines.map((line, index) => (
        <div className="fields" key={line.key}>
          <label>
            Servicio {index + 1}
            <select
              value={line.serviceId}
              onChange={(event) => updateLine(line.key, { serviceId: event.target.value })}
              required
            >
              <option value="">Selecciona un servicio activo</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {formatMoney(service.price)} · {service.taxRate}%
                </option>
              ))}
            </select>
          </label>
          <div className="row">
            <label>
              Cantidad
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={line.quantity}
                onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                required
              />
            </label>
            <label>
              Descuento %
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={line.discountPercent}
                onChange={(event) => updateLine(line.key, { discountPercent: event.target.value })}
              />
            </label>
            <button
              type="button"
              className="ghost"
              onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
              disabled={lines.length === 1}
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="ghost" onClick={() => setLines((current) => [...current, newLine()])}>
        Añadir servicio
      </button>
      <label>
        Notas
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <Totals totals={preview?.totals ?? null} />
      {error ? <p className="error">{error}</p> : null}
      <div className="row">
        <button className="primary" type="submit">Guardar presupuesto</button>
        {onCancel ? (
          <button className="ghost" type="button" onClick={onCancel}>Cancelar</button>
        ) : null}
      </div>
    </form>
  );
}

function Totals({ totals }: { totals: { baseAmount: number; taxAmount: number; totalAmount: number } | null }) {
  if (!totals) return <p className="muted">Completa las líneas para ver los importes.</p>;
  return (
    <div className="totals">
      <span>Base {formatMoney(totals.baseAmount)}</span>
      <span>Impuesto {formatMoney(totals.taxAmount)}</span>
      <strong>Total {formatMoney(totals.totalAmount)}</strong>
    </div>
  );
}

function QuoteDetail({
  quote,
  role,
  services,
  onChange,
}: {
  quote: QuoteDto;
  role: Role;
  services: ServiceDto[];
  onChange: (id?: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [scheduledOn, setScheduledOn] = useState("");
  const [note, setNote] = useState("");
  const transitions = allowedQuoteTransitions(quote.status);
  const canWriteQuotes = can(role, "quotes.write");
  const canWriteFollowUps = can(role, "followUps.write");

  async function setStatus(status: QuoteStatus) {
    setError("");
    try {
      await api(`/api/v1/quotes/${quote.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await onChange(quote.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido cambiar el estado.");
    }
  }

  async function remove() {
    if (!window.confirm(`¿Borrar el presupuesto ${quote.quoteNumber}?`)) return;
    setError("");
    try {
      await api(`/api/v1/quotes/${quote.id}`, { method: "DELETE" });
      await onChange(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido borrar el presupuesto.");
    }
  }

  async function addFollowUp(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/v1/quotes/${quote.id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify({ scheduledOn, note }),
      });
      setScheduledOn("");
      setNote("");
      await onChange(quote.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido registrar el seguimiento.");
    }
  }

  async function updateFollowUp(followUpId: string, body: Record<string, string>) {
    setError("");
    try {
      await api(`/api/v1/quotes/${quote.id}/follow-ups/${followUpId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await onChange(quote.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido actualizar el seguimiento.");
    }
  }

  if (editing && canWriteQuotes && quote.status === "Draft") {
    return (
      <QuoteForm
        clients={[]}
        services={services}
        initial={quote}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          setEditing(false);
          await onChange(quote.id);
        }}
      />
    );
  }

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>{quote.quoteNumber}</h3>
          <p className="muted">{quote.clientName} · {QUOTE_STATUS_LABEL[quote.status]}</p>
        </div>
        <div className="quote-actions">
          {canWriteQuotes && quote.status === "Draft" ? (
            <button type="button" className="ghost" onClick={() => setEditing(true)}>Editar líneas</button>
          ) : null}
          {can(role, "quotes.delete") ? (
            <button type="button" className="danger" onClick={remove}>Borrar</button>
          ) : null}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Dto.</th>
            <th>Impuesto</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.concept}</td>
              <td>{line.quantity}</td>
              <td>{formatMoney(line.unitPrice)}</td>
              <td>{line.discountPercent}%</td>
              <td>{line.taxRate}%</td>
              <td>{formatMoney(line.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Totals totals={quote} />
      {quote.notes ? <p>{quote.notes}</p> : null}
      {canWriteQuotes && transitions.length > 0 ? (
        <div className="row">
          {transitions.map((status) => (
            <button key={status} type="button" className="primary" onClick={() => setStatus(status)}>
              Pasar a {QUOTE_STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      ) : null}
      <h3>Seguimiento simulado</h3>
      {followUpsAllowed(quote.status) && canWriteFollowUps ? (
        <form className="fields" onSubmit={addFollowUp}>
          <div className="row">
            <label>
              Fecha prevista
              <input type="date" value={scheduledOn} onChange={(event) => setScheduledOn(event.target.value)} required />
            </label>
            <label>
              Nota
              <input value={note} onChange={(event) => setNote(event.target.value)} required />
            </label>
            <button className="primary" type="submit">Registrar</button>
          </div>
        </form>
      ) : followUpsAllowed(quote.status) ? null : (
        <p className="muted">El seguimiento se registra cuando el presupuesto ya se ha enviado.</p>
      )}
      {quote.followUps.map((followUp) => (
        <FollowUpCard
          key={`${followUp.id}-${followUp.scheduledOn}-${followUp.note}-${followUp.status}`}
          followUp={followUp}
          canWrite={canWriteFollowUps}
          onUpdate={updateFollowUp}
        />
      ))}
      {quote.events.length > 0 ? (
        <div>
          <h3>Historial del presupuesto</h3>
          <ul className="history">
            {quote.events.map((event) => (
              <li key={event.id}>
                {formatDateTime(event.createdAt)} · {event.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

function FollowUpCard({
  followUp,
  canWrite,
  onUpdate,
}: {
  followUp: FollowUpDto;
  canWrite: boolean;
  onUpdate: (followUpId: string, body: Record<string, string>) => Promise<void>;
}) {
  const [scheduledOn, setScheduledOn] = useState(followUp.scheduledOn);
  const [note, setNote] = useState(followUp.note);
  const [status, setStatus] = useState(followUp.status);
  const dirty =
    scheduledOn !== followUp.scheduledOn || note !== followUp.note || status !== followUp.status;

  return (
    <article className="card">
      <div className="row">
        <strong>{formatDate(followUp.scheduledOn)}</strong>
        <span className="badge">{FOLLOW_UP_STATUS_LABEL[followUp.status]}</span>
      </div>
      {canWrite ? (
        <form
          className="fields"
          onSubmit={(event) => {
            event.preventDefault();
            void onUpdate(followUp.id, { scheduledOn, note, status });
          }}
        >
          <label>
            Fecha prevista
            <input
              type="date"
              value={scheduledOn}
              onChange={(event) => setScheduledOn(event.target.value)}
              required
            />
          </label>
          <label>
            Nota
            <input value={note} onChange={(event) => setNote(event.target.value)} required />
          </label>
          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as FollowUpDto["status"])}>
              {Object.entries(FOLLOW_UP_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button className="primary" type="submit" disabled={!dirty}>
            Guardar seguimiento
          </button>
        </form>
      ) : (
        <p>{followUp.note}</p>
      )}
      <ul className="history">
        {followUp.events.map((event) => (
          <li key={event.id}>
            {formatDateTime(event.createdAt)} · {event.description}
            {event.userName ? ` · ${event.userName}` : ""}
          </li>
        ))}
      </ul>
    </article>
  );
}
