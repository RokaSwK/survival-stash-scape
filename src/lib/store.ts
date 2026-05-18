import { useEffect, useState, useSyncExternalStore } from "react";

export type Category = "food" | "water" | "medical" | "tools";

export type Item = {
  id: string;
  name: string;
  category: Category;
  qty: number;
  unit: string;
  cacheId: string;
  expiresAt?: string; // ISO date
  notes?: string;
  createdAt: string;
};

export type Cache = {
  id: string;
  name: string;
  code: string; // short callsign
  notes?: string;
};

export type QuestStep = { id: string; label: string; done: boolean };
export type Quest = {
  id: string;
  title: string;
  description: string;
  steps: QuestStep[];
};

export type Settings = {
  householdSize: number;
  waterTargetLPerDay: number; // L per person per day
  foodTargetDays: number; // days of food per person
  callsign: string;
};

export type ActivityEvent = {
  id: string;
  ts: string;
  message: string;
};

export type DB = {
  caches: Cache[];
  items: Item[];
  quests: Quest[];
  settings: Settings;
  activity: ActivityEvent[];
};

const KEY = "bunker-os.v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const seed: DB = {
  settings: {
    householdSize: 2,
    waterTargetLPerDay: 4,
    foodTargetDays: 14,
    callsign: "PORTER-01",
  },
  caches: [
    { id: "home", name: "Home Base", code: "HB-01", notes: "Primary residence cache." },
    { id: "bob", name: "Bug-Out Bag", code: "BOB-72", notes: "72-hour mobile kit." },
    { id: "vehicle", name: "Vehicle", code: "VEH-04", notes: "In-trunk supplies." },
  ],
  items: [
    { id: uid(), name: "Rice (white)", category: "food", qty: 8, unit: "kg", cacheId: "home", expiresAt: addDays(420), createdAt: now() },
    { id: uid(), name: "Canned beans", category: "food", qty: 24, unit: "cans", cacheId: "home", expiresAt: addDays(180), createdAt: now() },
    { id: uid(), name: "Freeze-dried meals", category: "food", qty: 12, unit: "pouches", cacheId: "bob", expiresAt: addDays(900), createdAt: now() },
    { id: uid(), name: "Drinking water", category: "water", qty: 60, unit: "L", cacheId: "home", expiresAt: addDays(220), createdAt: now() },
    { id: uid(), name: "Water bottles", category: "water", qty: 6, unit: "L", cacheId: "vehicle", expiresAt: addDays(90), createdAt: now() },
    { id: uid(), name: "Sawyer mini filter", category: "water", qty: 1, unit: "unit", cacheId: "bob", createdAt: now() },
    { id: uid(), name: "Trauma kit (IFAK)", category: "medical", qty: 1, unit: "kit", cacheId: "home", createdAt: now() },
    { id: uid(), name: "Ibuprofen 200mg", category: "medical", qty: 60, unit: "tabs", cacheId: "home", expiresAt: addDays(25), createdAt: now() },
    { id: uid(), name: "Bandages assorted", category: "medical", qty: 30, unit: "pcs", cacheId: "bob", createdAt: now() },
    { id: uid(), name: "Headlamp", category: "tools", qty: 2, unit: "unit", cacheId: "bob", createdAt: now() },
    { id: uid(), name: "Multi-tool", category: "tools", qty: 1, unit: "unit", cacheId: "bob", createdAt: now() },
    { id: uid(), name: "Propane canister", category: "tools", qty: 4, unit: "unit", cacheId: "home", createdAt: now() },
  ],
  quests: [
    {
      id: "q-72hr",
      title: "72-Hour Kit",
      description: "Cover the first three days off-grid.",
      steps: [
        { id: uid(), label: "3 days of food per person", done: true },
        { id: uid(), label: "12L water per person", done: true },
        { id: uid(), label: "First aid kit packed", done: false },
        { id: uid(), label: "Flashlight + spare batteries", done: false },
        { id: uid(), label: "Cash + copies of IDs", done: false },
      ],
    },
    {
      id: "q-winter",
      title: "Winter Readiness",
      description: "Heat, light and morale through a cold outage.",
      steps: [
        { id: uid(), label: "Alternate heat source", done: false },
        { id: uid(), label: "Wool blankets x household", done: true },
        { id: uid(), label: "Insulated water containers", done: false },
        { id: uid(), label: "Hand/foot warmers stocked", done: false },
      ],
    },
    {
      id: "q-medical",
      title: "Medical Baseline",
      description: "Cover common injuries and chronic needs.",
      steps: [
        { id: uid(), label: "IFAK trauma kit", done: true },
        { id: uid(), label: "30 days of prescription meds", done: false },
        { id: uid(), label: "OTC analgesics + antihistamines", done: true },
        { id: uid(), label: "Burn dressings", done: false },
      ],
    },
  ],
  activity: [
    { id: uid(), ts: now(), message: "SYSTEM BOOT — bunker.os v1.0" },
    { id: uid(), ts: now(), message: "Seed inventory loaded." },
  ],
};

function now() {
  return new Date().toISOString();
}
function addDays(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

let state: DB = load();
const listeners = new Set<() => void>();

function load(): DB {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return { ...seed, ...JSON.parse(raw) };
  } catch {
    return seed;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useDB(): DB {
  // SSR-safe: server snapshot returns seed; hydrate on mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    state = load();
    setHydrated(true);
    emit();
  }, []);
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => seed
  );
  return hydrated ? snap : seed;
}

