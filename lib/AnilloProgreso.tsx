interface AnilloProgresoProps {
  valor: number;
  max?: number;
  size?: number;
  grosor?: number;
  etiqueta?: string;
  color?: string;
}

export default function AnilloProgreso({
  valor,
  max = 10,
  size = 56,
  grosor = 5,
  etiqueta,
  color = "var(--acento)",
}: AnilloProgresoProps) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const porcentaje = Math.max(0, Math.min(1, valor / max));
  const offset = circunferencia * (1 - porcentaje);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke="var(--cristal-bg-fuerte)"
          strokeWidth={grosor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.4s ease",
            filter: `drop-shadow(0 0 6px ${color === "var(--acento)" ? "var(--acento-glow)" : "transparent"})`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sora)",
            fontWeight: 700,
            fontSize: size * 0.28,
            color: "var(--texto)",
          }}
        >
          {valor.toFixed(1)}
        </span>
        {etiqueta && (
          <span
            style={{
              fontSize: size * 0.13,
              color: "var(--texto-secundario)",
              marginTop: 2,
            }}
          >
            {etiqueta}
          </span>
        )}
      </div>
    </div>
  );
}
