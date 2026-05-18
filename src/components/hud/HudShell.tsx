import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "DASHBOARD", code: "00" },
  { to: "/inventory", label: "INVENTORY", code: "01" },
  { to: "/quests", label: "QUESTS", code: "02" },
  { to: "/caches", label: "CACHES", code: "03" },
  { to: "/settings", label: "SETTINGS", code: "04" },
] as const;

export function HudShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        d.toISOString().slice(0, 10) +
          " " +
          d.toTimeString().slice(0, 8) +
          " " +
          Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen text-foreground">
      {/* Top HUD bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-hud-pulse glow-box" />
            <span className="hud-num text-sm tracking-widest">BUNKER.OS</span>
            <span className="hud-label hidden sm:inline">v1.0</span>
          </Link>
          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`group flex items-center gap-2 border border-transparent px-3 py-1.5 text-[11px] transition ${
                    active
                      ? "border-border-strong bg-surface text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <span className="hud-num text-[10px] text-muted-foreground">{n.code}</span>
                  <span className="font-mono tracking-[0.18em]">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden items-center gap-4 lg:flex">
            <span className="hud-label">UPLINK</span>
            <span className="hud-num text-xs text-accent">{time}</span>
          </div>
        </div>
        {/* mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`whitespace-nowrap border px-3 py-1 text-[10px] font-mono tracking-widest ${
                  active
                    ? "border-border-strong bg-surface"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-8 animate-hud-boot">
        {children}
      </main>

      <footer className="relative z-10 mx-auto max-w-[1400px] px-6 py-6">
        <div className="hud-label flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <span>BUNKER.OS // OFFLINE-FIRST // LOCAL CACHE ONLY</span>
          <span>NO TELEMETRY · NO ACCOUNT</span>
        </div>
      </footer>
    </div>
  );
}
