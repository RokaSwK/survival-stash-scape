import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { actions, useDB } from "@/lib/store";
import { Panel } from "@/components/hud/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — BUNKER.OS" },
      { name: "description", content: "Configure household and manage local data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const db = useDB();
  const [draft, setDraft] = useState(db.settings);
  const [importTxt, setImportTxt] = useState("");

  return (
    <div className="space-y-6">
      <header>
        <div className="hud-label">SECTION 04</div>
        <h1 className="mt-1 text-2xl font-light tracking-wide">Settings</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Operator Profile" code="04.1">
          <div className="grid gap-4">
            <Row label="Callsign">
              <Input
                value={draft.callsign}
                onChange={(e) => setDraft({ ...draft, callsign: e.target.value })}
              />
            </Row>
            <Row label="Household size">
              <Input
                type="number"
                min={1}
                value={draft.householdSize}
                onChange={(e) => setDraft({ ...draft, householdSize: Number(e.target.value) })}
              />
            </Row>
            <Row label="Water target (L / pax / day)">
              <Input
                type="number"
                min={1}
                step="0.5"
                value={draft.waterTargetLPerDay}
                onChange={(e) => setDraft({ ...draft, waterTargetLPerDay: Number(e.target.value) })}
              />
            </Row>
            <Row label="Food target (days / pax)">
              <Input
                type="number"
                min={1}
                value={draft.foodTargetDays}
                onChange={(e) => setDraft({ ...draft, foodTargetDays: Number(e.target.value) })}
              />
            </Row>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  actions.updateSettings(draft);
                  toast.success("Settings committed");
                }}
              >
                COMMIT
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Data Vault" code="04.2">
          <p className="hud-num text-[11px] text-muted-foreground">
            Data lives only in this browser. Export to keep a backup, import to restore.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const blob = new Blob([actions.exportJSON()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `bunker-os-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              EXPORT JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Reset all data to factory seed?")) {
                  actions.reset();
                  toast.success("Cache wiped. Seed restored.");
                }
              }}
            >
              FACTORY RESET
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            <Label className="hud-label">Paste backup JSON</Label>
            <Textarea
              value={importTxt}
              onChange={(e) => setImportTxt(e.target.value)}
              rows={5}
              className="font-mono text-xs"
              placeholder='{"items":[...],"caches":[...]}'
            />
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (actions.importJSON(importTxt)) {
                    toast.success("Import OK");
                    setImportTxt("");
                  } else {
                    toast.error("Invalid JSON");
                  }
                }}
              >
                IMPORT
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[180px_1fr]">
      <Label className="hud-label">{label}</Label>
      {children}
    </div>
  );
}
