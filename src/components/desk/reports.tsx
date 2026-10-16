import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNames } from "@/components/desk/lookups";
import { inr } from "@/lib/rb/format";
import { funnelMonths, monthlyRevenue, partnerReport, pipelineCounts, sourceReport } from "@/lib/rb/report";
import { useDesk } from "@/lib/rb/store";

export function Reports() {
  const leads = useDesk((state) => state.leads);
  const primary = useDesk((state) => state.theme.primary);
  const line = useDesk((state) => state.theme.line);
  const ink = useDesk((state) => state.theme.ink);
  const names = useNames();
  const funnel = funnelMonths(leads);
  const sources = sourceReport(leads);
  const partners = partnerReport(leads, names);
  const revenue = monthlyRevenue(leads);
  const pipeline = pipelineCounts(leads);

  return (
    <div className="grid gap-6">
      <section>
        <h2 className="text-sm font-medium">Status transition history</h2>
        <p className="mt-1 text-sm text-muted">How many leads moved along the path, by the month of the change.</p>
        <div className="desk-panel mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {["Month", "New to progress", "Progress to pending", "Pending to deposit", "Deposit to done", "Lost", "Failed"].map(
                  (label) => (
                    <th key={label} className="px-3 py-3 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {funnel.map((row) => (
                <tr key={row.month} className="h-12 border-t border-line">
                  <td className="px-3">{row.label}</td>
                  {row.steps.map((count, index) => (
                    <td key={index} className="px-3 tabular-nums">
                      {count}
                    </td>
                  ))}
                  <td className="px-3 tabular-nums">{row.lost}</td>
                  <td className="px-3 tabular-nums">{row.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Booked and deposited value">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid stroke={line} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip formatter={(value) => inr(Number(value ?? 0))} />
              <Bar dataKey="deal" fill={primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Current pipeline">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipeline}>
              <CartesianGrid stroke={line} vertical={false} />
              <XAxis dataKey="status" tick={{ fill: ink, fontSize: 11 }} interval={0} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: ink, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill={primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
      <section>
        <h2 className="text-sm font-medium">Conversion by source</h2>
        <div className="desk-panel mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {["Source", "Leads", "Deposited", "Completed", "Rate", "Posted value", "Commission"].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((row) => (
                <tr key={row.source} className="h-12 border-t border-line">
                  <td className="px-3">{row.source}</td>
                  <td className="px-3 tabular-nums">{row.total}</td>
                  <td className="px-3 tabular-nums">{row.deposited}</td>
                  <td className="px-3 tabular-nums">{row.completed}</td>
                  <td className="px-3 tabular-nums">{row.rate}%</td>
                  <td className="px-3 tabular-nums">{inr(row.deal)}</td>
                  <td className="px-3 tabular-nums">{inr(row.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-medium">Partner productivity</h2>
        <div className="desk-panel mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                {["Partner", "Taken", "Completed", "Lost or failed", "Completed value", "Commission"].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map((row) => (
                <tr key={row.id || "none"} className="h-12 border-t border-line">
                  <td className="px-3">{row.name}</td>
                  <td className="px-3 tabular-nums">{row.taken}</td>
                  <td className="px-3 tabular-nums">{row.completed}</td>
                  <td className="px-3 tabular-nums">{row.lost}</td>
                  <td className="px-3 tabular-nums">{inr(row.deal)}</td>
                  <td className="px-3 tabular-nums">{inr(row.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="desk-panel min-w-0 p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-3 h-56 w-full min-w-0 text-muted">{children}</div>
    </article>
  );
}
