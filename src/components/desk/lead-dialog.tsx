import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useNames } from "@/components/desk/lookups";
import { StatusPill } from "@/components/desk/status-pill";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { canEditLead, canViewLead, isLocked } from "@/lib/rb/access";
import { dayLabel } from "@/lib/rb/format";
import { useDesk } from "@/lib/rb/store";
import type { Lead, Quality, SessionUser, Status } from "@/lib/rb/types";
import { QUALITIES, SOURCES, STATUSES } from "@/lib/rb/types";

export function LeadDialog({
  user,
  openId,
  onOpenChange,
}: {
  user: SessionUser;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
}) {
  const leads = useDesk((state) => state.leads);
  const services = useDesk((state) => state.services);
  const admins = useDesk((state) => state.admins);
  const people = useDesk((state) => state.people);
  const saveLead = useDesk((state) => state.saveLead);
  const names = useNames();
  const isNew = openId === "new";
  const existing = !isNew && openId ? leads.find((lead) => lead.id === openId) : undefined;
  const open = openId !== null && (isNew || Boolean(existing));
  const editable = canEditLead(user, existing ?? null, isNew);
  const [draft, setDraft] = useState<Lead | null>(null);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!openId) return;
    setError("");
    setTouched(openId !== "new");
    const state = useDesk.getState();
    if (openId === "new") {
      const now = new Date().toISOString();
      setDraft({
        id: "",
        name: "",
        phone: "",
        email: "",
        serviceId: state.services[0]?.id ?? "",
        source: user.role === "champion" ? "Champion" : user.role === "partner" ? "Partner" : "Website",
        quality: "Warm",
        status: "New Enquiry",
        giveId: user.role === "admin" ? "" : user.id,
        takeId: user.role === "partner" ? user.id : "",
        ownerId: user.role === "admin" || user.role === "partner" ? user.id : "",
        dealValue: 0,
        commission: 0,
        city: user.city === "All" ? "" : user.city,
        notes: "",
        createdAt: now,
        updatedAt: now,
        history: [],
      });
      return;
    }
    const found = state.leads.find((lead) => lead.id === openId);
    setDraft(found ? { ...found, history: [...found.history] } : null);
  }, [openId, user.id, user.role, user.city]);

  const aligned = Boolean(draft && (isNew ? draft.id === "" : draft.id === openId));
  if (!draft || !aligned || (existing && !canViewLead(user, existing))) return null;

  const lock = (field: keyof Lead) => !editable || isLocked(user.role, field, isNew);
  const actors = [
    ...admins.filter((admin) => admin.active).map((admin) => ({ id: admin.id, label: `${admin.name} · Admin` })),
    ...people
      .filter((person) => person.status === "approved")
      .map((person) => ({ id: person.id, label: `${person.name} · ${person.role}` })),
  ];

  function suggest(deal: number, serviceId: string) {
    const rate = services.find((service) => service.id === serviceId)?.commissionPct ?? 0;
    return Math.round((Math.max(0, deal) * rate) / 100);
  }

  function save() {
    if (!draft) return;
    const result = saveLead(draft, user.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(isNew ? "Lead logged" : "Lead updated");
    onOpenChange(null);
  }

  const readOnlyNote =
    !isNew && user.role === "partner" && existing && existing.takeId !== user.id
      ? "You referred this lead. Status is live; editing sits with the desk that took it."
      : !isNew && user.role === "champion"
        ? "You can add a note. Status is updated by the desk that holds it."
        : "";

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(null);
      }}
      title={isNew ? "Log a lead" : draft.name || draft.id}
      description={isNew ? "It enters as a new enquiry." : draft.id}
    >
      {readOnlyNote ? <p className="mb-4 text-sm text-muted">{readOnlyNote}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input className="desk-field" disabled={lock("name")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label="Phone" hint={lock("phone") && !isNew ? "Read only" : undefined}>
          <input className="desk-field" disabled={lock("phone")} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input className="desk-field" disabled={lock("email")} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </Field>
        <Field label="City">
          <input className="desk-field" disabled={lock("city")} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </Field>
        <Field label="Status">
          {lock("status") ? (
            <div className="flex h-11 items-center">
              <StatusPill status={draft.status} />
            </div>
          ) : (
            <select className="desk-field" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Quality">
          <select className="desk-field" disabled={lock("quality")} value={draft.quality} onChange={(e) => setDraft({ ...draft, quality: e.target.value as Quality })}>
            {QUALITIES.map((quality) => (
              <option key={quality}>{quality}</option>
            ))}
          </select>
        </Field>
        <Field label="Source">
          <select className="desk-field" disabled={lock("source")} value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>
            {[...new Set([draft.source, ...SOURCES])].map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </Field>
        <Field label="Service">
          <select
            className="desk-field"
            disabled={lock("serviceId")}
            value={draft.serviceId}
            onChange={(e) => {
              const serviceId = e.target.value;
              setDraft({
                ...draft,
                serviceId,
                commission: touched ? draft.commission : suggest(draft.dealValue, serviceId),
              });
            }}
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </Field>
        <PersonField label="Give" value={draft.giveId} locked={lock("giveId")} actors={actors} names={names} onChange={(giveId) => setDraft({ ...draft, giveId })} />
        <PersonField label="Take" value={draft.takeId} locked={lock("takeId")} actors={actors} names={names} onChange={(takeId) => setDraft({ ...draft, takeId })} />
        <PersonField label="Owner" value={draft.ownerId} locked={lock("ownerId")} actors={actors} names={names} onChange={(ownerId) => setDraft({ ...draft, ownerId })} />
        <Field label="Created" hint="Read only">
          <input className="desk-field" disabled value={dayLabel(draft.createdAt)} />
        </Field>
        <Field label="Deal value">
          <input
            className="desk-field tabular-nums"
            disabled={lock("dealValue")}
            inputMode="numeric"
            value={draft.dealValue}
            onChange={(e) => {
              const dealValue = Math.max(0, Math.round(Number(e.target.value) || 0));
              setDraft({
                ...draft,
                dealValue,
                commission: touched ? draft.commission : suggest(dealValue, draft.serviceId),
              });
            }}
          />
        </Field>
        <Field label="Commission">
          <input
            className="desk-field tabular-nums"
            disabled={lock("commission")}
            inputMode="numeric"
            value={draft.commission}
            onChange={(e) => {
              setTouched(true);
              setDraft({ ...draft, commission: Math.max(0, Math.round(Number(e.target.value) || 0)) });
            }}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className="desk-field" disabled={lock("notes")} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="text-sm font-medium">Path</h3>
        {draft.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Still at the first status.</p>
        ) : (
          <ol className="mt-2 grid gap-2">
            {draft.history.map((event, index) => (
              <li key={`${event.at}-${event.to}-${index}`} className="flex flex-wrap gap-3 text-sm">
                <span className="w-32 shrink-0 text-muted tabular-nums">{dayLabel(event.at)}</span>
                <span>
                  {event.from} to {event.to}
                </span>
                <span className="text-muted">{names.get(event.by) || "Desk"}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(null)}>
          Close
        </Button>
        {editable ? <Button onClick={save}>{isNew ? "Log lead" : "Save"}</Button> : null}
      </div>
    </Modal>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function PersonField({
  label,
  value,
  locked,
  actors,
  names,
  onChange,
}: {
  label: string;
  value: string;
  locked: boolean;
  actors: { id: string; label: string }[];
  names: Map<string, string>;
  onChange: (id: string) => void;
}) {
  return (
    <Field label={label}>
      {locked ? (
        <input className="desk-field" disabled value={value ? names.get(value) || value : "Unassigned"} />
      ) : (
        <select className="desk-field" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Unassigned</option>
          {actors.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
