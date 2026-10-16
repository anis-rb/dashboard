import { Button } from "@/components/ui/button";
import { inr } from "@/lib/rb/format";
import { bookCommission, bookValue } from "@/lib/rb/report";
import { useDesk } from "@/lib/rb/store";
import type { Campaign, DeptMetric } from "@/lib/rb/types";

const DEPT_COPY = {
  sales: "Pipeline the desk is working, plus the numbers sales keeps by hand.",
  operations: "Files in motion, plus the operations log.",
  accounts: "Commission that has posted, plus the accounts log.",
} as const;

export function MarketingView() {
  const campaigns = useDesk((state) => state.campaigns);
  const leads = useDesk((state) => state.leads);
  const saveCampaign = useDesk((state) => state.saveCampaign);
  const addCampaign = useDesk((state) => state.addCampaign);
  const removeCampaign = useDesk((state) => state.removeCampaign);
  const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const adLeads = campaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
  const onBook = leads.filter((lead) => lead.source === "Campaign").length;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Spend" value={inr(spend)} />
        <Stat label="Ad-platform leads" value={String(adLeads)} />
        <Stat label="On the book from Campaign" value={String(onBook)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={addCampaign}>Add campaign</Button>
      </div>
      <div className="grid gap-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onChange={saveCampaign} onRemove={() => removeCampaign(campaign.id)} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onChange,
  onRemove,
}: {
  campaign: Campaign;
  onChange: (row: Campaign) => void;
  onRemove: () => void;
}) {
  return (
    <article className="desk-panel grid gap-3 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input className="desk-field" value={campaign.name} onChange={(e) => onChange({ ...campaign, name: e.target.value })} aria-label="Campaign name" />
        <input className="desk-field" value={campaign.channel} onChange={(e) => onChange({ ...campaign, channel: e.target.value })} aria-label="Channel" />
        <input className="desk-field tabular-nums" inputMode="numeric" value={campaign.spend} onChange={(e) => onChange({ ...campaign, spend: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label="Spend" />
        <input className="desk-field tabular-nums" inputMode="numeric" value={campaign.leads} onChange={(e) => onChange({ ...campaign, leads: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label="Ad leads" />
        <select className="desk-field" value={campaign.status} onChange={(e) => onChange({ ...campaign, status: e.target.value as Campaign["status"] })}>
          <option>Live</option>
          <option>Paused</option>
          <option>Ended</option>
        </select>
        <input className="desk-field" value={campaign.note} onChange={(e) => onChange({ ...campaign, note: e.target.value })} aria-label="Note" />
        <input className="desk-field" type="date" value={campaign.start} onChange={(e) => onChange({ ...campaign, start: e.target.value })} aria-label="Start" />
        <input className="desk-field" type="date" value={campaign.end} onChange={(e) => onChange({ ...campaign, end: e.target.value })} aria-label="End" />
      </div>
      <div className="flex justify-end">
        <Button variant="danger" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </article>
  );
}

export function DeptView({ dept }: { dept: "sales" | "operations" | "accounts" }) {
  const leads = useDesk((state) => state.leads);
  const metrics = useDesk((state) => state.departments.filter((metric) => metric.dept === dept));
  const saveMetric = useDesk((state) => state.saveMetric);
  const live =
    dept === "sales"
      ? [
          { label: "Open pipeline", value: inr(bookValue(leads, ["New Enquiry", "In Progress", "Pending"])) },
          { label: "Deposited", value: inr(bookValue(leads, ["Deposited"])) },
          { label: "Completed", value: inr(bookValue(leads, ["Completed"])) },
        ]
      : dept === "operations"
        ? [
            { label: "In progress", value: String(leads.filter((lead) => lead.status === "In Progress").length) },
            { label: "Pending", value: String(leads.filter((lead) => lead.status === "Pending").length) },
            { label: "Deposited", value: String(leads.filter((lead) => lead.status === "Deposited").length) },
          ]
        : [
            { label: "Posted commission", value: inr(bookCommission(leads, ["Deposited", "Completed"])) },
            { label: "Ready to settle", value: inr(bookCommission(leads, ["Completed"])) },
            { label: "Still open", value: inr(bookCommission(leads, ["New Enquiry", "In Progress", "Pending"])) },
          ];

  return (
    <div className="grid gap-6">
      <p className="max-w-xl text-sm text-muted">{DEPT_COPY[dept]}</p>
      <div>
        <h2 className="text-sm font-medium">From the lead book</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {live.map((item) => (
            <Stat key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-medium">Logged by the desk</h2>
        <div className="mt-3 grid gap-3">
          {metrics.map((metric) => (
            <MetricRow key={metric.id} metric={metric} onChange={(patch) => saveMetric(metric.id, patch)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="desk-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl tabular-nums">{value}</p>
    </article>
  );
}

function MetricRow({ metric, onChange }: { metric: DeptMetric; onChange: (patch: Partial<DeptMetric>) => void }) {
  return (
    <div className="desk-panel grid gap-3 p-4 md:grid-cols-[12rem_1fr_1.4fr]">
      <p className="text-sm font-medium">{metric.label}</p>
      <input className="desk-field" value={metric.value} onChange={(e) => onChange({ value: e.target.value })} aria-label={metric.label} />
      <input className="desk-field" value={metric.note} onChange={(e) => onChange({ note: e.target.value })} aria-label={`${metric.label} note`} />
    </div>
  );
}