function update(mut: (d: DB) => void, log?: string) {
  const next: DB = JSON.parse(JSON.stringify(state));
  mut(next);
  if (log) {
    next.activity = [{ id: uid(), ts: now(), message: log }, ...next.activity].slice(0, 50);
  }
  state = next;
  emit();
}

export const actions = {
  addItem(input: Omit<Item, "id" | "createdAt">) {
    const item: Item = { ...input, id: uid(), createdAt: now() };
    update((d) => d.items.unshift(item), `ITEM ADDED — ${item.name} ×${item.qty}${item.unit}`);
  },
  updateItem(id: string, patch: Partial<Item>) {
    update((d) => {
      const i = d.items.findIndex((x) => x.id === id);
      if (i >= 0) d.items[i] = { ...d.items[i], ...patch };
    });
  },
  deleteItem(id: string) {
    const target = state.items.find((x) => x.id === id);
    update(
      (d) => {
        d.items = d.items.filter((x) => x.id !== id);
      },
      target ? `ITEM REMOVED — ${target.name}` : undefined
    );
  },
  addCache(c: Omit<Cache, "id">) {
    update((d) => d.caches.push({ ...c, id: uid() }), `CACHE REGISTERED — ${c.name}`);
  },
  deleteCache(id: string) {
    update((d) => {
      d.caches = d.caches.filter((c) => c.id !== id);
      d.items = d.items.filter((i) => i.cacheId !== id);
    });
  },
  toggleStep(questId: string, stepId: string) {
    update((d) => {
      const q = d.quests.find((x) => x.id === questId);
      if (!q) return;
      const s = q.steps.find((x) => x.id === stepId);
      if (!s) return;
      s.done = !s.done;
    });
  },
  updateSettings(patch: Partial<Settings>) {
    update((d) => {
      d.settings = { ...d.settings, ...patch };
    }, "SETTINGS UPDATED");
  },
  reset() {
    state = seed;
    emit();
  },
  exportJSON(): string {
    return JSON.stringify(state, null, 2);
  },
  importJSON(raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as DB;
      if (!parsed.items || !parsed.caches) return false;
      state = parsed;
      emit();
      return true;
    } catch {
      return false;
    }
  },
};

// ─────────────── derived ───────────────

const FOOD_KCAL_PER_DAY = 2000;
const KCAL_PER_UNIT: Record<string, number> = {
  kg: 3500, // rough avg for staples
  cans: 350,
  pouches: 600,
  bar: 250,
  pack: 400,
  unit: 300,
};

function itemKcal(i: Item): number {
  if (i.category !== "food") return 0;
  const per = KCAL_PER_UNIT[i.unit] ?? 300;
  return per * i.qty;
}

function itemLiters(i: Item): number {
  if (i.category !== "water") return 0;
  if (i.unit === "L") return i.qty;
  if (i.unit === "ml") return i.qty / 1000;
  return 0;
}

export type Readiness = {
  overall: number;
  food: number;
  water: number;
  medical: number;
  tools: number;
  daysFood: number;
  daysWater: number;
};

export function computeReadiness(db: DB): Readiness {
  const people = Math.max(1, db.settings.householdSize);
  const totalKcal = db.items.reduce((a, i) => a + itemKcal(i), 0);
  const daysFood = totalKcal / (FOOD_KCAL_PER_DAY * people);
  const food = clamp01(daysFood / db.settings.foodTargetDays);

  const totalL = db.items.reduce((a, i) => a + itemLiters(i), 0);
  const daysWater = totalL / (db.settings.waterTargetLPerDay * people);
  const water = clamp01(daysWater / db.settings.foodTargetDays);

  // medical / tools driven by quest completion + item count
  const medQuest = questCompletion(db, "q-medical");
  const medItems = db.items.filter((i) => i.category === "medical").length;
  const medical = clamp01(0.6 * medQuest + 0.4 * Math.min(1, medItems / 6));

  const toolsItems = db.items.filter((i) => i.category === "tools").length;
  const winter = questCompletion(db, "q-winter");
  const tools = clamp01(0.5 * winter + 0.5 * Math.min(1, toolsItems / 6));

  const overall = (food + water + medical + tools) / 4;
  return {
    overall: Math.round(overall * 100),
    food: Math.round(food * 100),
    water: Math.round(water * 100),
    medical: Math.round(medical * 100),
    tools: Math.round(tools * 100),
    daysFood: Math.round(daysFood * 10) / 10,
    daysWater: Math.round(daysWater * 10) / 10,
  };
}

function questCompletion(db: DB, id: string): number {
  const q = db.quests.find((x) => x.id === id);
  if (!q) return 0;
  return q.steps.filter((s) => s.done).length / q.steps.length;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function expiringSoon(db: DB, within = 30): Item[] {
  return db.items
    .filter((i) => i.expiresAt)
    .map((i) => ({ i, d: daysUntil(i.expiresAt)! }))
    .filter(({ d }) => d <= within)
    .sort((a, b) => a.d - b.d)
    .map(({ i }) => i);
}

export const CATEGORY_LABEL: Record<Category, string> = {
  food: "FOOD",
  water: "WATER",
  medical: "MEDICAL",
  tools: "TOOLS",
};
