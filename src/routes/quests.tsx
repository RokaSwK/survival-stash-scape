import { createFileRoute } from "@tanstack/react-router";
import { actions, useDB } from "@/lib/store";
import { Panel } from "@/components/hud/Panel";
import { Check } from "lucide-react";

export const Route = createFileRoute("/quests")({
  head: () => ({
    meta: [
      { title: "Quests — BUNKER.OS" },
      { name: "description", content: "Preparedness missions and checklists." },
    ],
  }),
  component: QuestsPage,
});

function QuestsPage() {
  const db = useDB();
  return (
    <div className="space-y-6">
      <header>
        <div className="hud-label">SECTION 02</div>
        <h1 className="mt-1 text-2xl font-light tracking-wide">Mission Quests</h1>
        <p className="hud-num mt-1 text-xs text-muted-foreground">
          COMPLETE TO RAISE OPERATIONAL READINESS
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {db.quests.map((q) => {
          const done = q.steps.filter((s) => s.done).length;
          const pct = Math.round((done / q.steps.length) * 100);
          return (
            <Panel
              key={q.id}
              title={q.title}
              code={q.id.replace("q-", "Q.").toUpperCase()}
              action={<span className="hud-num text-xs text-accent">{pct}%</span>}
            >
              <p className="hud-num text-[11px] text-muted-foreground">{q.description}</p>
              <div className="mt-3 h-1 bg-surface-2">
                <div className="h-full bg-accent" style={{ width: `${pct}%`, boxShadow: "0 0 6px var(--accent)" }} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {q.steps.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => actions.toggleStep(q.id, s.id)}
                      className="flex w-full items-center gap-3 border border-transparent px-2 py-1.5 text-left text-sm transition hover:border-border hover:bg-surface/60"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center border ${
                          s.done ? "border-accent bg-accent/10" : "border-border"
                        }`}
                      >
                        {s.done && <Check className="h-3 w-3 text-accent" />}
                      </span>
                      <span className={s.done ? "text-muted-foreground line-through" : "text-foreground"}>
                        {s.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
