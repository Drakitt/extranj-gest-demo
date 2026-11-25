"use client";

import React from "react";

export type FilterPillItem = {
  id: string;
  label: React.ReactNode;
  count?: number;
};

type FilterPillsProps = {
  items: FilterPillItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
};

/** Selector de pastillas. */
export function FilterPills({ items, value, onChange, label }: FilterPillsProps) {
  return (
    <div role="group" aria-label={label} className="filter-pills">
      {label ? <span className="muted">{label}</span> : null}
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            className={`filter-pill ${active ? "filter-pill-active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            {typeof item.count === "number" ? ` (${item.count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
