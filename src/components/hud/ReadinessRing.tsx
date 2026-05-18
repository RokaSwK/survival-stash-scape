type Props = {
  value: number; // 0..100
  size?: number;
  label?: string;
  sub?: string;
};

export function ReadinessRing({ value, size = 260, label = "OPERATIONAL READINESS", sub }: Props) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color =
    value >= 75 ? "var(--success)" : value >= 45 ? "var(--accent)" : value >= 20 ? "var(--warning)" : "var(--danger)";

  // tick marks
  const ticks = Array.from({ length: 60 });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* tick ring */}
        <g transform={`translate(${size / 2} ${size / 2}) rotate(90)`}>
          {ticks.map((_, i) => {
            const a = (i / ticks.length) * Math.PI * 2;
            const inner = r - 14;
            const outer = r - 8;
            const x1 = Math.cos(a) * inner;
            const y1 = Math.sin(a) * inner;
            const x2 = Math.cos(a) * outer;
            const y2 = Math.sin(a) * outer;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--border)"
                strokeWidth={1}
                opacity={i % 5 === 0 ? 0.8 : 0.35}
              />
            );
          })}
        </g>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="hud-label">{label}</div>
        <div className="hud-num mt-2 text-6xl font-light glow-text" style={{ color }}>
          {value}
          <span className="text-2xl text-muted-foreground">%</span>
        </div>
        {sub && <div className="hud-label mt-2">{sub}</div>}
      </div>
    </div>
  );
}
