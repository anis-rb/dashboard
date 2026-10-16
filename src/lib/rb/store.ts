import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { canCreate, canEditLead, isLocked } from "@/lib/rb/access";

import { nextLeadId } from "@/lib/rb/query";

import { normalizeSnapshot } from "@/lib/rb/sheets";
import { commitDesk, loadDesk } from "@/lib/rb/server";
import { DEFAULT_THEME, inkOn } from "@/lib/rb/theme";
import type {
  Admin,
  Campaign,
  Category,
  DeptMetric,
  Lead,
  Person,
  PersonStatus,
  Quality,
  Service,
  SessionUser,
  SignupInput,
  Snapshot,
  Status,
} from "@/lib/rb/types";
import { QUALITIES, STATUSES } from "@/lib/rb/types";

const EDITABLE = [
  "name",
  "phone",
  "email",
  "serviceId",
  "source",
  "quality",
  "status",
  "giveId",
  "takeId",
  "ownerId",
  "dealValue",
  "commission",
  "city",
  "notes",
] as const;

type Editable = (typeof EDITABLE)[number];

interface DeskData {
  booted: boolean;
  admins: Admin[];
  people: Person[];
  leads: Lead[];
  categories: Category[];
  services: Service[];
  theme: Snapshot["theme"];
  campaigns: Campaign[];
  departments: DeptMetric[];
  sessionUserId: string | null;
  revision: string;
  syncEnabled: boolean;
  lastSync: string | null;
  syncError: string | null;
  syncing: boolean;
}

interface DeskActions {
  boot: (snap: Snapshot, revision?: string) => void;
  activateSession: (id: string) => void;
  signup: (input: SignupInput) => { ok: true } | { ok: false; error: string };
  setPersonStatus: (id: string, status: PersonStatus) => void;
  saveLead: (draft: Lead, actorId: string) => { ok: true; id: string } | { ok: false; error: string };
  setTheme: (patch: Partial<Snapshot["theme"]>) => void;
  saveCategory: (row: Category) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  addCategory: () => void;
  saveService: (row: Service) => void;
  addService: (categoryId: string) => void;
  saveCampaign: (row: Campaign) => void;
  addCampaign: () => void;
  removeCampaign: (id: string) => void;
  saveMetric: (id: string, patch: Partial<DeptMetric>) => void;
  replaceFromSheet: (snap: Snapshot, revision?: string) => void;
}

export type DeskState = DeskData & DeskActions;

const memory = new Map<string, string>();

const storage = createJSONStorage(() => ({
  getItem: (name) => {
    if (typeof window === "undefined") return memory.get(name) ?? null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") {
      memory.set(name, value);
      return;
    }
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === "undefined") {
      memory.delete(name);
      return;
    }
    window.localStorage.removeItem(name);
  },
}));

function blankData(): DeskData {
  return {
    booted: false,
    admins: [],
    people: [],
    leads: [],
    categories: [],
    services: [],
    theme: DEFAULT_THEME,
    campaigns: [],
    departments: [],
    sessionUserId: null,
    revision: "",
    syncEnabled: false,
    lastSync: null,
    syncError: null,
    syncing: false,
  };
}

export function toSession(data: Pick<DeskData, "admins" | "people">, id: string | null): SessionUser | null {
  if (!id) return null;
  const admin = data.admins.find((item) => item.id === id);
  if (admin?.active) {
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
      city: "All",
      permissions: admin.permissions,
    };
  }
  const person = data.people.find((item) => item.id === id);
  if (person?.status === "approved") {
    return {
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      city: person.city,
      permissions: "",
    };
  }
  return null;
}

function applyDraft(actor: SessionUser, prev: Lead, draft: Lead, isNew: boolean): Lead {
  const next: Lead = { ...prev, history: [...prev.history], updatedAt: new Date().toISOString() };
  for (const field of EDITABLE) {
    if (isLocked(actor.role, field, isNew)) continue;
    writeField(next, field, draft);
  }
  if (!isNew && next.status !== prev.status) {
    next.history = [
      ...prev.history,
      { at: next.updatedAt, from: prev.status, to: next.status, by: actor.id },
    ];
  }
  next.dealValue = Math.max(0, Math.round(next.dealValue || 0));
  next.commission = Math.max(0, Math.round(next.commission || 0));
  return next;
}

