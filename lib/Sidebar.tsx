"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SECCIONES, seccionActiva } from "./secciones";

export default function Sidebar() {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const activa = seccionActiva(pathname);

  useEffect(() => {
    setToken(localStorage.getItem("futbol-token"));
  }, [pathname]);

  const hrefVotar = "/votar";

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar-marca">
        <span className="punto" />
        Fútbol Viernes
      </div>
      <nav className="sidebar-nav">
        {SECCIONES.map((s, i) => {
          const Icono = s.icono;
          const esActiva = activa === s.id;
          return (
            <div key={s.id}>
              {(i === 0 || SECCIONES[i - 1].grupo !== s.grupo) && (
                <div className="sidebar-grupo">{s.grupo === "juego" ? "Partido" : "Gestión"}</div>
              )}
              <Link
                href={s.id === "votar" ? hrefVotar : s.href}
                className={`sidebar-item${esActiva ? " activa" : ""}`}
                aria-current={esActiva ? "page" : undefined}
              >
                <Icono size={20} strokeWidth={esActiva ? 2.4 : 2} />
                <span>{s.nombre}</span>
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="sidebar-pie">Votación cruzada anónima</div>
    </aside>
  );
}
