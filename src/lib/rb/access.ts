import type { Lead, Role, Section, SessionUser } from "@/lib/rb/types";

export type LeadField = keyof Lead;

const ALWAYS_LOCK: LeadField[] = ["id", "createdAt", "updatedAt", "history"];

export function isLocked(role: Role, field: LeadField, isNew: boolean): boolean {
  if (ALWAYS_LOCK.includes(field)) return true;
  if (role === "admin") return false;
  if (role === "champion") {
    if (isNew) return field === "giveId" || field === "takeId" || field === "ownerId" || field === "status";
    return field !== "notes";
  }
  if (role === "partner") {
    if (field === "giveId" || field === "takeId" || field === "ownerId") return true;
    if (!isNew && field === "phone") return true;
    return false;
  }
  if (field === "phone" || field === "giveId" || field === "takeId" || field === "ownerId" || field === "city") {
    return true;
  }
  return false;
}

export function canCreate(role: Role): boolean {
  return role === "admin" || role === "partner" || role === "champion";
}

export function canViewLead(actor: SessionUser, lead: Lead): boolean {
  if (actor.role === "admin") return true;
  if (actor.role === "partner") return lead.takeId === actor.id || lead.giveId === actor.id;
  if (actor.role === "champion") return lead.giveId === actor.id;
  return lead.city === actor.city;
}

export function canEditLead(actor: SessionUser, lead: Lead | null, isNew: boolean): boolean {
  if (isNew) return canCreate(actor.role);
  if (!lead) return false;
  if (!canViewLead(actor, lead)) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "partner") return lead.takeId === actor.id;
  if (actor.role === "champion") return lead.giveId === actor.id;
  return lead.city === actor.city;
}

export function deskLeads(leads: Lead[], actor: SessionUser): Lead[] {
  if (actor.role === "admin") return leads;
  if (actor.role === "partner") return leads.filter((lead) => lead.takeId === actor.id);
  if (actor.role === "champion") return leads.filter((lead) => lead.giveId === actor.id);
  return leads.filter((lead) => lead.city === actor.city);
}

export function allowedSections(role: Role): Section[] {
  if (role === "admin") {
    return ["home", "leads", "people", "marketing", "sales", "operations", "accounts", "reports", "theme", "sheet"];
  }
  if (role === "partner") return ["home", "leads", "ledger", "onboard", "sheet"];
  if (role === "champion") return ["home", "leads", "onboard", "sheet"];
  if (role === "city_head") return ["home", "leads", "sheet"];
  return ["home", "leads", "sheet"];
}

export function leadTitle(role: Role): string {
  if (role === "partner") return "Assigned leads";
  if (role === "champion") return "Referrals";
  if (role === "city_head") return "City leads";
  return "Leads";
}
