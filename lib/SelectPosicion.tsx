"use client";

import { CSSProperties } from "react";
import { POSICIONES, POSICION_LABELS, Posicion } from "./constantes";

interface Props {
  value: Posicion;
  onChange: (p: Posicion) => void;
  className?: string;
  style?: CSSProperties;
}

export default function SelectPosicion({
  value,
  onChange,
  className,
  style,
}: Props) {
  return (
    <select
      className={className ?? "campo-select"}
      style={style}
      value={value}
      onChange={(e) => onChange(e.target.value as Posicion)}
    >
      {POSICIONES.map((p) => (
        <option key={p} value={p}>
          {p} — {POSICION_LABELS[p]}
        </option>
      ))}
    </select>
  );
}
