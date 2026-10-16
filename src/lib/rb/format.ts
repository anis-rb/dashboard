import { format, formatDistanceToNow, parseISO } from "date-fns";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function inr(n: number): string {
  return INR.format(Math.round(Number.isFinite(n) ? n : 0));
}

export function dayLabel(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy");
}

export function ago(iso: string): string {
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function roleLabel(role: string): string {
  if (role === "city_head") return "City head";
  if (role === "admin") return "Admin";
  if (role === "partner") return "Partner";
  if (role === "champion") return "Champion";
  return role;
}
