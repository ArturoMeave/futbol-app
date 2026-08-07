ALTER TABLE jugadores
  ADD COLUMN IF NOT EXISTS votacion_finalizada BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE votos
  ADD CONSTRAINT votos_atributos_rango
  CHECK (ritmo BETWEEN 1 AND 10 AND resistencia BETWEEN 1 AND 10
    AND tecnica BETWEEN 1 AND 10 AND remate BETWEEN 1 AND 10
    AND defensa BETWEEN 1 AND 10);

CREATE UNIQUE INDEX IF NOT EXISTS jugadores_token_unico ON jugadores(token);
CREATE UNIQUE INDEX IF NOT EXISTS votos_votante_objetivo_unico
  ON votos(votante_id, objetivo_id);
CREATE INDEX IF NOT EXISTS votos_votante_idx ON votos(votante_id);
