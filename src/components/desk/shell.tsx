import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart3,
  Briefcase,
  Database,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  Palette,
  Search,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth/client";
import { Directory } from "@/components/desk/directory";
import { LeadDialog } from "@/components/desk/lead-dialog";
import { Leads } from "@/components/desk/leads";
import { Ledger } from "@/components/desk/ledger";
import { Onboard } from "@/components/desk/onboard";
import { People } from "@/components/desk/people";
import { Reports } from "@/components/desk/reports";
import { SheetsPanel } from "@/components/desk/sheets-panel";
import { ThemePanel } from "@/components/desk/theme-panel";
import { DeptView, MarketingView } from "@/components/desk/work";
import { allowedSections, leadTitle } from "@/lib/rb/access";
import { ago, roleLabel } from "@/lib/rb/format";
import { useDesk } from "@/lib/rb/store";
import type { Section, SessionUser } from "@/lib/rb/types";
import { emptyFilters, type FilterState } from "@/lib/rb/types";
import { cn } from "@/lib/utils";

const ICONS = {
  home: Home,
  leads: LayoutDashboard,
  people: Users,
  ledger: Wallet,
  onboard: UserPlus,
  marketing: Megaphone,
  sales: Briefcase,
  operations: Wrench,
  accounts: Landmark,
  reports: BarChart3,
  theme: Palette,
  sheet: Database,
} as const;

export function Shell({ user }: { user: SessionUser }) {
  const logout = () => { void signOut("/").catch(() => toast.error("Sign-out failed. Please retry.")); };
  const pending = useDesk((state) => state.people.filter((person) => person.status === "pending").length);
  const syncEnabled = useDesk((state) => state.syncEnabled);
  const lastSync = useDesk((state) => state.lastSync);
  const syncError = useDesk((state) => state.syncError);
  const syncing = useDesk((state) => state.syncing);
  const [section, setSection] = useState<Section>("leads");
  const [nav, setNav] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const sections = useMemo(() => allowedSections(user.role), [user.role]);

  useEffect(() => {
    setOpenLead(null);
  }, [section]);

  const labels = useMemo(() => {
    const map: Record<Section, string> = {
      home: "Home",
      leads: leadTitle(user.role),
      people: "People",
      ledger: "Ledger",
      onboard: "Onboard",
      marketing: "Marketing",
      sales: "Sales",
      operations: "Operations",
      accounts: "Accounts",
      reports: "Reports",
      theme: "Theme",
      sheet: "Sheet",
    };
    return map;
  }, [user.role]);

  function go(next: Section) {
    setSection(next);
    setNav(false);
  }

  const syncLabel = syncing
    ? "Syncing"
    : syncError
      ? "Sheet issue"
      : !syncEnabled
        ? "Not connected"
        : lastSync
          ? `Sheet ${ago(lastSync)}`
          : "Sheet connected";

  return (
    <div className="min-h-screen bg-bg text-fg md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden bg-sidebar text-sidebar-fg md:flex md:min-h-screen md:flex-col md:justify-between md:p-4">
        <div>
          <p className="px-3 font-display text-xl">RB Desk</p>
          <nav className="mt-6 grid gap-1" aria-label="Desk">
            {sections.map((id) => (
              <NavButton
                key={id}
                icon={ICONS[id]}
                label={labels[id]}
                active={section === id}
                badge={id === "people" ? pending : 0}
                onClick={() => go(id)}
              />
            ))}
          </nav>
        </div>
        <div className="px-3">
          <p className="truncate text-sm">{user.name}</p>
          <p className="truncate text-xs text-sidebar-muted">{roleLabel(user.role)}</p>
          <button type="button" className="pressable mt-3 flex min-h-11 items-center gap-2 text-sm text-sidebar-muted" onClick={logout}>
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="pressable flex size-11 items-center justify-center rounded-sm border border-line md:hidden"
              aria-label="Open menu"
              onClick={() => setNav(true)}
            >
              <Menu className="size-4" />
            </button>
            <h1 className="font-display text-xl">{labels[section]}</h1>
            <button type="button" className="pressable ml-auto min-h-11 shrink-0 px-2 text-sm text-muted" onClick={() => go("sheet")}>
              {syncLabel}
            </button>
          </div>
          <div className="relative mt-3">
            <label className="sr-only" htmlFor="desk-search">
              Search leads
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              id="desk-search"
              className="desk-field pr-12 pl-10"
              placeholder="Search name, phone, or lead ID"
              value={filters.query}
              onChange={(event) => {
                const query = event.target.value;
                setFilters((current) => ({ ...current, query }));
                if (query.trim() && section !== "leads") setSection("leads");
              }}
            />
            {filters.query ? (
              <button
                type="button"
                className="absolute top-0 right-0 flex size-11 items-center justify-center text-muted"
                aria-label="Clear search"
                onClick={() => setFilters((current) => ({ ...current, query: "" }))}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </header>
        <main id="desk-main" className="px-4 py-4 pb-16 md:px-6 md:py-6">
          {section === "home" ? <Directory user={user} onPeople={() => go("people")} /> : null}
          {section === "leads" ? (
            <Leads user={user} filters={filters} setFilters={setFilters} openId={openLead} onOpen={setOpenLead} />
          ) : null}
          {section === "people" ? <People /> : null}
          {section === "ledger" ? <Ledger user={user} onOpen={setOpenLead} /> : null}
          {section === "onboard" ? <Onboard user={user} /> : null}
          {section === "marketing" ? <MarketingView /> : null}
          {section === "sales" ? <DeptView dept="sales" /> : null}
          {section === "operations" ? <DeptView dept="operations" /> : null}
          {section === "accounts" ? <DeptView dept="accounts" /> : null}
          {section === "reports" ? <Reports /> : null}
          {section === "theme" ? <ThemePanel /> : null}
          {section === "sheet" ? <SheetsPanel admin={user.role === "admin"} /> : null}
        </main>
      </div>
      <LeadDialog user={user} openId={openLead} onOpenChange={(next) => setOpenLead(next)} />
      <Dialog.Root open={nav} onOpenChange={setNav}>
        <Dialog.Portal>
          <Dialog.Overlay className="rb-overlay fixed inset-0 z-40 bg-fg/40 md:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col justify-between bg-sidebar p-4 text-sidebar-fg outline-none md:hidden">
            <div>
              <Dialog.Title className="px-3 font-display text-xl">RB Desk</Dialog.Title>
              <Dialog.Description className="sr-only">Sections</Dialog.Description>
              <nav className="mt-6 grid gap-1" aria-label="Desk">
                {sections.map((id) => (
                  <NavButton
                    key={id}
                    icon={ICONS[id]}
                    label={labels[id]}
                    active={section === id}
                    badge={id === "people" ? pending : 0}
                    onClick={() => go(id)}
                  />
                ))}
              </nav>
            </div>
            <button type="button" className="pressable flex min-h-11 items-center gap-2 px-3 text-sm text-sidebar-muted" onClick={logout}>
              <LogOut className="size-4" />
              Sign out
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  badge: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "pressable flex min-h-11 items-center gap-3 rounded-sm px-3 text-left text-sm",
        active ? "bg-sidebar-fg/10 text-sidebar-fg" : "text-sidebar-muted",
      )}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge > 0 ? <span className="ml-auto text-xs tabular-nums text-sidebar-fg">{badge}</span> : null}
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("desk-panel p-4", className)}>{children}</section>;
}