function writeField(next: Lead, field: Editable, draft: Lead) {
  if (field === "dealValue" || field === "commission") {
    next[field] = Number(draft[field]) || 0;
    return;
  }
  if (field === "status") {
    if ((STATUSES as readonly string[]).includes(draft.status)) next.status = draft.status;
    return;
  }
  if (field === "quality") {
    if ((QUALITIES as readonly string[]).includes(draft.quality)) next.quality = draft.quality as Quality;
    return;
  }
  if (field === "name" || field === "phone" || field === "email" || field === "city" || field === "notes") {
    next[field] = draft[field].trim();
    return;
  }
  next[field] = draft[field];
}

function snapshotOf(data: DeskData): Snapshot {
  return {
    admins: data.admins,
    registration: data.people,
    leads: data.leads,
    categories: data.categories,
    services: data.services,
    theme: data.theme,
    marketing: data.campaigns,
    departments: data.departments,
  };
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushAgain = false;

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      ...blankData(),
      boot: (snap, revision = "") => {
        set({
          booted: true,
          admins: snap.admins,
          people: snap.registration,
          leads: snap.leads,
          categories: snap.categories,
          services: snap.services,
          theme: snap.theme,
          campaigns: snap.marketing,
          departments: snap.departments,
          sessionUserId: null,
          revision,
          syncEnabled: true,
        });
      },
      activateSession: (id) => set({ sessionUserId: id }),
      signup: (input) => {
        const email = input.email.trim().toLowerCase();
        if (!input.name.trim()) return { ok: false, error: "Name is required." };
        if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
          return { ok: false, error: "Enter a valid email." };
        }
        if (!input.phone.trim()) return { ok: false, error: "Phone is required." };
        if (!input.city.trim()) return { ok: false, error: "City is required." };
        const taken =
          get().admins.some((item) => item.email.toLowerCase() === email) ||
          get().people.some((item) => item.email.toLowerCase() === email);
        if (taken) return { ok: false, error: "That email is already on the desk." };
        const person: Person = {
          id: `u-${Date.now().toString(36)}`,
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          role: input.role,
          city: input.city.trim(),
          status: "pending",
          sponsorId: input.sponsorId,
          passwordHash: "",
          createdAt: new Date().toISOString(),
        };
        set({ people: [person, ...get().people] });
        queuePush();
        return { ok: true };
      },
      setPersonStatus: (id, status) => {
        set({
          people: get().people.map((person) => (person.id === id ? { ...person, status } : person)),
        });
        queuePush();
      },
      saveLead: (draft, actorId) => {
        const state = get();
        const actor = toSession(state, actorId);
        if (!actor) return { ok: false, error: "Sign in again." };
        const existing = state.leads.find((lead) => lead.id === draft.id);
        const isNew = !existing;
        if (isNew && !canCreate(actor.role)) return { ok: false, error: "You cannot log a lead." };
        if (!isNew && existing && !canEditLead(actor, existing, false)) {
          return { ok: false, error: "This lead is locked." };
        }
        if (!draft.name.trim()) return { ok: false, error: "Name is required." };
        if (!draft.phone.trim()) return { ok: false, error: "Phone is required." };
        const now = new Date().toISOString();
        const base: Lead = existing ?? {
          id: nextLeadId(state.leads),
          name: "",
          phone: "",
          email: "",
          serviceId: draft.serviceId || state.services[0]?.id || "",
          source: draft.source || "Website",
          quality: "Warm",
          status: "New Enquiry" as Status,
          giveId: actor.role === "admin" ? "" : actor.id,
          takeId: actor.role === "partner" ? actor.id : "",
          ownerId: actor.role === "partner" || actor.role === "admin" ? actor.id : "",
          dealValue: 0,
          commission: 0,
          city: actor.city === "All" ? "" : actor.city,
          notes: "",
          createdAt: now,
          updatedAt: now,
          history: [],
        };
        const next = applyDraft(actor, base, draft, isNew);
        if (!next.city.trim()) return { ok: false, error: "City is required." };
        const leads = existing
          ? state.leads.map((lead) => (lead.id === next.id ? next : lead))
          : [next, ...state.leads];
        set({ leads });
        queuePush();
        return { ok: true, id: next.id };
      },
      setTheme: (patch) => {
        const next = { ...get().theme, ...patch };
        if (patch.primary && !patch.primaryFg) next.primaryFg = inkOn(next.primary);
        set({ theme: next });
        queuePush();
      },
      saveCategory: (row) => {
        set({ categories: get().categories.map((item) => (item.id === row.id ? row : item)) });
        queuePush();
      },
      moveCategory: (id, dir) => {
        const list = [...get().categories].sort((a, b) => a.sort - b.sort);
        const index = list.findIndex((item) => item.id === id);
        const target = index + dir;
        if (index < 0 || target < 0 || target >= list.length) return;
        const moved = list[index];
        if (!moved) return;
        list.splice(index, 1);
        list.splice(target, 0, moved);
        set({
          categories: get().categories.map((item) => {
            const at = list.findIndex((row) => row.id === item.id);
            return { ...item, sort: at + 1 };
          }),
        });
        queuePush();
      },
      addCategory: () => {
        const sort = get().categories.reduce((max, item) => Math.max(max, item.sort), 0) + 1;
        const row: Category = {
          id: `cat-${Date.now().toString(36)}`,
          name: "New category",
          blurb: "",
          sort,
          published: false,
        };
        set({ categories: [...get().categories, row] });
        queuePush();
      },
      saveService: (row) => {
        set({ services: get().services.map((item) => (item.id === row.id ? row : item)) });
        queuePush();
      },
      addService: (categoryId) => {
        const row: Service = {
          id: `svc-${Date.now().toString(36)}`,
          categoryId,
          name: "New service",
          summary: "",
          commissionPct: 1,
          active: false,
        };
        set({ services: [...get().services, row] });
        queuePush();
      },
      saveCampaign: (row) => {
        set({ campaigns: get().campaigns.map((item) => (item.id === row.id ? row : item)) });
        queuePush();
      },
      addCampaign: () => {
        const row: Campaign = {
          id: `cmp-${Date.now().toString(36)}`,
          name: "New campaign",
          channel: "Meta",
          spend: 0,
          leads: 0,
          status: "Live",
          start: new Date().toISOString().slice(0, 10),
          end: "",
          note: "",
        };
        set({ campaigns: [row, ...get().campaigns] });
        queuePush();
      },
      removeCampaign: (id) => {
        set({ campaigns: get().campaigns.filter((item) => item.id !== id) });
        queuePush();
      },
      saveMetric: (id, patch) => {
        set({
          departments: get().departments.map((item) =>
            item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          ),
        });
        queuePush();
      },
      replaceFromSheet: (snap, revision = get().revision) => {
        const sessionUserId = get().sessionUserId;
        const next = {
          admins: snap.admins,
          people: snap.registration,
          leads: snap.leads,
          categories: snap.categories,
          services: snap.services,
          theme: snap.theme,
          campaigns: snap.marketing,
          departments: snap.departments,
        };
        const still = toSession(next, sessionUserId);
        set({
          ...next,
          sessionUserId: still ? sessionUserId : null,
          lastSync: new Date().toISOString(),
          syncError: null,
          revision,
          syncEnabled: true,
        });
      },
    }),
    {
      name: "rb-desk-server-v2",
      skipHydration: true,
      storage,
      partialize: () => ({}),
    },
  ),
);

function queuePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const state = useDesk.getState();
    if (!state.syncEnabled) return;
    void pushNow().catch(() => {});
  }, 700);
}

function fail(err: unknown) {
  return err instanceof Error ? err.message : "The sheet could not be reached.";
}

export async function pushNow() {
  const state = useDesk.getState();
  if (state.syncing) {
    pushAgain = true;
    return;
  }
  useDesk.setState({ syncing: true, syncError: null });
  try {
    const result = await commitDesk({ data: { snapshot: snapshotOf(useDesk.getState()), revision: state.revision } });
    useDesk.setState({ syncing: false, syncError: null, lastSync: new Date().toISOString(), revision: typeof result.revision === "string" ? result.revision : state.revision });
  } catch (err) {
    useDesk.setState({ syncing: false, syncError: fail(err) });
    throw err;
  } finally {
    if (pushAgain) { pushAgain = false; queuePush(); }
  }
}

export async function pullNow() {
  if (useDesk.getState().syncing) return;
  useDesk.setState({ syncing: true, syncError: null });
  try {
    const result = await loadDesk();
    const profile = result.profile as { id?: string; status?: string } | null;
    if (!profile?.id || profile.status !== "approved") throw new Error("This account is not approved for RB Desk.");
    useDesk.getState().replaceFromSheet(normalizeSnapshot(result.snapshot), String(result.revision ?? ""));
    useDesk.setState({ syncing: false });
  } catch (err) {
    useDesk.setState({ syncing: false, syncError: fail(err) });
    throw err;
  }
}
