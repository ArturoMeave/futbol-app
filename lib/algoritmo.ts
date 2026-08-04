import { DB, Jugador, Posicion, Voto, POSICIONES, posicionEfectivaVotos } from "./db";

function conteoVacio(): Record<Posicion, number> {
  const r = {} as Record<Posicion, number>;
  for (const p of POSICIONES) r[p] = 0;
  return r;
}

export interface Atributos {
  ritmo: number;
  resistencia: number;
  tecnica: number;
  remate: number;
  defensa: number;
}

export interface JugadorConNota extends Jugador {
  atributos: Atributos;
  notaPosicion: number; // 1-10, específica de su posición efectiva
  numVotos: number;
  posicionFicha: Posicion; // posición asignada en la ficha
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

// Pesos de cada atributo según la posición (cada fila suma 1)
const PESOS: Record<Posicion, Atributos> = {
  POR: { defensa: 0.3, tecnica: 0.3, resistencia: 0.2, ritmo: 0.2, remate: 0 },
  DFC: { defensa: 0.5, resistencia: 0.3, ritmo: 0.2, tecnica: 0, remate: 0 },
  LD:  { ritmo: 0.4, defensa: 0.3, resistencia: 0.2, tecnica: 0.1, remate: 0 },
  LI:  { ritmo: 0.4, defensa: 0.3, resistencia: 0.2, tecnica: 0.1, remate: 0 },
  MCD: { defensa: 0.3, tecnica: 0.3, resistencia: 0.3, ritmo: 0.1, remate: 0 },
  MC:  { tecnica: 0.4, resistencia: 0.3, ritmo: 0.3, remate: 0, defensa: 0 },
  MP:  { tecnica: 0.4, remate: 0.3, ritmo: 0.3, defensa: 0, resistencia: 0 },
  EX:  { ritmo: 0.4, tecnica: 0.3, remate: 0.3, defensa: 0, resistencia: 0 },
  DEL: { remate: 0.4, ritmo: 0.3, tecnica: 0.3, defensa: 0, resistencia: 0 },
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

export function calcularJugadoresConNota(db: DB, turno: string): JugadorConNota[] {
  return db.jugadores
    .filter((j) => j.turno === turno)
    .map((j) => {
      const atributos = promedioAtributos(db.votos, j.id);
      const numVotos = db.votos.filter((v) => v.objetivoId === j.id).length;
      // Posición efectiva: moda de los votos recibidos, fallback a la ficha
      const efectiva = posicionEfectivaVotos(db.votos, j.id) ?? j.posicion;
      return {
        ...j,
        posicion: efectiva, // para que el reparto use la efectiva
        posicionFicha: j.posicion,
        atributos,
        notaPosicion: notaPorPosicion(atributos, efectiva),
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
export function generarEquipos(
  jugadores: JugadorConNota[],
  intentos = 300
): ResultadoEquipos {
  const posiciones: Posicion[] = [
    "POR",
    "LD",
    "DFC",
    "LI",
    "MCD",
    "MC",
    "MP",
    "EX",
    "DEL",
  ];

  // Si el número total de jugadores es impar, dejamos uno fuera (el de nota
  // más baja global) para garantizar N vs N. Si es par, se reparten todos.
  let pool = [...jugadores];
  if (pool.length % 2 !== 0) {
    pool.sort((a, b) => b.notaPosicion - a.notaPosicion);
    pool = pool.slice(0, pool.length - 1);
  }
  const objetivoPorEquipo = pool.length / 2;

  // Cuántos jugadores de cada posición deben ir a cada equipo (reparto
  // equilibrado por posición). Si una posición tiene un número impar, el
  // "extra" se asigna de forma alterna entre A y B.
  const porPosicion: Record<Posicion, number> = conteoVacio();

  const numPorPosicion: Record<Posicion, number> = conteoVacio();

  for (const pos of posiciones) {
    numPorPosicion[pos] = pool.filter((j) => j.posicion === pos).length;
  }

  let mejor: ResultadoEquipos | null = null;

  for (let intento = 0; intento < intentos; intento++) {
    const equipoA: JugadorConNota[] = [];
    const equipoB: JugadorConNota[] = [];
    // Lleva cuántos de cada posición ya tiene el equipo A
    const cuentaA: Record<Posicion, number> = conteoVacio();
    // Cuántos de cada posición van a cada equipo
    const metaA: Record<Posicion, number> = conteoVacio();

    // Repartir meta por posición: base mitad + reparto del resto
    for (const pos of posiciones) {
      const total = numPorPosicion[pos];
      // base entera por equipo
      const base = Math.floor(total / 2);
      metaA[pos] = base;
      // si sobra uno, alternar entre intentos para que no siempre caiga en A
      if (total % 2 === 1) {
        if (intento % 2 === 0) metaA[pos] += 1;
      }
    }

    // Ajuste: si el equipo A excede el objetivo, quitamos de las posiciones
    // con más sobrecarga. Bucle sencillo de equilibrio.
    const sumaMetaA = posiciones.reduce((s, p) => s + metaA[p], 0);
    let diff = sumaMetaA - objetivoPorEquipo;
    while (diff > 0) {
      // quitar 1 de la posición con más jugadores en A
      let posMax: Posicion | null = null;
      let maxVal = -1;
      for (const pos of posiciones) {
        if (metaA[pos] > maxVal) {
          maxVal = metaA[pos];
          posMax = pos;
        }
      }
      if (posMax && metaA[posMax] > 0) {
        metaA[posMax]--;
        diff--;
      } else break;
    }
    while (diff < 0) {
      let posMax: Posicion | null = null;
      let maxVal = -1;
      for (const pos of posiciones) {
        const disponible = numPorPosicion[pos] - metaA[pos];
        if (disponible > maxVal) {
          maxVal = disponible;
          posMax = pos;
        }
      }
      if (posMax) {
        metaA[posMax]++;
        diff++;
      } else break;
    }

    for (const pos of posiciones) {
      const grupo = pool.filter((j) => j.posicion === pos);
      const conRuido = grupo
        .map((j) => ({ j, key: j.notaPosicion + (Math.random() - 0.5) }))
        .sort((a, b) => b.key - a.key)
        .map((x) => x.j);

      // Reparto serpiente asignando alternadamente a A y B, respetando metaA
      let turnoA = true;
      let i = 0;
      while (i < conRuido.length) {
        const quedaA = metaA[pos] - cuentaA[pos];
        const yaB = i - cuentaA[pos];
        const quedaB = numPorPosicion[pos] - metaA[pos] - yaB;

        let aAsignado = false;
        if (turnoA && quedaA > 0) {
          equipoA.push(conRuido[i]);
          cuentaA[pos]++;
          i++;
          aAsignado = true;
        } else if (!turnoA && quedaB > 0) {
          equipoB.push(conRuido[i]);
          i++;
          aAsignado = true;
        } else if (quedaA > 0) {
          equipoA.push(conRuido[i]);
          cuentaA[pos]++;
          i++;
          aAsignado = true;
        } else if (quedaB > 0) {
          equipoB.push(conRuido[i]);
          i++;
          aAsignado = true;
        }

        if (!aAsignado) {
          i++;
        }
        turnoA = !turnoA;
      }
      porPosicion[pos] = cuentaA[pos];
    }

    // Validación estricta: equipos deben ser del mismo tamaño
    if (equipoA.length !== equipoB.length) continue;

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