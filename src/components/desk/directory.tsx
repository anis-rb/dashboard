import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/rb/format";
import { useDesk } from "@/lib/rb/store";
import type { SessionUser } from "@/lib/rb/types";
import { useState } from "react";

const COPY: Record<SessionUser["role"], string> = {
  admin: "Full desk. Every lead, every approval, the theme, and the sheet.",
  partner: "Leads assigned to you, your give and take ledger, and people you bring in.",
  champion: "Refer a lead, then watch it move. Notes are yours. Status belongs to the desk that took it.",
  city_head: "Every lead in your city. Phone numbers and assignment stay read-only.",
};

export function Directory({ user, onPeople }: { user: SessionUser; onPeople: () => void }) {
  const categories = useDesk((state) => state.categories);
  const services = useDesk((state) => state.services);
  const pending = useDesk((state) => state.people.filter((person) => person.status === "pending").length);
  const editing = useEditing(user.role === "admin");
  const ordered = [...categories].sort((a, b) => a.sort - b.sort);
  const visible = user.role === "admin" ? ordered : ordered.filter((category) => category.published);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{roleLabel(user.role)}</p>
          <p className="mt-2 max-w-xl text-sm text-muted">{COPY[user.role]}</p>
        </div>
        {user.role === "admin" ? (
          <div className="flex gap-2">
            {pending > 0 ? (
              <Button variant="secondary" onClick={onPeople}>
                {pending} waiting
              </Button>
            ) : null}
            <Button variant={editing.on ? "primary" : "secondary"} onClick={editing.toggle}>
              {editing.on ? "Done editing" : "Edit home layout"}
            </Button>
          </div>
        ) : null}
      </div>
      {editing.on ? <Editor /> : null}
      <div className="grid gap-4">
        {visible.map((category) => {
          const items = services.filter((service) => service.categoryId === category.id && (editing.on || service.active));
          if (!editing.on && items.length === 0) return null;
          return (
            <article key={category.id} className="desk-panel p-4">
              <h2 className="font-display text-xl">{category.name}</h2>
              {category.blurb ? <p className="mt-1 text-sm text-muted">{category.blurb}</p> : null}
              <ul className="mt-4 divide-y divide-line">
                {items.map((service) => (
                  <li key={service.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-sm text-muted">{service.summary}</p>
                    </div>
                    <p className="text-sm tabular-nums text-muted">{service.commissionPct}% desk rate</p>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function useEditing(allowed: boolean) {
  const [on, setOn] = useState(false);
  return { on: allowed && on, toggle: () => setOn((value) => !value) };
}

function Editor() {
  const categories = useDesk((state) => state.categories);
  const services = useDesk((state) => state.services);
  const saveCategory = useDesk((state) => state.saveCategory);
  const moveCategory = useDesk((state) => state.moveCategory);
  const addCategory = useDesk((state) => state.addCategory);
  const saveService = useDesk((state) => state.saveService);
  const addService = useDesk((state) => state.addService);
  const ordered = [...categories].sort((a, b) => a.sort - b.sort);

  return (
    <div className="grid gap-4">
      {ordered.map((category, index) => (
        <div key={category.id} className="desk-panel grid gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <input className="desk-field max-w-xs" value={category.name} onChange={(e) => saveCategory({ ...category, name: e.target.value })} />
            <Button variant="secondary" disabled={index === 0} onClick={() => moveCategory(category.id, -1)}>
              Up
            </Button>
            <Button variant="secondary" disabled={index === ordered.length - 1} onClick={() => moveCategory(category.id, 1)}>
              Down
            </Button>
            <button
              type="button"
              role="switch"
              aria-checked={category.published}
              className="min-h-11 px-3 text-sm"
              onClick={() => saveCategory({ ...category, published: !category.published })}
            >
              {category.published ? "Published" : "Hidden"}
            </button>
          </div>
          <input className="desk-field" value={category.blurb} onChange={(e) => saveCategory({ ...category, blurb: e.target.value })} placeholder="Short line under the title" />
          {services
            .filter((service) => service.categoryId === category.id)
            .map((service) => (
              <div key={service.id} className="grid gap-2 border-t border-line pt-3 md:grid-cols-[1fr_1fr_6rem_auto]">
                <input className="desk-field" value={service.name} onChange={(e) => saveService({ ...service, name: e.target.value })} />
                <input className="desk-field" value={service.summary} onChange={(e) => saveService({ ...service, summary: e.target.value })} />
                <input
                  className="desk-field tabular-nums"
                  inputMode="decimal"
                  value={service.commissionPct}
                  onChange={(e) => saveService({ ...service, commissionPct: Number(e.target.value) || 0 })}
                  aria-label="Commission percent"
                />
                <button type="button" className="min-h-11 px-3 text-sm" onClick={() => saveService({ ...service, active: !service.active })}>
                  {service.active ? "Active" : "Off"}
                </button>
              </div>
            ))}
          <Button variant="secondary" onClick={() => addService(category.id)}>
            Add service
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={addCategory}>
        Add category
      </Button>
    </div>
  );
}
