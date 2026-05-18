import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { actions, useDB, CATEGORY_LABEL } from "@/lib/store";
import { Panel } from "@/components/hud/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/caches")({
  head: () => ({
    meta: [
      { title: "Caches — BUNKER.OS" },
      { name: "description", content: "Manage stockpile locations and bug-out caches." },
    ],
  }),
  component: CachesPage,
});

function CachesPage() {
  const db = useDB();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="hud-label">SECTION 03</div>
          <h1 className="mt-1 text-2xl font-light tracking-wide">Caches</h1>
          <p className="hud-num mt-1 text-xs text-muted-foreground">
            {db.caches.length} REGISTERED LOCATIONS
          </p>
        </div>
        <AddCacheDialog />
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {db.caches.map((c) => {
          const items = db.items.filter((i) => i.cacheId === c.id);
          const byCat = (["food", "water", "medical", "tools"] as const).map((k) => ({
            k,
            n: items.filter((i) => i.category === k).length,
          }));
          return (
            <Panel
              key={c.id}
              title={c.name}
              code={c.code}
              action={
                <button
                  onClick={() => actions.deleteCache(c.id)}
                  className="text-muted-foreground transition hover:text-danger"
                  aria-label="Delete cache"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            >
              {c.notes && (
                <p className="hud-num text-[11px] text-muted-foreground">{c.notes}</p>
              )}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {byCat.map((b) => (
                  <div key={b.k} className="border border-border bg-background/40 p-2 text-center">
                    <div className="hud-label">{CATEGORY_LABEL[b.k].slice(0, 3)}</div>
                    <div className="hud-num mt-1 text-lg">{b.n}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/inventory"
                className="mt-4 block border border-border px-3 py-2 text-center font-mono text-[11px] tracking-widest text-muted-foreground transition hover:border-accent hover:text-accent"
              >
                VIEW MANIFEST →
              </Link>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function AddCacheDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", notes: "" });
  function submit() {
    if (!form.name.trim()) return;
    actions.addCache({
      name: form.name.trim(),
      code: form.code.trim() || form.name.slice(0, 3).toUpperCase(),
      notes: form.notes.trim() || undefined,
    });
    setOpen(false);
    setForm({ name: "", code: "", notes: "" });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono text-xs tracking-widest">
          <Plus className="h-4 w-4" /> NEW CACHE
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface">
        <DialogHeader>
          <DialogTitle className="hud-label !text-foreground">REGISTER CACHE</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label className="hud-label">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="hud-label">Callsign</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CAB-07"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="hud-label">Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>CANCEL</Button>
          <Button onClick={submit}>COMMIT</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
