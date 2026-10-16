import { hashSecret } from "@/lib/rb/hash";
import { DEFAULT_THEME } from "@/lib/rb/theme";
import type {
  Admin,
  Campaign,
  Category,
  DeptMetric,
  Lead,
  Person,
  Quality,
  Service,
  Snapshot,
  Source,
  Status,
  StatusEvent,
} from "@/lib/rb/types";

export const PREVIEW_PASSWORD = "open-desk";

export const PREVIEW_SEATS = [
  { id: "a-mira", role: "Admin", name: "Mira Shah", detail: "Full desk" },
  { id: "p-arun", role: "Partner", name: "Arun Mehta", detail: "Mumbai" },
  { id: "c-leela", role: "Champion", name: "Leela Nair", detail: "Referrals" },
  { id: "h-sana", role: "City head", name: "Sana Kapoor", detail: "Delhi" },
] as const;

export const PENDING_DEMO = {
  email: "vikram.joshi@rbdesk.app",
  name: "Vikram Joshi",
};

const RATES: Record<string, number> = {
  "svc-buy": 0.8,
  "svc-resale": 1,
  "svc-rent": 2,
  "svc-loan": 0.4,
  "svc-credit": 0.6,
  "svc-interior": 5,
  "svc-insure": 12,
};

type Row = [string, string, Status, string, string, string, Source, string, Quality, number, number, string];

