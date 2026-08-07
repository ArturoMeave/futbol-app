import { Home, CalendarCheck, Trophy, Vote, ShieldCheck, LucideIcon } from "lucide-react";

export interface Seccion {
  id: string;
  nombre: string;
  icono: LucideIcon;
  href: string;
  // Prefijos de ruta que marcan esta sección como activa
  coinciden: string[];
  grupo: "juego" | "gestion";
}

export const SECCIONES: Seccion[] = [
  { id: "inicio", nombre: "Inicio", icono: Home, href: "/", coinciden: ["/"], grupo: "juego" },
  { id: "votar", nombre: "Votar", icono: Vote, href: "/votar", coinciden: ["/votar", "/unirse"], grupo: "juego" },
  { id: "equipos", nombre: "Equipos", icono: Trophy, href: "/equipos", coinciden: ["/equipos"], grupo: "juego" },
  { id: "semana", nombre: "Semana", icono: CalendarCheck, href: "/semana", coinciden: ["/semana"], grupo: "gestion" },
  { id: "admin", nombre: "Administración", icono: ShieldCheck, href: "/admin", coinciden: ["/admin"], grupo: "gestion" },
];

export function seccionActiva(pathname: string): string {
  if (pathname === "/") return "inicio";
  const s = SECCIONES.filter((x) => x.id !== "inicio").find((x) =>
    x.coinciden.some((c) => pathname === c || pathname.startsWith(c + "/"))
  );
  return s?.id ?? "inicio";
}
