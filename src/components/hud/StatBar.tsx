type Props = {
  label: string;
  value: number; // 0..100
  meta?: string;
};

export function StatBar({ label, value, meta }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 75 ? "var(--success)" : v >= 45 ? "var(--accent)" : v >= 20 ? "var(--warning)" : "var(--danger)";
  const segments = 24;
  const filled = Math.round((v / 100) * segments);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="hud-label">{label}</span>
        <span className="hud-num text-xs" style={{ color }}>
          {v}%
        </span>
      </div>
      <div className="flex h-3 gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="flex-1"
            style={{
              background: i < filled ? color : "var(--surface-2)",
              boxShadow: i < filled ? `0 0 6px ${color}` : "none",
              opacity: i < filled ? 1 : 0.5,
            }}
          />
        ))}
      </div>
      {meta && <div className="hud-num text-[10px] text-muted-foreground">{meta}</div>}
    </div>
  );
}
