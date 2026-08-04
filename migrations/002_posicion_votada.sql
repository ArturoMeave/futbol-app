-- Migration 002: voto de posición + expansión de posiciones
-- Ejecutar en Neon SQL console una sola vez.

-- Cada voto incluye ahora la posición que el votante asigna al objetivo.
-- La web agrega por moda y asigna la posición efectiva para equilibrar equipos.
ALTER TABLE votos ADD COLUMN IF NOT EXISTS posicion_votada TEXT;

-- Backfill opcional: votos antiguos sin posición votada quedan a NULL
-- (la app cae a la posición de la ficha del jugador).
