-- Migration: historial_equipos
-- Ejecutar en Neon SQL console (https://console.neon.tech) una sola vez.

CREATE TABLE IF NOT EXISTS historial_equipos (
  id SERIAL PRIMARY KEY,
  turno_id TEXT NOT NULL,
  turno_nombre TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_a NUMERIC(5,1) NOT NULL,
  total_b NUMERIC(5,1) NOT NULL,
  diferencia NUMERIC(5,1) NOT NULL,
  equipo_a JSONB NOT NULL,
  equipo_b JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_historial_turno ON historial_equipos (turno_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_equipos (fecha DESC);
