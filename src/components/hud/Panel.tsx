import type { ReactNode } from "react";

export function Panel({
  title,
  code,
  action,
  children,
  className = "",
}: {
  title: string;
  code?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hud-panel ${className}`}>
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          {code && <span className="hud-num text-[10px] text-accent">{code}</span>}
          <h2 className="hud-label !text-foreground">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
