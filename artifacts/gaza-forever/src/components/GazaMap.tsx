import { STAGE_DEFS } from "../lib/gameConstants";

const STAGES = STAGE_DEFS.map((s, i) => ({
  ...s,
  pinX: [44, 40, 38, 34][i],
  pinY: [32, 85, 155, 230][i],
}));

const STRIP_PATH = "M 12 5 L 78 10 L 78 55 L 76 115 L 67 205 L 58 248 L 20 250 L 12 246 L 9 205 L 10 115 L 10 55 Z";

interface GazaMapProps {
  currentStage: number;
}

export default function GazaMap({ currentStage }: GazaMapProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#9ca3af", letterSpacing: 1, marginBottom: 2 }}>
        ROUTE MAP
      </div>
      <svg
        viewBox="0 0 90 270"
        width={110}
        height={330}
        style={{ display: "block", background: "rgba(0,0,0,0.4)", border: "1px solid #44403c", borderRadius: 4 }}
      >
        {/* Mediterranean label */}
        <text x="82" y="40" fill="#38bdf8" fontSize="3.5" textAnchor="middle" fontFamily="monospace" opacity="0.7" transform="rotate(-90, 82, 40)">MED</text>

        {/* Egypt label */}
        <rect x="12" y="250" width="48" height="15" fill="#374151" opacity="0.2" rx="2" />
        <text x="36" y="261" fill="#9ca3af" fontSize="3.5" textAnchor="middle" fontFamily="monospace" opacity="0.8">EGYPT</text>

        {/* Gaza strip */}
        <path d={STRIP_PATH} fill="#1c1917" stroke="#78716c" strokeWidth="1.2" />

        {/* Completed zone fills */}
        {STAGES.map((s, i) => {
          if (i >= currentStage) return null;
          const zones = [
            "M 12 5 L 78 10 L 78 55 L 10 55 Z",
            "M 10 55 L 78 55 L 76 115 L 10 115 Z",
            "M 10 115 L 76 115 L 67 205 L 9 205 Z",
            "M 9 205 L 67 205 L 58 248 L 20 250 L 12 246 Z",
          ];
          return <path key={i} d={zones[i]} fill={s.color} opacity="0.12" />;
        })}

        {/* Dashed path line */}
        <polyline
          points={STAGES.map((s) => `${s.pinX},${s.pinY}`).join(" ")}
          fill="none"
          stroke="#44403c"
          strokeWidth="1"
          strokeDasharray="3,4"
          opacity="0.7"
        />

        {/* Stage pins */}
        {STAGES.map((s, i) => {
          const active = i === currentStage;
          const done = i < currentStage;
          return (
            <g key={i}>
              {/* Completed segment line */}
              {done && i < STAGES.length - 1 && (
                <line
                  x1={s.pinX} y1={s.pinY}
                  x2={STAGES[i + 1].pinX} y2={STAGES[i + 1].pinY}
                  stroke={s.color} strokeWidth="1.5" opacity="0.5"
                />
              )}
              {/* Pulsing ring for active */}
              {active && (
                <circle cx={s.pinX} cy={s.pinY} r="11" fill="none" stroke={s.color} strokeWidth="1" opacity="0.5">
                  <animate attributeName="r" from="7" to="16" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Pin circle */}
              <circle
                cx={s.pinX} cy={s.pinY}
                r={active ? 7 : done ? 6 : 4.5}
                fill={active ? s.color : done ? s.color : "#2a2a2a"}
                stroke={active ? "#fff" : done ? s.color : "#555"}
                strokeWidth={active ? 1.5 : 0.8}
                opacity={done || active ? 1 : 0.45}
              />
              {/* Check mark for done */}
              {done && (
                <text x={s.pinX} y={s.pinY + 3.5} textAnchor="middle" fill="#fff" fontSize="6" fontFamily="monospace">✓</text>
              )}
              {/* Active dot */}
              {active && (
                <circle cx={s.pinX} cy={s.pinY} r="2.5" fill="#fff" opacity="0.95" />
              )}
              {/* Label */}
              <text
                x={s.pinX + 10} y={s.pinY + 3}
                fill={active ? s.color : done ? s.color : "#6b7280"}
                fontSize="4.5"
                fontFamily="monospace"
                opacity={active || done ? 1 : 0.5}
                fontWeight={active ? "bold" : "normal"}
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
