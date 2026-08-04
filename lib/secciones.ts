import { Home, CalendarCheck, Trophy, Vote, ShieldCheck, LucideIcon } from "lucide-react";

export interface Seccion {
  id: string;
  nombre: string;
  icono: LucideIcon;
  href: string;
  // Prefijos de ruta que marcan esta sección como activa
  coinciden: string[];
}

export const SECCIONES: Seccion[] = [
  { id: "inicio", nombre: "Inicio", icono: Home, href: "/", coinciden: ["/"] },
  { id: "semana", nombre: "Semana", icono: CalendarCheck, href: "/semana", coinciden: ["/semana"] },
  { id: "equipos", nombre: "Equipos", icono: Trophy, href: "/equipos", coinciden: ["/equipos"] },
  { id: "votar", nombre: "Votar", icono: Vote, href: "/votar", coinciden: ["/votar", "/unirse"] },
  { id: "admin", nombre: "Admin", icono: ShieldCheck, href: "/admin", coinciden: ["/admin"] },
];

export function seccionActiva(pathname: string): string {
  if (pathname === "/") return "inicio";
  const s = SECCIONES.filter((x) => x.id !== "inicio").find((x) =>
    x.coinciden.some((c) => pathname === c || pathname.startsWith(c + "/"))
  );
  return s?.id ?? "inicio";
}