const ROWS: Row[] = [
  ["Aisha Khan", "+91 98110 02101", "New Enquiry", "c-leela", "", "a-mira", "Champion", "svc-buy", "Hot", 0, 18500000, "Mumbai"],
  ["Dev Patel", "+91 98220 03344", "New Enquiry", "c-imran", "", "a-mira", "Website", "svc-loan", "Warm", 0, 6400000, "Hyderabad"],
  ["Nisha Rao", "+91 99001 12233", "New Enquiry", "c-leela", "p-arun", "p-arun", "Champion", "svc-interior", "Hot", 1, 2200000, "Mumbai"],
  ["Farhan Ali", "+91 98111 10099", "New Enquiry", "p-kavya", "", "a-mira", "Partner", "svc-credit", "Cold", 1, 4500000, "Bengaluru"],
  ["Tara Menon", "+91 98450 11122", "New Enquiry", "c-imran", "p-rohan", "p-rohan", "Campaign", "svc-buy", "Warm", 2, 9200000, "Pune"],
  ["Kabir Seth", "+91 98330 04455", "New Enquiry", "c-leela", "p-arun", "p-arun", "Walk-in", "svc-rent", "Cold", 3, 850000, "Mumbai"],
  ["Rhea Kapoor", "+91 98112 23344", "In Progress", "c-leela", "p-arun", "p-arun", "Champion", "svc-buy", "Hot", 4, 24000000, "Mumbai"],
  ["Arvind Rao", "+91 98440 99887", "In Progress", "c-imran", "p-kavya", "p-kavya", "Website", "svc-loan", "Warm", 6, 7800000, "Bengaluru"],
  ["Meher Das", "+91 98225 56677", "In Progress", "p-rohan", "p-rohan", "p-rohan", "Partner", "svc-resale", "Hot", 8, 15600000, "Pune"],
  ["Zoya Ahmed", "+91 98190 90909", "In Progress", "c-leela", "p-arun", "p-arun", "City desk", "svc-insure", "Warm", 5, 48000, "Mumbai"],
  ["Nikhil Jain", "+91 98765 43210", "In Progress", "c-imran", "p-kavya", "p-kavya", "Campaign", "svc-interior", "Hot", 9, 3100000, "Bengaluru"],
  ["Pooja Nair", "+91 97444 55566", "In Progress", "h-sana", "p-arun", "a-mira", "City desk", "svc-buy", "Warm", 11, 13200000, "Delhi"],
  ["Harsh Vardhan", "+91 98120 03344", "In Progress", "c-leela", "p-rohan", "p-rohan", "Champion", "svc-loan", "Cold", 7, 5100000, "Pune"],
  ["Anjali Gupta", "+91 98989 89898", "Pending", "c-leela", "p-arun", "p-arun", "Champion", "svc-buy", "Hot", 12, 27500000, "Mumbai"],
  ["Vivek Iyer", "+91 98450 01122", "Pending", "c-imran", "p-kavya", "p-kavya", "Website", "svc-loan", "Warm", 14, 8900000, "Bengaluru"],
  ["Sara Qureshi", "+91 98221 10099", "Pending", "p-arun", "p-arun", "p-arun", "Walk-in", "svc-resale", "Hot", 10, 19800000, "Mumbai"],
  ["Manoj Pillai", "+91 97441 23789", "Pending", "c-leela", "p-rohan", "p-rohan", "Campaign", "svc-credit", "Warm", 16, 3600000, "Pune"],
  ["Diya Shah", "+91 98123 45678", "Pending", "h-sana", "p-kavya", "a-mira", "City desk", "svc-interior", "Hot", 13, 5400000, "Delhi"],
  ["Kunal Mehta", "+91 98331 12233", "Deposited", "c-leela", "p-arun", "p-arun", "Champion", "svc-buy", "Hot", 18, 31000000, "Mumbai"],
  ["Lakshmi Narayan", "+91 98456 78901", "Deposited", "c-imran", "p-kavya", "p-kavya", "Partner", "svc-loan", "Warm", 21, 12000000, "Bengaluru"],
  ["Omar Farooq", "+91 98180 07766", "Deposited", "p-rohan", "p-rohan", "p-rohan", "Walk-in", "svc-resale", "Hot", 15, 14200000, "Pune"],
  ["Anita Dsouza", "+91 98220 01199", "Deposited", "c-leela", "p-arun", "p-arun", "Campaign", "svc-interior", "Warm", 20, 4100000, "Mumbai"],
  ["Rahul Banerjee", "+91 98300 99112", "Completed", "c-leela", "p-arun", "p-arun", "Champion", "svc-buy", "Hot", 40, 22000000, "Mumbai"],
  ["Smita Kulkarni", "+91 98234 56712", "Completed", "c-imran", "p-kavya", "p-kavya", "Website", "svc-loan", "Warm", 45, 6700000, "Bengaluru"],
  ["Joseph Mathew", "+91 98470 12345", "Completed", "p-arun", "p-arun", "p-arun", "Partner", "svc-resale", "Hot", 38, 16500000, "Mumbai"],
  ["Neha Bhatt", "+91 98112 20099", "Completed", "c-leela", "p-rohan", "p-rohan", "Campaign", "svc-rent", "Warm", 33, 720000, "Pune"],
  ["Aditya Rao", "+91 99008 87766", "Completed", "h-sana", "p-arun", "a-mira", "City desk", "svc-buy", "Hot", 55, 19800000, "Delhi"],
  ["Fatima Sheikh", "+91 98221 14455", "Completed", "c-imran", "p-kavya", "p-kavya", "Champion", "svc-insure", "Cold", 28, 36000, "Hyderabad"],
  ["Girish Pai", "+91 98440 02211", "Completed", "p-rohan", "p-rohan", "p-rohan", "Walk-in", "svc-credit", "Warm", 50, 5200000, "Pune"],
  ["Helina George", "+91 98170 03344", "Completed", "c-leela", "p-arun", "p-arun", "Champion", "svc-interior", "Hot", 36, 2800000, "Mumbai"],
  ["Vikrant Oberoi", "+91 98113 33444", "Lost", "c-leela", "p-arun", "p-arun", "Website", "svc-buy", "Cold", 22, 15000000, "Mumbai"],
  ["Pallavi Joshi", "+91 98226 67788", "Lost", "c-imran", "p-kavya", "p-kavya", "Campaign", "svc-loan", "Cold", 26, 4300000, "Bengaluru"],
  ["Ramesh Iyer", "+91 98450 99881", "Lost", "p-rohan", "p-rohan", "p-rohan", "Walk-in", "svc-resale", "Warm", 19, 11000000, "Pune"],
  ["Shalini Das", "+91 98334 45566", "Lost", "h-sana", "", "a-mira", "City desk", "svc-rent", "Cold", 30, 600000, "Delhi"],
  ["Imtiaz Khan", "+91 98115 56677", "Failed", "c-leela", "p-arun", "p-arun", "Champion", "svc-loan", "Warm", 24, 9000000, "Mumbai"],
  ["Bharat Reddy", "+91 98480 11223", "Failed", "c-imran", "p-kavya", "p-kavya", "Website", "svc-credit", "Cold", 29, 2500000, "Hyderabad"],
  ["Carol Dsouza", "+91 98220 08877", "Failed", "p-arun", "p-rohan", "p-rohan", "Partner", "svc-buy", "Hot", 17, 13400000, "Pune"],
  ["Elena Vaz", "+91 98112 27788", "Other", "c-leela", "", "a-mira", "Walk-in", "svc-insure", "Cold", 8, 22000, "Mumbai"],
  ["Yash Thakur", "+91 98330 02211", "Other", "c-imran", "p-kavya", "p-kavya", "Campaign", "svc-interior", "Warm", 27, 1900000, "Bengaluru"],
  ["Noor Abdullah", "+91 97440 01122", "Other", "h-sana", "p-arun", "a-mira", "City desk", "svc-loan", "Warm", 6, 3500000, "Delhi"],
];

