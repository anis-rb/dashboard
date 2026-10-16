export const STATUSES = [
  "New Enquiry",
  "In Progress",
  "Pending",
  "Deposited",
  "Completed",
  "Lost",
  "Failed",
  "Other",
] as const;

export type Status = (typeof STATUSES)[number];

export const SOURCES = [
  "Website",
  "Champion",
  "Partner",
  "Walk-in",
  "Campaign",
  "City desk",
] as const;

export type Source = (typeof SOURCES)[number];

export const QUALITIES = ["Hot", "Warm", "Cold"] as const;
export type Quality = (typeof QUALITIES)[number];

export type Role = "admin" | "partner" | "champion" | "city_head";
export type PersonRole = Exclude<Role, "admin">;
export type PersonStatus = "pending" | "approved" | "rejected";

export interface StatusEvent {
  at: string;
  from: string;
  to: string;
  by: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  permissions: string;
  active: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PersonRole;
  city: string;
  status: PersonStatus;
  sponsorId: string;
  passwordHash: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceId: string;
  source: string;
  quality: Quality;
  status: Status;
  giveId: string;
  takeId: string;
  ownerId: string;
  dealValue: number;
  commission: number;
  city: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  history: StatusEvent[];
}

export interface Category {
  id: string;
  name: string;
  blurb: string;
  sort: number;
  published: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  summary: string;
  commissionPct: number;
  active: boolean;
}

export interface ThemeConfig {
  primary: string;
  primaryFg: string;
  secondary: string;
  background: string;
  surface: string;
  ink: string;
  sidebar: string;
  line: string;
  radius: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  spend: number;
  leads: number;
  status: "Live" | "Paused" | "Ended";
  start: string;
  end: string;
  note: string;
}

export interface DeptMetric {
  id: string;
  dept: "sales" | "operations" | "accounts";
  label: string;
  value: string;
  note: string;
  updatedAt: string;
}

export interface Snapshot {
  admins: Admin[];
  registration: Person[];
  leads: Lead[];
  categories: Category[];
  services: Service[];
  theme: ThemeConfig;
  marketing: Campaign[];
  departments: DeptMetric[];
}

export type DatePreset =
  | "any"
  | "today"
  | "yesterday"
  | "7"
  | "30"
  | "month"
  | "lastmonth"
  | "custom";

export interface FilterState {
  query: string;
  preset: DatePreset;
  from: string;
  to: string;
  statuses: Status[];
  excludeStatus: boolean;
  partners: string[];
  sources: string[];
  owners: string[];
  qualities: Quality[];
  services: string[];
}

export const emptyFilters = (): FilterState => ({
  query: "",
  preset: "any",
  from: "",
  to: "",
  statuses: [],
  excludeStatus: false,
  partners: [],
  sources: [],
  owners: [],
  qualities: [],
  services: [],
});

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  city: string;
  permissions: string;
}

export type Section =
  | "home"
  | "leads"
  | "people"
  | "ledger"
  | "onboard"
  | "marketing"
  | "sales"
  | "operations"
  | "accounts"
  | "reports"
  | "theme"
  | "sheet";

export interface SignupInput {
  name: string;
  email: string;
  phone: string;
  city: string;
  role: PersonRole;
  password?: string;
  sponsorId: string;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "bad" | "pending" | "rejected" | "inactive" };
