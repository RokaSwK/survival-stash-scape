import { createFileRoute, Link } from "@tanstack/react-router";
import { useDB, computeReadiness, expiringSoon, daysUntil, CATEGORY_LABEL } from "@/lib/store";
import { ReadinessRing } from "@/components/hud/ReadinessRing";
import { StatBar } from "@/components/hud/StatBar";
import { Panel } from "@/components/hud/Panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BUNKER.OS" },
      {
        name: "description",
        content: "Operational readiness HUD: stockpile coverage, alerts and recent activity.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const db = useDB();
  const r = computeReadiness(db);
  const alerts = expiringSoon(db, 60).slice(0, 6);
  const status = r.overall >= 75 ? "OPERATIONAL" : r.overall >= 45 ? "DEGRADED" : r.overall >= 20 ? "CRITICAL" : "OFFLINE";
  const statusColor =
    r.overall >= 75
      ? "var(--success)"
      : r.overall >= 45
        ? "var(--accent)"
        : r.overall >= 20
          ? "var(--warning)"
          : "var(--danger)";

  return (
    <div className="space-y-6">
      {/* Status strip */}
      <div className="hud-panel flex flex-wrap items-center gap-6 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full animate-hud-pulse" style={{ background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
          <span className="hud-label">STATUS</span>
          <span className="hud-num text-sm" style={{ color: statusColor }}>{status}</span>
        </div>
        <Divider />
        <Meta label="CALLSIGN" value={db.settings.callsign} />
        <Divider />
        <Meta label="HOUSEHOLD" value={`${db.settings.householdSize} SOULS`} />
        <Divider />
        <Meta label="CACHES" value={String(db.caches.length).padStart(2, "0")} />
        <Divider />
        <Meta label="ITEMS" value={String(db.items.length).padStart(3, "0")} />
      </div>

      {/* HUD grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness */}
        <Panel title="Operational Readiness" code="00.1" className="lg:col-span-2">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="flex justify-center">
              <ReadinessRing value={r.overall} sub={`AUTONOMY ${Math.min(r.daysFood, r.daysWater).toFixed(1)} DAYS`} />
            </div>
            <div className="space-y-5">
              <StatBar label="Food" value={r.food} meta={`${r.daysFood} days @ ${db.settings.householdSize} pax`} />
              <StatBar label="Water" value={r.water} meta={`${r.daysWater} days @ ${db.settings.waterTargetLPerDay}L/pax/day`} />
              <StatBar label="Medical" value={r.medical} meta="quest + kit coverage" />
              <StatBar label="Tools & gear" value={r.tools} meta="quest + inventory" />
            </div>
          </div>
        </Panel>

        {/* Alerts */}
        <Panel
          title="Alerts"
          code="00.2"
          action={
            <Link to="/inventory" className="hud-label hover:text-accent">
              VIEW ALL →
            </Link>
          }
        >
          {alerts.length === 0 ? (
            <p className="hud-label py-8 text-center">// NO PENDING ALERTS</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((i) => {
                const d = daysUntil(i.expiresAt);
                const expired = (d ?? 0) < 0;
                const color = expired ? "var(--danger)" : (d ?? 0) <= 14 ? "var(--warning)" : "var(--muted-foreground)";
                return (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 border-l-2 bg-surface/40 px-3 py-2"
                    style={{ borderColor: color }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">{i.name}</div>
                      <div className="hud-label mt-0.5">{CATEGORY_LABEL[i.category]} · {i.qty}{i.unit}</div>
                    </div>
                    <div className="hud-num text-xs whitespace-nowrap" style={{ color }}>
                      {expired ? `−${Math.abs(d!)}d` : `${d}d`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Quick links + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Mission Quests" code="00.3" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {db.quests.map((q) => {
              const done = q.steps.filter((s) => s.done).length;
              const pct = Math.round((done / q.steps.length) * 100);
              return (
                <Link
                  key={q.id}
                  to="/quests"
                  className="group border border-border bg-surface/50 p-4 transition hover:border-border-strong hover:bg-surface"
                >
                  <div className="hud-label">{q.id.toUpperCase()}</div>
                  <div className="mt-2 text-sm">{q.title}</div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="hud-num text-xs text-accent">{pct}%</span>
                    <span className="hud-num text-[10px] text-muted-foreground">{done}/{q.steps.length}</span>
                  </div>
                  <div className="mt-2 h-1 bg-surface-2">
                    <div className="h-full bg-accent" style={{ width: `${pct}%`, boxShadow: "0 0 6px var(--accent)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel title="Activity Log" code="00.4">
          <ul className="space-y-1.5 font-mono text-[11px]">
            {db.activity.slice(0, 10).map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="text-accent">{new Date(a.ts).toTimeString().slice(0, 8)}</span>
                <span className="text-muted-foreground">›</span>
                <span className="text-foreground/90">{a.message}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hud-label">{label}</span>
      <span className="hud-num text-sm">{value}</span>
    </div>
  );
}
function Divider() {
  return <span className="hidden h-4 w-px bg-border sm:inline-block" />;
}