const NOTES: Record<Status, string[]> = {
  "New Enquiry": ["Asked for a callback after six.", "Budget still soft. Wants options.", "Site visit requested this week."],
  "In Progress": ["Shortlist of three is with the family.", "Documents asked for, not in yet.", "Second viewing booked."],
  Pending: ["Token discussion is open.", "Sanction file is with the lender.", "Legal is reading the draft."],
  Deposited: ["Token is in. Agreement slot booked.", "Deposit receipt shared with accounts."],
  Completed: ["Handed to accounts for settlement.", "Possession note filed."],
  Lost: ["Went quiet after the second call.", "Chose another desk."],
  Failed: ["Eligibility rejected by the lender.", "Title objection, file closed."],
  Other: ["Paused for a reason outside the main path.", "Holding until the next quarter."],
};

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now);
  d.setHours(10, 30, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function pathFor(status: Status): Status[] {
  const pipe: Status[] = ["New Enquiry", "In Progress", "Pending", "Deposited", "Completed"];
  if (status === "Lost" || status === "Failed") return ["New Enquiry", "In Progress", status];
  if (status === "Other") return ["New Enquiry", "Other"];
  const idx = pipe.indexOf(status);
  return pipe.slice(0, idx + 1);
}

function historyFor(status: Status, created: Date, by: string, now: Date): StatusEvent[] {
  const path = pathFor(status);
  const steps = path.length - 1;
  if (steps <= 0) return [];
  const start = created.getTime();
  const span = Math.max(now.getTime() - start, 0);
  const events: StatusEvent[] = [];
  for (let i = 1; i < path.length; i++) {
    events.push({
      at: new Date(start + (span * i) / steps).toISOString(),
      from: path[i - 1] ?? "",
      to: path[i] ?? status,
      by,
    });
  }
  return events;
}

function mail(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@clients.rbdesk.app`;
}

function people(now: Date, hash: string): Person[] {
  const at = (days: number) => daysAgo(now, days).toISOString();
  return [
    { id: "p-arun", name: "Arun Mehta", email: "arun.mehta@rbdesk.app", phone: "+91 98200 11001", role: "partner", city: "Mumbai", status: "approved", sponsorId: "a-mira", passwordHash: hash, createdAt: at(120) },
    { id: "p-kavya", name: "Kavya Iyer", email: "kavya.iyer@rbdesk.app", phone: "+91 98450 22002", role: "partner", city: "Bengaluru", status: "approved", sponsorId: "a-mira", passwordHash: hash, createdAt: at(100) },
    { id: "p-rohan", name: "Rohan Desai", email: "rohan.desai@rbdesk.app", phone: "+91 98220 33003", role: "partner", city: "Pune", status: "approved", sponsorId: "a-mira", passwordHash: hash, createdAt: at(90) },
    { id: "c-leela", name: "Leela Nair", email: "leela.nair@rbdesk.app", phone: "+91 98111 44004", role: "champion", city: "Mumbai", status: "approved", sponsorId: "p-arun", passwordHash: hash, createdAt: at(70) },
    { id: "c-imran", name: "Imran Qureshi", email: "imran.qureshi@rbdesk.app", phone: "+91 98480 55005", role: "champion", city: "Hyderabad", status: "approved", sponsorId: "p-kavya", passwordHash: hash, createdAt: at(64) },
    { id: "h-sana", name: "Sana Kapoor", email: "sana.kapoor@rbdesk.app", phone: "+91 98100 66006", role: "city_head", city: "Delhi", status: "approved", sponsorId: "a-mira", passwordHash: hash, createdAt: at(80) },
    { id: "p-vikram", name: "Vikram Joshi", email: PENDING_DEMO.email, phone: "+91 98290 77007", role: "partner", city: "Jaipur", status: "pending", sponsorId: "c-leela", passwordHash: hash, createdAt: at(2) },
    { id: "c-nitin", name: "Nitin Pal", email: "nitin.pal@rbdesk.app", phone: "+91 98330 88008", role: "champion", city: "Pune", status: "rejected", sponsorId: "p-rohan", passwordHash: hash, createdAt: at(9) },
  ];
}

export function createSeed(now = new Date()): Snapshot {
  const hash = hashSecret(PREVIEW_PASSWORD);
  const admin: Admin = {
    id: "a-mira",
    name: "Mira Shah",
    email: "mira.shah@rbdesk.app",
    phone: "+91 98100 00001",
    passwordHash: hash,
    permissions: "full",
    active: true,
  };
  const categories: Category[] = [
    { id: "cat-property", name: "Property", blurb: "Buy, sell, and lease mandates.", sort: 1, published: true },
    { id: "cat-finance", name: "Finance", blurb: "Loans and credit that actually clear.", sort: 2, published: true },
    { id: "cat-care", name: "After possession", blurb: "Interiors and cover, once the keys move.", sort: 3, published: true },
  ];
  const services: Service[] = [
    { id: "svc-buy", categoryId: "cat-property", name: "Home purchase", summary: "Primary sale, end to end.", commissionPct: 0.8, active: true },
    { id: "svc-resale", categoryId: "cat-property", name: "Resale", summary: "Secondary market mandates.", commissionPct: 1, active: true },
    { id: "svc-rent", categoryId: "cat-property", name: "Rental", summary: "Lease origination.", commissionPct: 2, active: true },
    { id: "svc-loan", categoryId: "cat-finance", name: "Home loan", summary: "Sanction through disbursal.", commissionPct: 0.4, active: true },
    { id: "svc-credit", categoryId: "cat-finance", name: "Business credit", summary: "Working-capital introductions.", commissionPct: 0.6, active: true },
    { id: "svc-interior", categoryId: "cat-care", name: "Interiors", summary: "Design and fit-out.", commissionPct: 5, active: true },
    { id: "svc-insure", categoryId: "cat-care", name: "Home insurance", summary: "Cover bound at possession.", commissionPct: 12, active: true },
  ];
  const leads: Lead[] = ROWS.map((row, index) => {
    const [name, phone, status, giveId, takeId, ownerId, source, serviceId, quality, days, deal, city] = row;
    const created = daysAgo(now, days);
    const by = ownerId || giveId || "a-mira";
    const history = historyFor(status, created, by, now);
    const bank = NOTES[status];
    return {
      id: `LD-${24001 + index}`,
      name,
      phone,
      email: mail(name),
      serviceId,
      source,
      quality,
      status,
      giveId,
      takeId,
      ownerId,
      dealValue: deal,
      commission: Math.round((deal * (RATES[serviceId] ?? 1)) / 100),
      city,
      notes: bank[index % bank.length] ?? "",
      createdAt: created.toISOString(),
      updatedAt: history.at(-1)?.at ?? created.toISOString(),
      history,
    };
  });
  const marketing: Campaign[] = [
    { id: "cmp-monsoon", name: "Monsoon home fair", channel: "Meta", spend: 84000, leads: 36, status: "Live", start: "2026-09-01", end: "2026-10-31", note: "Creative is the balcony series." },
    { id: "cmp-circle", name: "Champion circle", channel: "Referral", spend: 12000, leads: 18, status: "Ended", start: "2026-07-01", end: "2026-09-30", note: "Closed with the quarter." },
    { id: "cmp-delhi", name: "Delhi city blitz", channel: "Google", spend: 56000, leads: 22, status: "Paused", start: "2026-10-01", end: "2026-10-31", note: "Paused pending landing page." },
  ];
  const stamp = now.toISOString();
  const departments: DeptMetric[] = [
    { id: "sal-1", dept: "sales", label: "Target this month", value: "₹4.5 Cr", note: "Posted by Mira on Monday.", updatedAt: stamp },
    { id: "sal-2", dept: "sales", label: "Site visits booked", value: "11", note: "Includes partner-hosted visits.", updatedAt: stamp },
    { id: "sal-3", dept: "sales", label: "Average cycle", value: "18 days", note: "New enquiry to deposit.", updatedAt: stamp },
    { id: "ops-1", dept: "operations", label: "Files with legal", value: "7", note: "Two are Delhi.", updatedAt: stamp },
    { id: "ops-2", dept: "operations", label: "SLA breaches", value: "1", note: "A lender file older than 5 days.", updatedAt: stamp },
    { id: "ops-3", dept: "operations", label: "Vendor slots open", value: "4", note: "Interiors, this fortnight.", updatedAt: stamp },
    { id: "acc-1", dept: "accounts", label: "Commission payable", value: "₹18.4 L", note: "Deposited and completed, not settled.", updatedAt: stamp },
    { id: "acc-2", dept: "accounts", label: "Settled this month", value: "₹6.2 L", note: "Partner payouts cleared.", updatedAt: stamp },
    { id: "acc-3", dept: "accounts", label: "Deposits held", value: "₹42 L", note: "Token amounts in the client account.", updatedAt: stamp },
  ];
  return {
    admins: [admin],
    registration: people(now, hash),
    leads,
    categories,
    services,
    theme: { ...DEFAULT_THEME },
    marketing,
    departments,
  };
}
