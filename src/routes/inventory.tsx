import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  actions,
  useDB,
  daysUntil,
  CATEGORY_LABEL,
  type Category,
  type Item,
} from "@/lib/store";
import { Panel } from "@/components/hud/Panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — BUNKER.OS" },
      { name: "description", content: "All tracked supplies across your caches." },
    ],
  }),
  component: InventoryPage,
});

const CATEGORIES: Category[] = ["food", "water", "medical", "tools"];

function InventoryPage() {
  const db = useDB();
  const [cat, setCat] = useState<Category | "all">("all");
  const [cacheFilter, setCacheFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return db.items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (cacheFilter !== "all" && i.cacheId !== cacheFilter) return false;
      if (query && !i.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [db.items, cat, cacheFilter, query]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="hud-label">SECTION 01</div>
          <h1 className="mt-1 text-2xl font-light tracking-wide">Inventory</h1>
          <p className="hud-num mt-1 text-xs text-muted-foreground">
            {filtered.length} / {db.items.length} ITEMS DISPLAYED
          </p>
        </div>
        <AddItemDialog />
      </header>

      {/* filters */}
      <div className="hud-panel flex flex-wrap gap-3 p-3">
        <Input
          placeholder="SEARCH SUPPLIES…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 max-w-xs border-border bg-background font-mono text-xs tracking-widest placeholder:text-muted-foreground/70"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`border px-3 py-1.5 text-[11px] font-mono tracking-widest transition ${
                cat === c
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "all" ? "ALL" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <Select value={cacheFilter} onValueChange={setCacheFilter}>
          <SelectTrigger className="h-9 w-[180px] border-border bg-background font-mono text-xs tracking-widest">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL CACHES</SelectItem>
            {db.caches.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} · {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Panel title="Manifest" code="01.0">
        {filtered.length === 0 ? (
          <p className="hud-label py-12 text-center">// NO MATCHING ITEMS</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="hud-label border-b border-border text-left">
                  <th className="py-2 pr-3">ITEM</th>
                  <th className="px-3">CAT</th>
                  <th className="px-3">QTY</th>
                  <th className="px-3">CACHE</th>
                  <th className="px-3">EXPIRES</th>
                  <th className="px-3 text-right">·</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <ItemRow key={i.id} item={i} cacheName={cacheLabel(db.caches, i.cacheId)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function cacheLabel(caches: { id: string; name: string; code: string }[], id: string) {
  const c = caches.find((x) => x.id === id);
  return c ? `${c.code}` : "—";
}

function ItemRow({ item, cacheName }: { item: Item; cacheName: string }) {
  const d = daysUntil(item.expiresAt);
  const expColor =
    d === null
      ? "var(--muted-foreground)"
      : d < 0
        ? "var(--danger)"
        : d <= 30
          ? "var(--warning)"
          : "var(--muted-foreground)";
  return (
    <tr className="group border-b border-border/60 hover:bg-surface/60">
      <td className="py-2.5 pr-3">{item.name}</td>
      <td className="px-3 hud-label">{CATEGORY_LABEL[item.category]}</td>
      <td className="px-3 hud-num text-xs">{item.qty}{item.unit}</td>
      <td className="px-3 hud-num text-xs text-muted-foreground">{cacheName}</td>
      <td className="px-3 hud-num text-xs" style={{ color: expColor }}>
        {item.expiresAt
          ? d! < 0
            ? `EXPIRED ${Math.abs(d!)}d`
            : `${d}d`
          : "—"}
      </td>
      <td className="px-3 text-right">
        <button
          onClick={() => actions.deleteItem(item.id)}
          className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-danger"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function AddItemDialog() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "food" as Category,
    qty: 1,
    unit: "unit",
    cacheId: db.caches[0]?.id ?? "",
    expiresAt: "",
  });

  function submit() {
    if (!form.name.trim() || !form.cacheId) return;
    actions.addItem({
      name: form.name.trim(),
      category: form.category,
      qty: Number(form.qty) || 1,
      unit: form.unit,
      cacheId: form.cacheId,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    });
    setOpen(false);
    setForm({ ...form, name: "", qty: 1, expiresAt: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono text-xs tracking-widest">
          <Plus className="h-4 w-4" /> NEW ITEM
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface">
        <DialogHeader>
          <DialogTitle className="hud-label !text-foreground">REGISTER SUPPLY</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cache">
              <Select value={form.cacheId} onValueChange={(v) => setForm({ ...form, cacheId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {db.caches.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty">
              <Input
                type="number"
                min={0}
                step="any"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              />
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["unit", "kg", "g", "L", "ml", "cans", "pouches", "pack", "bar", "tabs", "pcs", "kit"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Expires">
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="hud-label">{label}</Label>
      {children}
    </div>
  );
}
