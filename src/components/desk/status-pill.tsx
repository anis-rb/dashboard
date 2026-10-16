import type { Status } from "@/lib/rb/types";
import { cn } from "@/lib/utils";

const TONE: Record<Status, string> = {
  "New Enquiry": "bg-primary/10 text-primary",
  "In Progress": "bg-secondary/15 text-fg",
  Pending: "bg-warn-bg text-warn",
  Deposited: "bg-ok-bg text-ok",
  Completed: "bg-fg text-surface",
  Lost: "border border-line bg-bg text-muted",
  Failed: "bg-danger-bg text-danger",
  Other: "border border-line bg-bg text-muted",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", TONE[status])}>
      {status}
    </span>
  );
}
