import { DB, Jugador, Posicion, Voto } from "./db";

export interface Atributos {
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
}

export interface JugadorConNota extends Jugador {
  atributos: Atributos;
  notaPosicion: number; // 1-10, específica de su posición asignada
  numVotos: number;
}

// Promedia todos los votos recibidos por un jugador
function promedioAtributos(votos: Voto[], jugadorId: string): Atributos {
  const recibidos = votos.filter((v) => v.objetivoId === jugadorId);
  if (recibidos.length === 0) {
    return { ritmo: 5, resistencia: 5, tecnica: 5, remate: 5, defensa: 5 };
  }
  const sum = recibidos.reduce(
    (acc, v) => ({
      ritmo: acc.ritmo + v.ritmo,
      resistencia: acc.resistencia + v.resistencia,
      tecnica: acc.tecnica + v.tecnica,
      remate: acc.remate + v.remate,
      defensa: acc.defensa + v.defensa,
    }),
    { ritmo: 0, resistencia: 0, tecnica: 0, remate: 0, defensa: 0 }
  );
  const n = recibidos.length;
  return {
    ritmo: sum.ritmo / n,
    resistencia: sum.resistencia / n,
    tecnica: sum.tecnica / n,
    remate: sum.remate / n,
    defensa: sum.defensa / n,
  };
}

// Pesos de cada atributo según la posición (ajusta a tu gusto,
// cada fila debería sumar aprox. 1)
const PESOS: Record<Posicion, Atributos> = {
  DEL: { remate: 0.4, ritmo: 0.3, tecnica: 0.3, resistencia: 0, defensa: 0 },
  MED: { tecnica: 0.4, resistencia: 0.3, ritmo: 0.3, remate: 0, defensa: 0 },
  DEF: { defensa: 0.5, resistencia: 0.3, ritmo: 0.2, remate: 0, tecnica: 0 },
  POR: { defensa: 0.3, tecnica: 0.3, resistencia: 0.2, ritmo: 0.2, remate: 0 },
};

function notaPorPosicion(atributos: Atributos, posicion: Posicion): number {
  const pesos = PESOS[posicion];
  const nota =
    atributos.ritmo * pesos.ritmo +
    atributos.resistencia * pesos.resistencia +
    atributos.tecnica * pesos.tecnica +
    atributos.remate * pesos.remate +
    atributos.defensa * pesos.defensa;
  return Math.round(nota * 10) / 10;
}

export function calcularJugadoresConNota(db: DB, turno: 1 | 2): JugadorConNota[] {
  return db.jugadores
    .filter((j) => j.turno === turno)
    .map((j) => {
      const atributos = promedioAtributos(db.votos, j.id);
      const numVotos = db.votos.filter((v) => v.objetivoId === j.id).length;
      return {
        ...j,
        atributos,
        notaPosicion: notaPorPosicion(atributos, j.posicion),
        numVotos,
      };
    });
}

export interface ResultadoEquipos {
  equipoA: JugadorConNota[];
  equipoB: JugadorConNota[];
  totalA: number;
  totalB: number;
  diferencia: number;
}

function totalEquipo(equipo: JugadorConNota[]): number {
  return Math.round(equipo.reduce((s, j) => s + j.notaPosicion, 0) * 10) / 10;
}

// Genera equipos equilibrados por posición usando reparto tipo "draft
// serpiente" con barajado aleatorio entre jugadores de nota similar, y se
// queda con la mejor de varias combinaciones para minimizar la diferencia
// total.
export function generarEquipos(jugadores: JugadorConNota[], intentos = 300): ResultadoEquipos {
  const posiciones: Posicion[] = ["POR", "DEF", "MED", "DEL"];
  let mejor: ResultadoEquipos | null = null;

  for (let intento = 0; intento < intentos; intento++) {
    const equipoA: JugadorConNota[] = [];
    const equipoB: JugadorConNota[] = [];

    for (const pos of posiciones) {
      const grupo = jugadores.filter((j) => j.posicion === pos);
      const conRuido = grupo
        .map((j) => ({ j, key: j.notaPosicion + (Math.random() - 0.5) }))
        .sort((a, b) => b.key - a.key)
        .map((x) => x.j);

      let turnoA = true;
      let i = 0;
      while (i < conRuido.length) {
        if (turnoA) {
          equipoA.push(conRuido[i]);
          i++;
          if (i < conRuido.length) {
            equipoB.push(conRuido[i]);
            i++;
          }
        } else {
          equipoB.push(conRuido[i]);
          i++;
          if (i < conRuido.length) {
            equipoA.push(conRuido[i]);
            i++;
          }
        }
        turnoA = !turnoA;
      }
    }

    const totalA = totalEquipo(equipoA);
    const totalB = totalEquipo(equipoB);
    const diferencia = Math.round(Math.abs(totalA - totalB) * 10) / 10;

    if (!mejor || diferencia < mejor.diferencia) {
      mejor = { equipoA, equipoB, totalA, totalB, diferencia };
    }
    if (diferencia === 0) break;
  }

  return mejor!;
}